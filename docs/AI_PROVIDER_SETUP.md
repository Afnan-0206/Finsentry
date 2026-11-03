# FinSentry AI — AI Provider Setup & Configuration Guide

FinSentry AI features a provider-agnostic, multi-tier AI inference architecture. The system grounds all natural language responses in real-time, deterministic SQLite ledger calculations, preventing hallucinations while maintaining high conversational fluency.

---

## 1. Provider Architecture Overview

The system supports three interchangeable inference providers:

| Provider | Target Environment | Key Feature | Grounding Mechanism |
| :--- | :--- | :--- | :--- |
| **Local Ollama** | Local Development & Evaluation | Private, offline, zero cloud API fees | System prompt + SQLite facts injection |
| **Cloudflare Workers AI** | Cloud Production | Serverless global inference, high throughput | Account API token + REST gateway |
| **Deterministic Engine** | Offline / Zero-LLM Fallback | 100% reliable rule-based calculations | Python SQLAlchemy math execution |

If the configured LLM provider times out, encounters a network disruption, or is offline, FinSentry AI **automatically fails over to the Deterministic Engine**. The user never experiences application crashes or blank responses.

---

## 2. Setting Up Local Ollama Inference

### Step 1: Verify Ollama Installation
Ensure Ollama is installed and running on your local machine:
```powershell
ollama --version
# e.g., ollama version is 0.40.13
```

Check the models installed locally:
```powershell
ollama list
```
*FinSentry AI has been verified with `qwen2.5:7b` (high analytical reasoning) and `qwen2.5:0.5b` (ultra-low latency).*

### Step 2: Configure Environment Variables
Create or update `backend/.env` (or project root `.env`):
```env
AI_PROVIDER="ollama"
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="qwen2.5:7b"
OLLAMA_TIMEOUT=60.0
```

> **Tip for Low-Resource Systems:**  
> If running on CPU-only machines without GPU acceleration, `qwen2.5:0.5b` achieves 5-8x faster generation latency (~8–10 seconds) compared to `7b`. Set `OLLAMA_MODEL="qwen2.5:0.5b"` for instantaneous response times.

### Step 3: Test Ollama Connectivity
You can test the provider directly using the FinSentry status endpoint:
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8001/api/chat/status"
```
Response:
```json
{
  "configured_provider": "ollama",
  "active_provider": "Local Ollama (qwen2.5:7b)",
  "model": "qwen2.5:7b",
  "status": "operational",
  "is_available": true,
  "fallback_available": true
}
```

---

## 3. Setting Up Cloudflare Workers AI (Production)

Cloudflare Workers AI provides serverless access to state-of-the-art open models (`@cf/meta/llama-3.1-8b-instruct`, `@cf/qwen/qwen1.5-7b-chat`) via an authenticated HTTP REST API.

### Step 1: Obtain Cloudflare Credentials
1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Navigate to **Workers & Pages** $\to$ **Workers AI**.
3. Copy your **Account ID** from the right-hand panel.
4. Go to **My Profile** $\to$ **API Tokens** $\to$ **Create Token** $\to$ use the **Workers AI Read/Edit** template.

### Step 2: Configure Environment Variables
In your production environment (or `.env`):
```env
AI_PROVIDER="cloudflare"
CLOUDFLARE_ACCOUNT_ID="your_cloudflare_account_id"
CLOUDFLARE_API_TOKEN="your_workers_ai_api_token"
CLOUDFLARE_MODEL="@cf/meta/llama-3.1-8b-instruct"
```

---

## 4. Deterministic Offline Fallback

To run the system in strict air-gapped or offline mode without running Ollama or Cloudflare:
```env
AI_PROVIDER="deterministic"
```
In this mode, all user questions are resolved via direct intent pattern matching and SQLAlchemy aggregations, ensuring instant sub-millisecond responses without GPU or LLM dependencies.
