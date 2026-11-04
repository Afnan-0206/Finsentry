# FinSentry AI

> **Tagline:** Your money. Your patterns. Your protection.  
> **Course:** AI for Finance (CIA-2 Assignment)  
> **Author:** [Afnan](https://github.com/Afnan-0206)  

[![Architecture diagram](https://gitdiagram.com/diagram-badge.svg)](https://gitdiagram.com/afnan-0206/finsentry?utm_source=readme&utm_medium=badge)
[![Frontend](https://img.shields.io/badge/Frontend-Cloudflare%20Pages-F38020?logo=cloudflare&logoColor=white)](https://finsentry.pages.dev)
[![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render&logoColor=white)](https://finsentry-d4ye.onrender.com)
[![Database](https://img.shields.io/badge/Database-SQLite%20(WAL%20Mode)-003B57?logo=sqlite&logoColor=white)](#-storage--database-integrity)
[![ML](https://img.shields.io/badge/ML-Isolation%20Forest-F7931E?logo=scikitlearn&logoColor=white)](#-unsupervised-machine-learning-anomaly-detection)

---

## 🌐 Live Public Deployment

| Component | Platform | Live URL | Status |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | Cloudflare Pages | [finsentry.pages.dev](https://finsentry.pages.dev) | 🟢 Active |
| **Backend API** | Render | [finsentry-d4ye.onrender.com](https://finsentry-d4ye.onrender.com) | 🟢 Active |
| **System Status** | Render JSON | [finsentry-d4ye.onrender.com/api/system/status](https://finsentry-d4ye.onrender.com/api/system/status) | 🟢 Online |
| **Interactive API Docs** | Swagger / OpenAPI | [finsentry-d4ye.onrender.com/docs](https://finsentry-d4ye.onrender.com/docs) | 🟢 Active |

---

## 📌 Executive Summary

Most traditional expense tracking applications merely inform users where their money went after the cash is already spent.

**FinSentry AI** is a personal financial early-warning and transaction intelligence platform designed to proactively protect consumers from silent financial leakage:
- 🔍 **Subscription Leakage & Price Creep:** Automatically discovers recurring billing cycles and flags unannounced price hikes (e.g. streaming plans jumping from ₹499 to ₹649).
- 🌲 **Unsupervised Machine Learning Anomaly Detection:** Employs **Scikit-learn Isolation Forest** trained on multi-dimensional feature deviance (log amount, category baseline ratios, Z-scores, temporal cadence) with explainable reasons.
- 👥 **Duplicate Payment Candidate Identification:** Highlights repeated charges executed within 0–3 days (e.g. Amazon ₹1,299 double billing) for user verification without destructive deletions.
- 📈 **30-Day Cash-Flow Forecasting:** Projects upcoming scheduled obligations, recurring salary inflows, and discretionary spending trends.
- 🤖 **FinSentry Investigator (Zero-Hallucination Chatbot):** An intent-driven conversational assistant grounded directly in verified SQLite ledger records with local/cloud LLM streaming.
- 🛡️ **Privacy-Preserving & Local-First:** Runs on a resilient, high-performance SQLite ledger with zero paid external database dependencies.

---

## 🏛️ System Architecture

```
FinSentry-AI/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/          # REST endpoints (dashboard, transactions, etc.)
│   │   │   └── dependencies.py  # Database session injection
│   │   ├── core/
│   │   │   ├── config.py        # Pydantic BaseSettings & environment configs
│   │   │   └── database.py      # SQLAlchemy SQLite engine with WAL mode
│   │   ├── models/              # Normalized ORM entities (Transactions, Subscriptions, etc.)
│   │   ├── schemas/             # Pydantic validation schemas
│   │   ├── services/            # Business & financial intelligence logic
│   │   ├── ml/                  # Feature engineering & Isolation Forest model
│   │   ├── utils/               # Indian currency helpers (₹) & regex rules
│   │   └── main.py              # FastAPI startup, CORS & lifespan auto-seeding
│   ├── data/                    # SQLite database storage (finsentry.db)
│   ├── tests/                   # Pytest test suite (12 test cases)
│   └── requirements.txt         # Pinned backend dependencies
│
├── frontend/
│   ├── public/                  # Static assets & Cloudflare Pages _redirects
│   ├── src/
│   │   ├── components/          # Reusable UI components, Bento cards & Error Boundary
│   │   ├── pages/               # Overview, Transactions, Subscriptions, Anomalies, etc.
│   │   ├── services/            # Axios API client with dynamic edge proxy fallback
│   │   ├── types/               # TypeScript interfaces
│   │   ├── App.tsx              # React Router v6 setup
│   │   └── main.tsx             # Entry point
│   ├── package.json             # Frontend dependencies
│   ├── tailwind.config.js       # Fintech dark Bento theme configuration
│   └── vite.config.ts           # Vite proxy & build settings
│
├── docs/
│   ├── PROJECT_REPORT.md        # Academic report for CIA-2 submission
│   ├── AI_ML_EXPLANATION.md     # Deep-dive viva voce preparation guide
│   ├── TECHNICAL_ARCHITECTURE.md# Mermaid diagrams & system specs
│   ├── PRESENTATION.md          # 12-slide presentation outline
│   └── DEMO_SCRIPT.md           # 5-7 minute live evaluator demonstration
│
├── render.yaml                  # Infrastructure as Code for Render backend
├── wrangler.toml                # Cloudflare Pages edge configuration
├── package.json                 # Monorepo build script for Cloudflare
└── README.md                    # Project documentation
```

---

## 💾 Storage & Database Integrity

FinSentry AI maintains a single source of truth using an acid-compliant, highly optimized SQLite database:
- **Location:** `backend/data/finsentry.db`
- **Transactions:** 361 verified historical & scenario records (6 months)
- **Active Subscriptions:** 20 detected cycles (including price hike alerts)
- **Anomalies Identified:** 15 flagged outliers
- **Integrity Verified:** SQLite `PRAGMA integrity_check` = `ok`
- **Security:** Database files and automated backups are strictly git-ignored to prevent accidental exposure of financial data.

---

## 🚀 Quick Start Guide (Local Setup)

### Prerequisites
- **Python:** 3.11+ (Python 3.12 verified)
- **Node.js:** v18+ (Node v20/v24 verified)

---

### Step 1: Start Backend Server

Open a terminal in the project root:

```powershell
# 1. Activate Python virtual environment
backend\venv\Scripts\Activate.ps1

# 2. Run backend via Uvicorn on port 8001
uvicorn app.main:app --app-dir backend --port 8001 --reload
```

* Backend URL: `http://localhost:8001`
* Interactive API Docs: `http://localhost:8001/docs`
* Health Check: `http://localhost:8001/api/system/status`

---

### Step 2: Start Frontend Application

Open a second terminal:

```powershell
# 1. Navigate to frontend directory
cd frontend

# 2. Run Vite development server
npm run dev
```

* Frontend URL: `http://localhost:5173`
* Vite automatically proxies `/api` requests to `http://127.0.0.1:8001`.

---

## 🧪 Automated Testing & Verification

The project includes an automated test suite covering all services, models, and test scenarios.

```powershell
# Run backend test suite
backend\venv\Scripts\python -m pytest backend\tests -v
```

**Results:**
- `test_categorization.py`: 3 passed (Direct merchant mapping, regex matcher, honest unknown fallback)
- `test_transactions.py`: 2 passed (CRUD lifecycle, CSV export & import)
- `test_subscriptions.py`: 1 passed (Recurrence cadence & Scenario A price increase)
- `test_duplicates.py`: 1 passed (Scenario B duplicate debit candidate detection)
- `test_anomalies.py`: 2 passed (Small dataset guard $n < 20$, Scenario C Isolation Forest)
- `test_intelligence.py`: 3 passed (7/30-day forecast, recommendations, chatbot query engine)
- **Total:** `12 passed in 8.49s (100% pass rate)`.

---

## 🎯 Calibrated Demonstration Scenarios

| Scenario | Financial Event | How FinSentry AI Handles It |
| :--- | :--- | :--- |
| **Scenario A: Subscription Price Creep** | Netflix billed at ₹499 for 3 cycles, then increases to ₹649. | Subscription engine calculates $+\text{₹}150$ delta, sets `status: price_increase`, and surfaces an alert. |
| **Scenario B: Potential Duplicate** | Amazon debits ₹1,299 on March 2nd, and another ₹1,299 within 0–1 days. | Duplicate candidate detector pairs transactions and prompts verification without destructive deletion. |
| **Scenario C: Unusual Purchase Outlier** | Typical shopping spend is ₹500–₹2,000; user makes an ₹18,500 purchase at Croma. | Isolation Forest scores transaction as high-risk outlier ($s < -0.15$), citing $8.5\times$ category baseline surge. |
| **Scenario D: Category Spending Surge** | Food spending accelerated $> 30\%$ compared to previous month. | Recommendation engine detects lifestyle inflation and suggests a 10% discretionary savings target. |
| **Scenario E: Recurring Obligations** | Regular rent (₹24,000), broadband, electricity, and streaming. | Forecasting engine maps recurring calendar obligations 30 days ahead to predict net savings. |

---

## 📚 Academic Documentation Directory

For complete evaluation material, refer to the `docs/` folder:
1. [docs/PROJECT_REPORT.md](docs/PROJECT_REPORT.md): Complete formal academic project report with problem statement, system design, and results.
2. [docs/AI_ML_EXPLANATION.md](docs/AI_ML_EXPLANATION.md): Deep-dive viva voce preparation guide explaining Isolation Forest mathematics and viva Q&A.
3. [docs/TECHNICAL_ARCHITECTURE.md](docs/TECHNICAL_ARCHITECTURE.md): Technical architecture specifications and Mermaid sequence diagrams.
4. [docs/PRESENTATION.md](docs/PRESENTATION.md): 12-slide presentation outline with speaker notes.
5. [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md): Step-by-step 5–7 minute live evaluator demonstration walkthrough.

---

## ⚖️ Responsible Financial AI Disclaimer

*FinSentry AI is an educational financial intelligence application developed for academic demonstration (AI for Finance CIA-2). Its anomaly detection scores, cash-flow forecasts, and recommendations are informational early warnings and do not constitute legal proof of financial fraud or professional investment advice.*
