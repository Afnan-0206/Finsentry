# FinSentry AI

> **Tagline:** Your money. Your patterns. Your protection.  
> **Course:** AI for Finance (CIA-2 Assignment)  
> **Technology Stack:** FastAPI, SQLite, Scikit-learn (Isolation Forest), React 18, Vite, TypeScript, Tailwind CSS, Recharts.  

---

## 📌 Executive Summary

Most traditional expense tracking applications merely inform users where their money went after the cash is already spent.

**FinSentry AI** is a personal financial early-warning and transaction intelligence platform designed to proactively protect consumers from silent financial leakage:
- 🔍 **Subscription Leakage & Price Creep:** Automatically discovers recurring billing cycles and flags unannounced price hikes (e.g. streaming plans jumping from ₹499 to ₹649).
- 🌲 **Unsupervised Machine Learning Anomaly Detection:** Employs **Scikit-learn Isolation Forest** trained on multi-dimensional feature deviance (log amount, category baseline ratios, Z-scores, temporal cadence) with explainable reasons.
- 👥 **Duplicate Payment Candidate Identification:** Highlights repeated charges executed within 0–3 days (e.g. Amazon ₹1,299 double billing) for user verification without destructive deletions.
- 📈 **30-Day Cash-Flow Forecasting:** Projects upcoming scheduled obligations, recurring salary inflows, and discretionary spending trends.
- 🤖 **FinSentry Investigator (Zero-Hallucination Chatbot):** An intent-driven conversational assistant grounded directly in verified SQLite ledger records.
- 🛡️ **Privacy-Preserving & Local-First:** Runs 100% locally with zero paid cloud API dependencies.

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
│   │   │   ├── config.py        # Pydantic BaseSettings
│   │   │   └── database.py      # SQLAlchemy SQLite engine
│   │   ├── models/              # Normalized ORM entities
│   │   ├── schemas/             # Pydantic validation schemas
│   │   ├── services/            # Business & financial intelligence logic
│   │   ├── ml/                  # Feature engineering & Isolation Forest model
│   │   ├── utils/               # Indian currency helpers (₹) & regex rules
│   │   └── main.py              # FastAPI startup & lifespan auto-seeding
│   ├── data/                    # SQLite database storage (finsentry.db)
│   ├── tests/                   # Pytest test suite (12 test cases)
│   ├── requirements.txt         # Pinned backend dependencies
│   └── venv/                    # Python virtual environment
│
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI components & modals
│   │   ├── pages/               # Overview, Transactions, Subscriptions, etc.
│   │   ├── services/            # Axios API client
│   │   ├── types/               # TypeScript interfaces
│   │   ├── App.tsx              # React Router v6 setup
│   │   └── main.tsx             # Entry point
│   ├── package.json             # Frontend dependencies
│   ├── tailwind.config.js       # Fintech navy/cyan theme configuration
│   └── vite.config.ts           # Vite proxy & build settings
│
├── docs/
│   ├── PROJECT_REPORT.md        # Academic report for CIA-2 submission
│   ├── AI_ML_EXPLANATION.md     # Deep-dive viva voce preparation guide
│   ├── TECHNICAL_ARCHITECTURE.md# Mermaid diagrams & system specs
│   ├── PRESENTATION.md          # 12-slide presentation outline
│   └── DEMO_SCRIPT.md           # 5-7 minute live evaluator demonstration
│
├── README.md                    # This document
├── .env.example                 # Environment variables template
└── .gitignore                   # Ignore rules
```

---

## 🚀 Quick Start Guide (Windows)

### Prerequisites
- **Python:** 3.11+ (Python 3.12 verified)
- **Node.js:** v18+ (Node v24 verified)

---

### Step 1: Start Backend Server

Open a terminal in the project root:

```powershell
# 1. Activate Python virtual environment
backend\venv\Scripts\Activate.ps1

# 2. Run backend via Uvicorn
uvicorn backend.app.main:app --port 8000 --reload
```

The backend starts at: **`http://localhost:8000`**  
FastAPI Interactive Swagger Docs: **`http://localhost:8000/docs`**  
*(Note: On initial startup, the backend automatically seeds the SQLite database with 330+ realistic demonstration transactions spanning 6 months!)*

---

### Step 2: Start Frontend Application

Open a second terminal:

```powershell
# 1. Navigate to frontend directory
cd frontend

# 2. Run Vite development server
npm run dev
```

Open your browser at: **`http://localhost:5173`**

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
1. [docs/PROJECT_REPORT.md](file:///c:/Users/hp/Desktop/Projects/genai%20CIA/docs/PROJECT_REPORT.md): Complete formal academic project report with problem statement, system design, and results.
2. [docs/AI_ML_EXPLANATION.md](file:///c:/Users/hp/Desktop/Projects/genai%20CIA/docs/AI_ML_EXPLANATION.md): Deep-dive viva voce preparation guide explaining Isolation Forest mathematics and viva Q&A.
3. [docs/TECHNICAL_ARCHITECTURE.md](file:///c:/Users/hp/Desktop/Projects/genai%20CIA/docs/TECHNICAL_ARCHITECTURE.md): Technical architecture specifications and Mermaid sequence diagrams.
4. [docs/PRESENTATION.md](file:///c:/Users/hp/Desktop/Projects/genai%20CIA/docs/PRESENTATION.md): 12-slide presentation outline with speaker notes.
5. [docs/DEMO_SCRIPT.md](file:///c:/Users/hp/Desktop/Projects/genai%20CIA/docs/DEMO_SCRIPT.md): Step-by-step 5–7 minute live evaluator demonstration walkthrough.

---

## ⚖️ Responsible Financial AI Disclaimer

*FinSentry AI is an educational financial intelligence application developed for undergraduate academic demonstration (AI for Finance CIA-2). Its anomaly detection scores, cash-flow forecasts, and recommendations are informational early warnings and do not constitute legal proof of financial fraud or professional investment advice. All computation executes locally without external data exfiltration.*

