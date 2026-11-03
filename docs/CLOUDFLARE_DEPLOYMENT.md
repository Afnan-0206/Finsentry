# FinSentry AI — Cloudflare Production Deployment Architecture

This document provides the production hosting architecture, runtime compatibility evaluation, and deployment guide for FinSentry AI.

---

## 1. Runtime Compatibility Assessment: Cloudflare Python Workers

Before deploying, we conducted a technical audit of hosting the complete FastAPI backend on Cloudflare Python Workers:

| Component | Cloudflare Python Workers (Pyodide) | Compatibility Verdict | Rationale |
| :--- | :--- | :--- | :--- |
| **FastAPI / ASGI** | Supported | Compatible | Pure Python ASGI interfaces run in Pyodide. |
| **SQLAlchemy Core**| Supported | Partially Compatible | SQLite file I/O requires virtual memory file systems. |
| **SQLite on Disk** | **Not Supported** | **Incompatible** | Cloudflare Workers are stateless and lack persistent local disk storage. SQLite files are erased on worker recycle. |
| **Pandas / NumPy** | Restricted | Marginal | Pyodide builds are large and consume substantial Worker memory quotas. |
| **Scikit-learn** | **Not Supported** | **Incompatible** | Requires compiled C/Cython extensions, OpenMP/pthreads (`n_jobs=-1`), and exceeds the 10MB/33MB compressed Worker size limit. |

### Architectural Conclusion
> [!IMPORTANT]
> **Do not force Scikit-learn and SQLite into Cloudflare Python Workers.**  
> The optimal, reliable architecture decouples static frontend delivery from compute-heavy ML backend execution:
> - **Frontend:** Deployed to **Cloudflare Pages** (global CDN edge, instant static delivery, zero cold start).
> - **Backend:** Deployed to a containerized Python 3.12 cloud host (Render, Railway, Fly.io, or AWS ECS).
> - **AI Model:** Uses **Cloudflare Workers AI** (`@cf/meta/llama-3.1-8b-instruct`) for serverless production LLM inference.
> - **Database:** Migrated from local SQLite to **Managed PostgreSQL** (Supabase, Neon, or Render Postgres).

---

## 2. Deployment Architecture Diagram

```mermaid
flowchart LR
    User[End User Browser] -->|HTTPS| CFPages[Cloudflare Pages\nReact + Vite SPA]
    CFPages -->|API Requests\n/api/*| FastAPI[FastAPI Backend\nRender / Railway / Container]
    FastAPI -->|Isolation Forest\nPandas / ML| LocalCompute[Python 3.12 Engine]
    FastAPI -->|Inference REST API| CFWorkersAI[Cloudflare Workers AI\nLlama 3.1 8B Instruct]
    FastAPI -->|SQLAlchemy| Postgres[(Managed PostgreSQL\nNeon / Supabase)]
```

---

## 3. Step-by-Step Production Deployment Guide

### Phase A: Deploy Frontend to Cloudflare Pages

1. **Build the production bundle locally or via CI:**
   ```powershell
   cd frontend
   npm run build
   ```
2. **Deploy via Wrangler CLI:**
   ```powershell
   npx wrangler pages deploy dist --project-name finsentry-ai
   ```
3. **Configure Environment Variables in Cloudflare Pages:**
   - In the Cloudflare Pages dashboard: **Settings** $\to$ **Environment Variables**.
   - Add: `VITE_API_BASE_URL` = `https://your-backend-api.onrender.com/api`.

---

### Phase B: Database Migration (SQLite $\to$ PostgreSQL)

1. Provision a free PostgreSQL database on [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Render](https://render.com).
2. Run the included automated migration script:
   ```powershell
   backend\venv\Scripts\python backend\scripts\migrate_sqlite_to_postgres.py --source backend\data\finsentry.db --target-url "postgresql://user:password@ep-host.pooler.neon.tech/finsentry"
   ```
   *The script transfers all 337 demonstration records, preserving foreign keys and indexes.*

---

### Phase C: Deploy FastAPI Backend (Render / Railway)

1. **Procfile / Startup Command:**
   ```text
   web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
2. **Environment Variables on Cloud Host:**
   ```env
   DATABASE_URL="postgresql://user:password@host/finsentry"
   AI_PROVIDER="cloudflare"
   CLOUDFLARE_ACCOUNT_ID="your_account_id"
   CLOUDFLARE_API_TOKEN="your_workers_ai_token"
   CLOUDFLARE_MODEL="@cf/meta/llama-3.1-8b-instruct"
   CORS_ORIGINS="https://finsentry-ai.pages.dev,http://localhost:5173"
   ```

---

## 4. Security & Quality Guardrails

1. **Zero Secret Leakage:** Neither Cloudflare API tokens nor internal prompts are transmitted to the client.
2. **CORS Whitelist:** Only authorized domains (local dev and the specific Cloudflare Pages hostname) are permitted in `CORS_ORIGINS`.
3. **Strict Fallback:** If Cloudflare Workers AI experiences network latency or quota exhaustion, FinSentry AI automatically falls back to its deterministic computation engine.
