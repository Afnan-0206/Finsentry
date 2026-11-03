# FINSENTRY AI — AI & MACHINE LEARNING GUIDE

**Academic Viva & Presentation Companion**  
**Course:** AI for Finance (CIA-2 Assignment)  
**Target Audience:** Students, Evaluators, and Viva Examiners  

---

## 1. WHAT DOES "AI" MEAN IN FINSENTRY AI?

In consumer fintech, the term "AI" is often misused as a buzzword for simple `if/else` alerts or generic cloud chatbot wrappers.

In **FinSentry AI**, Artificial Intelligence represents a **hybrid cognitive architecture** composed of three transparent tiers:
1. **Unsupervised Machine Learning (Isolation Forest):** Learns multi-dimensional spending geometries without requiring labeled fraud data.
2. **Statistical Cadence Inference:** Analyzes payment time-series intervals to detect recurring obligations, subscription drift, and unannounced price hikes.
3. **Deterministic Financial Reasoning (FinSentry Investigator):** Answers natural language queries by executing exact, verifiable database aggregations, guaranteeing **zero financial hallucinations**.

---

## 2. MACHINE LEARNING DEEP-DIVE: ISOLATION FOREST

### 2.1 Why Isolation Forest Instead of Clustering or Autoencoders?
Traditional anomaly detection approaches in finance typically use:
- **K-Means / DBSCAN Clustering:** Sensitive to the "curse of dimensionality" and computationally expensive ($O(n^2)$ distance calculations).
- **Deep Autoencoders:** Require massive datasets, significant GPU compute, and act as "black boxes" that are difficult to explain to bank customers.
- **Z-Score on Amount Alone:** Fails because a ₹15,000 rent payment is normal on the 1st of the month, but a ₹15,000 electronics purchase on a Tuesday is anomalous. One-dimensional rules cannot capture contextual combinations.

**Isolation Forest (Liu, Ting & Zhou, 2008)** was chosen because:
1. It is **unsupervised**: In personal finance, you do not have labeled datasets of "fraud" vs "normal" for an individual user.
2. It has linear time complexity $O(n \cdot t \cdot \psi)$ with low memory overhead.
3. It directly targets anomalies instead of profiling normal clusters.

### 2.2 Mathematical Foundation
An Isolation Forest constructs an ensemble of $t$ binary Isolation Trees ($iTrees$).
To build an $iTree$:
1. Randomly sample a sub-sample $X' \subset X$ of size $\psi$ (default $\psi = 256$).
2. Recursively split the data by selecting a random feature $q$ and a random split value $p \in [\min(q), \max(q)]$ until either:
   - The tree reaches a maximum height limit $h_{\max} = \lceil \log_2(\psi) \rceil$.
   - $|X'| \le 1$.
   - All data points have identical values.

#### Path Length $h(x)$
The path length $h(x)$ of an observation $x$ is the number of edges traversed in an $iTree$ from the root node to the terminating leaf node.
- **Anomalous transactions** have extreme attribute values, so very few random cuts are required to separate them into isolated leaf nodes ($h(x)$ is small).
- **Normal transactions** cluster tightly with common purchases, requiring many partitions to isolate ($h(x)$ is large).

#### Anomaly Score Formula
The anomaly score $s(x, n)$ is normalized between $0$ and $1$:
$$s(x, n) = 2^{-\frac{\mathbb{E}(h(x))}{c(n)}}$$

Where:
- $\mathbb{E}(h(x))$ is the average path length across all trees in the forest.
- $c(n)$ is the average path length of an unsuccessful search in a Binary Search Tree (BST) built over $n$ nodes:
$$c(n) = 2 \ln(n - 1) + 2\gamma - \frac{2(n - 1)}{n}$$
($\gamma \approx 0.5772156649$ is Euler's constant).

#### Score Interpretation:
- If $\mathbb{E}(h(x)) \to 0 \implies s \to 1$: **Strong Anomaly** (isolated very quickly).
- If $\mathbb{E}(h(x)) \to c(n) \implies s \to 0.5$: **Completely Normal Instance**.
- If $\mathbb{E}(h(x)) \to n - 1 \implies s \to 0$: **Extremely Central Instance**.

In FinSentry AI, Scikit-learn's `decision_function` returns an offset where negative values signify outliers corresponding to the top $5\%$ contamination rate ($\nu = 0.05$).

---

## 3. FEATURE ENGINEERING EXPLAINED

Raw transaction logs contain text and currency numbers. FinSentry AI engineers 6 numerical features for the model:

| Feature Name | Formulation | Rationale & Financial Intuition |
| :--- | :--- | :--- |
| **Log Amount** | $\ln(\text{amount} + 1)$ | Financial spend follows a heavy right-tailed Pareto distribution. Log transform compresses extreme ranges so large purchases don't dominate tree splits. |
| **Day of Week** | $\text{dt.weekday()} \in [0, 6]$ | Identifies weekend recreational spending vs. weekday routine commute expenses. |
| **Day of Month** | $\text{dt.day} \in [1, 31]$ | Identifies recurring monthly obligations (salaries, rents, utility bills concentrated between 1st–10th). |
| **Merchant Frequency** | Count of transactions with merchant | Flags first-time or unfamiliar merchants compared to routine vendors (Swiggy, Uber). |
| **Relative Category Ratio** | $\frac{\text{amount}}{\mu_{\text{category}} + \epsilon}$ | Normalizes the purchase against the user's specific baseline. ₹2,000 for groceries is normal; ₹2,000 for a movie ticket is $4\times$ typical baseline. |
| **Category Z-Score** | $\frac{\text{amount} - \mu_{\text{category}}}{\sigma_{\text{category}} + \epsilon}$ | Measures standard deviations away from the category mean. Captures sudden extreme variance. |

---

## 4. SUBSCRIPTION RECURRENCE & PRICE HIKE MATHEMATICS

### 4.1 Interval Cadence Identification
For every merchant with $\ge 2$ transactions, intervals $\Delta t = [t_2 - t_1, t_3 - t_2, \dots]$ are sorted.
The algorithm calculates:
$$\text{median\_interval} = \text{median}(\Delta t), \quad \sigma_t = \text{std}(\Delta t)$$
If $\text{median\_interval} \in [25, 35]$ days and $\sigma_t \le 7$ days, the transaction stream is classified as a **Monthly Subscription**.

### 4.2 Next Billing Date Projection
$$\text{Estimated Next Date} = t_{\text{last}} + \text{median\_interval}$$

### 4.3 Price Increase Detection
$$\text{Historic Average} = \frac{1}{K-1}\sum_{k=1}^{K-1} \text{amount}_k$$
If $\text{latest\_amount} > 1.05 \times \text{Historic Average}$ and $(\text{latest\_amount} - \text{Historic Average}) \ge \text{₹}50$:
- Flagged as `status: price_increase`.
- System creates a High-Priority Alert warning the user of silent subscription creep.

---

## 5. WHY FINSENTRY INVESTIGATOR DOES NOT HALLUCINATE

Large Language Models (LLMs) frequently fabricate mathematical calculations when prompted directly on tabular numbers.

FinSentry AI solves this with an **Intent-Based Grounded Query Engine**:
1. The user's query is classified into structured intents (`subscriptions_query`, `anomaly_query`, `duplicate_query`, `category_spending_query`, `forecast_query`).
2. An analytical service executes targeted SQLAlchemy aggregation queries against SQLite.
3. The exact calculated figures (e.g. `total_monthly_leakage = 2246.00`, `net_savings = 58240.00`) are injected into the response template.
4. **Result:** The user receives a conversational answer with 100% mathematical accuracy.

---

## 6. VIVA VOCE QUESTIONS & MODEL ANSWERS

### Q1: Why didn't you use Supervised Learning (e.g. Random Forest or XGBoost) for Anomaly Detection?
**Answer:** Supervised learning requires thousands of labeled positive and negative examples ("fraud" vs "not fraud"). In personal banking for an individual user, transactions are unlabeled and fraud is extremely rare ($< 0.1\%$). Isolation Forest is unsupervised; it learns what is normal from the user's historical distribution and isolates outliers without requiring historical fraud labels.

### Q2: What does the contamination parameter mean in Isolation Forest?
**Answer:** Contamination ($\nu$) is the estimated proportion of outliers in the dataset. In FinSentry AI, it is set to $0.05$ (5%), meaning the model expects approximately 5% of historical transactions to exhibit unusual feature deviance deserving user review.

### Q3: What happens if a user imports only 5 transactions? Does your model still make predictions?
**Answer:** No. An honest AI application must acknowledge data insufficiency. Isolation Forest cannot partition meaningful hyperplanes with 5 points. FinSentry AI enforces a minimum threshold of 20 expense records. If $n < 20$, the system returns an informative status message and invites the user to load demo data or import more statements.

### Q4: How is an anomaly different from a fraud alert?
**Answer:** An anomaly is simply a statistical outlier—for example, buying a laptop for ₹60,000 is an anomaly if the user usually spends ₹2,000 on shopping, but it is legitimate authorized spending. FinSentry AI clearly displays a responsible disclaimer that anomalies are early-warning notifications for audit, not definitive legal proof of fraudulent activity.

### Q5: How do you identify duplicate payments?
**Answer:** The system evaluates pairs of expense transactions that share:
1. Identical amounts ($|A_1 - A_2| < 0.01$).
2. Normalized merchant matching.
3. Transaction date interval between 0 and 3 days.
It tags them as "Potential Duplicate" for user review without automatically deleting transactions.

