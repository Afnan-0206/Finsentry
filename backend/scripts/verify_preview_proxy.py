import urllib.request
import json
import time

PREVIEW_BASE = "http://127.0.0.1:4173"

def test_endpoint(name, url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    print(f"\n--- Testing {name}: {url} ---")
    start = time.time()
    try:
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        with urllib.request.urlopen(req, timeout=15) as resp:
            elapsed = time.time() - start
            status = resp.status
            content_type = resp.headers.get("Content-Type", "")
            raw = resp.read()
            print(f"Status: {status} ({elapsed:.3f}s), Content-Type: {content_type}, Length: {len(raw)} bytes")
            if "application/json" in content_type:
                parsed = json.loads(raw.decode("utf-8"))
                if isinstance(parsed, dict):
                    print("Sample JSON keys:", list(parsed.keys())[:8])
                elif isinstance(parsed, list):
                    print(f"JSON Array items: {len(parsed)}")
                return True, parsed
            elif "text/html" in content_type:
                print(f"HTML Preview: {raw.decode('utf-8')[:150]}...")
                return True, "HTML"
            elif "text/csv" in content_type:
                lines = raw.decode("utf-8").strip().splitlines()
                print(f"CSV Total Lines: {len(lines)}, Header: {lines[0]}")
                return True, "CSV"
            return True, raw
    except Exception as e:
        print(f"FAILED: {e}")
        return False, str(e)

def test_sse_streaming():
    url = f"{PREVIEW_BASE}/api/chat/stream"
    print(f"\n--- Testing SSE Streaming Proxy: {url} ---")
    payload = json.dumps({"message": "What is my total savings?", "model": "qwen2.5:0.5b"}).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    start = time.time()
    try:
        req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=30) as resp:
            print(f"Connected to stream. Status: {resp.status}, Content-Type: {resp.headers.get('Content-Type')}")
            events_received = 0
            tokens_preview = []
            meta_data = None
            
            for chunk in resp:
                line = chunk.decode("utf-8")
                if line.startswith("event: meta"):
                    events_received += 1
                elif line.startswith("event: token"):
                    events_received += 1
                elif line.startswith("event: done"):
                    events_received += 1
                    break
                elif line.startswith("data: ") and events_received > 0:
                    data_body = line[6:].strip()
                    try:
                        d = json.loads(data_body)
                        if isinstance(d, dict) and "provider" in d:
                            meta_data = d
                        elif isinstance(d, str):
                            if len(tokens_preview) < 8:
                                tokens_preview.append(d)
                    except:
                        pass
                        
            elapsed = time.time() - start
            print(f"SSE Streaming Successful! Received events, elapsed: {elapsed:.2f}s")
            print(f"Meta provider: {meta_data.get('provider') if meta_data else 'N/A'}")
            print(f"Tokens sample: {' '.join(tokens_preview)}...")
            return True
    except Exception as e:
        print(f"SSE Streaming FAILED: {e}")
        return False

if __name__ == "__main__":
    results = {}
    
    # 1. Frontend HTML via Vite Preview
    ok, _ = test_endpoint("Frontend SPA Root", f"{PREVIEW_BASE}/")
    results["Frontend SPA Root"] = ok
    
    # 2. System Status through Proxy
    ok, status_data = test_endpoint("System Status Proxy", f"{PREVIEW_BASE}/api/system/status")
    results["System Status Proxy"] = ok
    if ok and isinstance(status_data, dict):
        print(f"  Storage Type: {status_data.get('storage_type')}")
        print(f"  Total Transactions in DB: {status_data.get('total_transactions')}")
    
    # 3. Dashboard Summary
    ok, _ = test_endpoint("Dashboard Summary Proxy", f"{PREVIEW_BASE}/api/dashboard/summary")
    results["Dashboard Summary"] = ok
    
    # 4. Dashboard Trends
    ok, _ = test_endpoint("Dashboard Trends Proxy", f"{PREVIEW_BASE}/api/dashboard/trends")
    results["Dashboard Trends"] = ok
    
    # 5. Transactions
    ok, _ = test_endpoint("Transactions List Proxy", f"{PREVIEW_BASE}/api/transactions?limit=5")
    results["Transactions List"] = ok
    
    # 6. Subscriptions
    ok, _ = test_endpoint("Subscriptions Proxy", f"{PREVIEW_BASE}/api/subscriptions")
    results["Subscriptions"] = ok
    
    # 7. Anomalies
    ok, _ = test_endpoint("Anomalies Proxy", f"{PREVIEW_BASE}/api/anomalies")
    results["Anomalies"] = ok
    
    # 8. Forecast
    ok, _ = test_endpoint("Forecast 7-day Proxy", f"{PREVIEW_BASE}/api/forecast/7-day")
    results["Forecast 7-day"] = ok
    
    # 9. Recommendations
    ok, _ = test_endpoint("Recommendations Proxy", f"{PREVIEW_BASE}/api/recommendations")
    results["Recommendations"] = ok
    
    # 10. Chat Status
    ok, _ = test_endpoint("Chat Status Proxy", f"{PREVIEW_BASE}/api/chat/status")
    results["Chat Status"] = ok
    
    # 11. Transactions CSV Export (Download)
    ok, _ = test_endpoint("CSV Export Download Proxy", f"{PREVIEW_BASE}/api/transactions/export")
    results["CSV Export Download"] = ok
    
    # 12. SSE Streaming Test
    results["SSE Streaming Proxy"] = test_sse_streaming()
    
    print("\n==========================================")
    print("SUMMARY OF PROXY & PREVIEW TESTS")
    print("==========================================")
    all_ok = True
    for name, res in results.items():
        status_str = "PASS" if res else "FAIL"
        print(f"  {name:30s} -> {status_str}")
        if not res:
            all_ok = False
            
    print(f"\nOVERALL RESULT: {'ALL TESTS PASSED' if all_ok else 'SOME TESTS FAILED'}")
