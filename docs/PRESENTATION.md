# FINSENTRY AI — ACADEMIC PRESENTATION OUTLINE

**Course:** AI for Finance (CIA-2 Assignment)  
**Time Limit:** 10–12 Minutes  
**Slides:** 12 Slides  

---

### SLIDE 1: TITLE & IDENTITY
- **Heading:** FinSentry AI: AI-Powered Financial Intelligence & Early-Warning System
- **Tagline:** *Your money. Your patterns. Your protection.*
- **Subtext:** Academic Assignment CIA-2 | AI for Finance
- **Speaker Note:** "Good morning, evaluators. Today we present FinSentry AI, an intelligent personal financial early-warning system that transforms passive transaction logs into proactive financial protection."

---

### SLIDE 2: THE PROBLEM STATEMENT: SILENT FINANCIAL LEAKAGE
- **Bullet Points:**
  - In the UPI and auto-debit era, financial transactions occur faster than ever.
  - Consumers silently bleed money through forgotten recurring subscriptions.
  - Unannounced subscription price hikes (e.g., streaming plans jumping ₹150) go unnoticed.
  - Gateway retries cause duplicate payments within 24 hours.
  - Consumers lack visibility into upcoming obligations before they hit bank balances.
- **Speaker Note:** "Most people don't go broke from major catastrophes; they lose financial momentum through death by a thousand micro-leaks."

---

### SLIDE 3: WHY EXISTING SOLUTIONS ARE INSUFFICIENT
- **Bullet Points:**
  - **Traditional Expense Trackers:** Merely record where money *already went*; offer static pie charts with zero predictive alerts.
  - **Generic LLMs (ChatGPT wrappers):** Hallucinate financial calculations and cannot access personal ledger state safely.
  - **Bank Statements:** Arrive monthly as raw PDFs without cadence analysis or anomaly scoring.
- **Speaker Note:** "We don't need another expense tracker that tells us we bought coffee yesterday. We need an intelligent sentinel that warns us before money leaks away."

---

### SLIDE 4: THE PROPOSED FINSENTRY AI PLATFORM
- **Bullet Points:**
  - **Unsupervised ML Anomaly Detection:** Scikit-learn Isolation Forest detects multi-dimensional spend outliers.
  - **Subscription Leakage Detector:** Statistical cadence engine identifies periodic renewals and price hikes.
  - **Duplicate Payment Candidate Detector:** Flags repeated merchant debits within 0–3 days.
  - **Early-Warning Cash-Flow Forecasting:** 7-day and 30-day proactive horizon.
  - **FinSentry Investigator:** Conversational assistant grounded in SQLite with zero hallucination.
- **Speaker Note:** "FinSentry AI delivers a full-stack, local-first platform built on verified data."

---

### SLIDE 5: SYSTEM ARCHITECTURE & TECH STACK
- **Bullet Points:**
  - **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Recharts, Lucide Icons.
  - **Backend:** Python 3.12, FastAPI, SQLAlchemy ORM, SQLite.
  - **Machine Learning:** Scikit-learn (Isolation Forest), NumPy, Pandas.
  - **Local & Privacy-Preserving:** Runs 100% locally with zero paid API requirements.
- **Speaker Note:** "Our architecture maintains a clean separation between reactive UI, REST services, ML pipeline, and normalized database storage."

---

### SLIDE 6: MACHINE LEARNING IMPLEMENTATION: ISOLATION FOREST
- **Bullet Points:**
  - **Algorithm:** Scikit-learn `IsolationForest(n_estimators=100, contamination=0.05)`.
  - **Why Isolation Forest?** Financial anomalies are few and structurally distinct. Random partition trees isolate outliers with significantly shorter tree depths ($h(x)$).
  - **Mathematical Metric:** Anomaly score $s(x, n) = 2^{-\frac{\mathbb{E}(h(x))}{c(n)}}$.
  - **Responsible ML Safeguard:** Enforces $n \ge 20$ records before training, preventing spurious predictions on tiny datasets.
- **Speaker Note:** "Instead of calculating expensive distance matrices, Isolation Forest slices hyperplanes until anomalies end up in isolated leaf nodes."

---

### SLIDE 7: FEATURE ENGINEERING & EXPLAINABILITY
- **Bullet Points:**
  - **Log Amount:** $\ln(\text{amount} + 1)$ stabilizes extreme financial skew.
  - **Category Relative Ratio:** Compares transaction against category mean ($\mu_{\text{category}}$).
  - **Category Z-Score:** Measures standard deviations from normal category variance.
  - **Merchant Frequency & Temporal:** Tracks first-time vendors and day-of-week habits.
  - **Explainable Reasons:** Every anomaly provides human-readable reasons (e.g. "8.5x higher than typical Shopping baseline").
- **Speaker Note:** "A model is useless in fintech without explainability. Every alert explains exactly why the algorithm flagged it."

---

### SLIDE 8: SUBSCRIPTION DETECTION & PRICE HIKE ENGINE
- **Bullet Points:**
  - **Cadence Discovery:** Evaluates median interval $\Delta t$:
    - Weekly: $7 \pm 2$ days | Monthly: $30 \pm 5$ days | Quarterly: $90 \pm 10$ days | Annual: $365 \pm 15$ days.
  - **Price Increase Detection:** Tracks delta $\Delta P = \text{Latest} - \text{Historic Average}$.
  - **Real Example Detected:** Netflix increasing from ₹499 to ₹649 (+₹150/month).
  - **Potential Monthly Leakage:** Computes cumulative active recurring outlays.
- **Speaker Note:** "By analyzing inter-transaction intervals, our system discovers recurring services even when the user forgot to label them."

---

### SLIDE 9: 30-DAY CASH-FLOW FORECASTING & RECOMMENDATIONS
- **Bullet Points:**
  - **Proactive Outlook:** Combines scheduled recurring commitments (rent, utilities, subscriptions) with 90-day moving average discretionary baselines.
  - **Early Net Buffer:** Displays expected net savings before month-end.
  - **Actionable Recommendations:** Generates category surge alerts (e.g., Food spend $+32\%$) and 10% discretionary savings targets.
  - **Budget Guardrails:** Visual threshold bars tracking category spending caps.
- **Speaker Note:** "Users can see upcoming subscription obligations plotted on a daily cash-flow chart 30 days ahead."

---

### SLIDE 10: FINSENTRY INVESTIGATOR (AI ASSISTANT)
- **Bullet Points:**
  - **The Problem:** General LLMs invent numbers when asked about financial data.
  - **Our Solution:** Grounded Intent-Based Query Architecture:
    - User asks: *"How much am I spending on subscriptions?"*
    - Intent Router maps to `subscriptions_query`.
    - Service executes database aggregation: `sum = ₹2,246/mo`.
    - Generates grounded, transparent response with follow-up action chips.
- **Speaker Note:** "Our assistant answers with mathematical precision, grounded directly in the user's SQLite ledger."

---

### SLIDE 11: DEMONSTRATION BENCHMARK SCENARIOS
- **Bullet Points:**
  - **Scenario A:** Netflix price hike (+₹150) automatically identified in Subscriptions.
  - **Scenario B:** Amazon duplicate debit (₹1,299 double charge) caught in Duplicates tab.
  - **Scenario C:** Croma Electronics ₹18,500 purchase isolated by Isolation Forest.
  - **Scenario D:** Food spending surge detected in Recommendations tab.
  - **Scenario E:** Six months of realistic Indian transactions (Salary, Rent, UPI, OTT).
- **Speaker Note:** "We verified all 5 required academic test scenarios with reproducible fixed seeds."

---

### SLIDE 12: CONCLUSION & FUTURE WORK
- **Bullet Points:**
  - **Conclusion:** FinSentry AI proves that effective financial intelligence can be achieved with lightweight, local-first ML and explainable statistics.
  - **Test Results:** 12/12 Pytest tests passing; clean Vite production build.
  - **Future Scope:** Account Aggregator (AA) framework integration for consent-based live sync; on-device small language models.
  - **Disclaimer:** Educational financial intelligence system; informational early warning.
- **Speaker Note:** "Thank you. We are now ready to demonstrate the live application."

