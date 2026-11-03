# FINSENTRY AI — LIVE DEMONSTRATION SCRIPT

**Demonstration Duration:** 5 to 7 Minutes  
**Target:** Evaluators, Professors, Viva Panel  

---

## PRE-DEMO CHECKLIST
1. Backend running: `backend\venv\Scripts\uvicorn backend.app.main:app --port 8000`
2. Frontend running: `cd frontend && npm run dev`
3. Browser open at: `http://localhost:5173`
4. FastAPI Swagger open at: `http://localhost:8000/docs`

---

## MINUTE-BY-MINUTE DEMO SCRIPT

### [0:00 – 1:00] INTRO & OVERVIEW DASHBOARD
1. **Action:** Open `http://localhost:5173`. Point to the header and top summary banner.
2. **Explain to Evaluator:**
   > *"Good morning. This is FinSentry AI, an intelligent personal financial early-warning and subscription leakage detection platform. Unlike standard expense trackers that just show historical pie charts, FinSentry AI actively analyzes our ledger for money leaks."*
3. **Show Screen Elements:**
   - **Financial Health Score:** Point to the top banner showing Health Score (e.g., `85/100`) and the narrative summary.
   - **Key Metrics:** Highlight the 6 summary cards: Total Income (₹510,000+), Total Expenses, Available Balance, Potential Monthly Leakage (~₹2,246), Active Subscriptions, and Unusual Anomaly Flags.
   - **Visualizations:** Point to the 6-month Income vs. Expenses BarChart, the Category Donut Chart, and the 30-Day Expense Trajectory.

---

### [1:00 – 2:00] SCENARIO A: SUBSCRIPTION LEAKAGE & PRICE HIKES
1. **Action:** Click on **Subscriptions** in the sidebar.
2. **Explain to Evaluator:**
   > *"Here is one of our flagship capabilities: the Subscription Leakage Detector. The system automatically inspected all historical transactions, computed median inter-payment intervals, and discovered our active subscriptions without us having to configure manual rules."*
3. **Demonstrate Scenario A:**
   - Point to the **Scenario A Alert Banner** at the top:
     *"Price Increase Detected: Netflix Entertainment increased from historical average ₹499 to ₹649 (+₹150/cycle)."*
   - Show the cards for **Spotify (₹119/mo)**, **Google One (₹130/mo)**, **Disney+ Hotstar (₹299/mo)**, and **BESCOM / Utilities**.
   - Click **Run Recurrence Scan** to show real-time background execution.

---

### [2:00 – 3:15] SCENARIO C & B: ISOLATION FOREST ANOMALIES & DUPLICATES
1. **Action:** Click on **Anomaly Detection** in the sidebar.
2. **Explain to Evaluator:**
   > *"Now let's examine our core Machine Learning engine. We implemented an unsupervised Scikit-learn Isolation Forest algorithm running on 6 engineered features: log-transformed spend, category relative baseline, category z-scores, merchant frequency, and temporal factors."*
3. **Demonstrate Scenario C (Unusual Purchase):**
   - Click on the **Croma Electronics** anomaly card.
   - Show the Evaluator the explainability box:
     > *"Notice the mathematical explainability: 'Spending of ₹18,500 is 8.5x higher than your typical average for Shopping (₹2,175)'. The algorithm didn't just guess; it calculated the exact deviance from our personal baseline."*
4. **Demonstrate Scenario B (Potential Duplicate):**
   - Click on the **Potential Duplicates** tab.
   - Show the Amazon India card: Two identical charges of ₹1,299 on the exact same date.
   - Explain: *"FinSentry AI flags this candidate pair for review so the user can verify their bank statement without automatically deleting records."*
5. **Show Algorithmic Explainer Tab:**
   - Click on **How the Model Works** tab to show the mathematical formulation of path length $h(x)$, expected BST path length $c(n)$, and the small dataset safeguard ($n \ge 20$).

---

### [3:15 – 4:30] FORECASTING & SCENARIO D (SAVINGS TARGETS)
1. **Action:** Click on **Financial Insights** in the sidebar.
2. **Explain to Evaluator:**
   > *"Rather than looking backwards, our Forecasting engine combines known calendar obligations (like rent on the 3rd and Netflix on the 18th) with a 90-day moving average to project our next 30 days of cash flow."*
3. **Demonstrate Elements:**
   - Show the **30-Day Cash-Flow Chart** with expected salary credit and daily net balance.
   - Point to **Scenario D (Food Surge):**
     > *"Here in the recommendations: 'Spending surge detected in Food: ₹14,250 this month, which is 34% higher than last month'. The engine noticed lifestyle inflation and suggested an actionable weekly cap."*
   - Show the **Budget Guardrails** bars on the right tracking category limits.

---

### [4:30 – 5:30] FINSENTRY INVESTIGATOR (AI CHATBOT)
1. **Action:** Click on **AI Investigator** in the sidebar.
2. **Explain to Evaluator:**
   > *"Finally, we built FinSentry Investigator. Many AI chatbots hallucinate numbers because they use pure LLM text generation. FinSentry Investigator uses an intent-based architecture that executes exact SQLite aggregations before answering."*
3. **Demonstrate Live Questions:**
   - Click the prompt chip: *"How much am I spending on subscriptions?"*
   - Watch the assistant reply instantly with exact figures: *"You have active subscriptions totaling ~₹2,246 per month..."* and lists Spotify, Netflix, Hotstar.
   - Click follow-up chip: *"Show me potential duplicate transactions."*
   - Assistant answers with the Amazon ₹1,299 duplicate charge details.

---

### [5:30 – 6:30] LEDGER MANAGEMENT & LIVE AUDIT
1. **Action:** Click on **Transactions** in the sidebar.
2. **Demonstrate:**
   - Search for *"Swiggy"* in the search bar. Ledger filters in real-time.
   - Click **Add Transaction**. Type *"Zomato Order Dinner"* with amount `₹550`.
   - Point out the **AI Match Pill**: *"Auto-categorized as Food (98% confidence)"*.
   - Click **Save Transaction**. The ledger updates immediately.
3. **Show Reset Feature:**
   - Go to **Settings** and show the **Reset & Re-seed Demo Data** button and **Download Sample CSV** button.

---

### [6:30 – 7:00] WRAP UP & VIVA QUESTIONS
1. **Concluding Statement:**
   > *"FinSentry AI achieves full explainability, robust machine learning, and genuine financial utility without requiring any paid cloud APIs. All 12 automated Pytest cases are passing. Thank you, and we welcome your questions."*

