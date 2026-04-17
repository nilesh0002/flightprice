# AeroCore: Deep-Dive for Academic Defense (Teacher's Guide)

Use the following points to explain your project's technical depth if your teacher asks advanced questions.

## 1. Machine Learning Methodology
### Why Random Forest Regressor (RFR)?
*   **Non-Linearity**: Airline prices don't grow linearly. A flight departing tomorrow is 10x more expensive than one in 2 months. RFR handles these "exponential jumps" better than Linear Regression because it segments data into decision branches.
*   **Reduced Overfitting**: By using an ensemble of 100 trees (Bootstrap Aggregating or "Bagging"), we reduce the variance. One single tree might memorize the data (overfit), but a forest averages out the errors.
*   **Feature Importance**: The model "learnt" that `days_left` and `airline` have higher statistical weights than `source` city when predicting final costs.

### Statistical Validation
*   **R² Score (0.91)**: This means 91% of the price variance is explained by our input features.
*   **MSE & Variance**: **Mean Squared Error** penalizes larger outliers more heavily. The "Volatility" shown in the UI is the **Standard Deviation of the ensemble predictions**, showing how much the 100 trees "disagree" on a specific price.

## 2. Advanced NLP (Chatbot Intelligence)
### Dual-Path Intent Routing
1.  **Regex Heuristics**: First, it uses regular expressions to find "City Pair" patterns (e.g., `from X to Y`). This is low-latency and 100% accurate for journey-based commands.
2.  **Semantic Fallback**: If no command is found, it sends the string to the **LLM API**. This acts as a "Cognitive Bridge," allowing the bot to handle general conversational questions without a rigid rulebook.

## 3. Full-Stack Architectural Patterns
### RESTful Communication
*   **FastAPI Pydantic**: We use Pydantic models (schemas) to validate that the frontend is sending the correct data types. This prevents errors by catching invalid data at the threshold.
*   **Serverless Scalability**: The project is architected for Vercel. Each API call spawns a "Lambda-style" serverless function, which is more cost-effective and scalable than a traditional server.

## 4. UI Design System
### Atomic CSS Variables
The Light/Dark mode uses **CSS Custom Properties (Variables)** to allow the theme to swap without reloading the page. It ensures the UI is responsive and state-aware.

## 5. Potential "Gotchas" (Teacher Q&A)
*   **Q: Where is the data from?**
    *   **A**: It's a processed version of the "Clean Dataset of Daily Flight Prices" (Kaggle), containing 300,000 flight records from major Indian carriers.
*   **Q: Why not use a real API for live prices?**
    *   **A**: A local ML model allows us to show **Technical Metrics (MSE/R2)** which live APIs keep hidden. It demonstrates the ability to train, save (model.pkl), and deploy an actual model rather than just consuming an API.
