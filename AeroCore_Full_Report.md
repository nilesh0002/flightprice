

# AeroCore: Domain-Specific Generative AI Chatbot Project Report

## 1. Introduction

This Project-Based Assessment demonstrates the design and implementation of AeroCore, a domain-specific AI chatbot for the airline and flight booking sector. The project leverages Generative AI APIs to deliver intelligent, context-aware responses for flight price prediction, booking advice, and travel-related queries. The assessment emphasizes practical AI skills, creativity, responsible and domain-aware AI usage, and societal impact.

## 2. Assessment Objective

- **Problem Identification:** Address the challenge of flight price volatility and information overload in travel planning.
- **Generative AI Application:** Integrate OpenAI’s GPT-4 API to provide domain-specific, conversational intelligence.
- **Technical Competence:** Demonstrate robust API integration, prompt engineering, and system design.
- **Communication:** Clearly document design choices, technical decisions, and the rationale behind model configuration.

## 3. Project Description

**Domain:** Airline ticketing and flight price prediction.

AeroCore’s chatbot is tailored for the airline domain, offering:
- Real-time flight price forecasts using machine learning.
- Booking recommendations based on user preferences and market trends.
- Answers to frequently asked travel questions (e.g., baggage policies, cancellation rules).
- Domain customization through prompt engineering and curated knowledge.

The chatbot utilizes the OpenAI GPT-4 API for natural language understanding and response generation, ensuring domain-constrained, meaningful interactions.

## 4. Scope and Requirements

### Mandatory Requirements
- **Clear Domain Definition:** Focused on airline ticketing and flight price prediction.
- **Generative AI API:** Integration of OpenAI GPT-4 for conversational intelligence.
- **Domain-Constrained Responses:** Prompts and system instructions ensure relevance and accuracy.
- **Working Prototype:** Delivered as a web application (React frontend, FastAPI backend) and a Jupyter notebook for demonstration.

### Optional Enhancements
- **Conversation Memory:** Maintains context across multi-turn interactions for improved user experience.
- **Document-Based Q&A:** Incorporates curated airline FAQs for accurate, document-grounded answers.
- **Multilingual Support:** Planned for future versions to serve a broader audience.
- **Simple User Interface:** Designed for accessibility and ease of use.

## 5. Tools and Technologies

- **Generative AI API:** OpenAI GPT-4 (with API key management and secure integration).
- **Programming Languages:** Python (backend, data processing), JavaScript (React frontend).
- **Frameworks:** FastAPI (backend API), Vercel (deployment), Pydantic (data validation), Jupyter Notebook (demonstration).
- **Version Control:** Git for source code management.
- **Other:** CSS for UI theming, Markdown for documentation.

## 6. Data Collection and Domain Knowledge Preparation

Although AeroCore relies on Generative AI APIs, domain expertise is demonstrated through:
- **Data Collection:** Curated FAQs and common queries from trusted airline websites (e.g., IndiGo, Vistara, SpiceJet), government travel portals, and aviation standards.
- **Intent Identification:** Mapped user intents such as price inquiry, booking advice, refund policies, and travel restrictions.
- **Sample Q&A:** Developed a set of sample questions and expected answers to guide prompt engineering.
- **Prompt Design:** Used domain knowledge to craft system instructions and user prompts, ensuring responses are relevant, reliable, and context-aware.

**Information Sources Studied:**
- Official airline websites and customer support pages.
- Government travel advisories and aviation authority guidelines.
- Industry reports on flight pricing trends and consumer behavior.

**Impact on Prompt Design:**
- Prompts include explicit instructions to prioritize accuracy, cite sources when possible, and avoid speculation.
- System messages restrict the chatbot to airline-related topics, preventing off-domain responses.

## 7. Model Configuration Awareness

**Temperature (Randomness/Creativity):**
- Set to 0.3 for deterministic, factual responses (e.g., price prediction, policy explanation).
- Increased to 0.7 for open-ended travel advice or general queries to allow more creativity.

**Top-p (Nucleus Sampling):**
- Set to 0.8 for a balance between safety and expressiveness.
- Lowered to 0.5 for critical queries requiring high reliability.

**Justification:**
- Lower temperature and top-p values ensure the chatbot provides accurate, domain-relevant answers for sensitive topics.
- Higher values are selectively used to enhance conversational quality where creativity is beneficial.

**Demonstration of Response Differences:**
- Example prompts were tested with varying temperature and top-p settings, and the differences in output were documented in the notebook.

## 8. Deliverables

1. **Project Report:** This document, detailing all aspects of the project.
2. **Source Code / Notebook:** Complete codebase and demonstration notebook.
3. **Application Link:** Deployed web app (Vercel).
4. **Presentation Slides:** Summarizing the project for academic defense.

## 9. Academic Integrity

- All code, prompts, and documentation are original.
- Proper attribution is given for all tools, APIs, and data sources.
- Full understanding of the system will be demonstrated during evaluation.

## 4. Scope and Requirements

**Mandatory:**
- Clear domain definition (airline/flight booking)
- Integration of OpenAI API for Generative AI
- Domain-constrained, meaningful responses
- Working prototype (web app and notebook)

**Optional Enhancements:**
- Conversation memory for improved context
- Document-based Q&A (using curated airline FAQs)
- Multilingual support (planned)
- Simple, user-friendly interface

## 5. Tools and Technologies
- Generative AI API: OpenAI GPT-4
- Programming Language: Python (FastAPI backend, React frontend)
- Frameworks: FastAPI, Vercel (deployment), Pydantic (validation)

## 6. Data Collection and Domain Knowledge Preparation
- Collected FAQs and common queries from airline websites and government travel portals.
- Identified user intents (e.g., price inquiry, booking advice, travel policies).
- Curated sample questions and answers to improve prompt quality and system instructions.
- Domain knowledge influenced prompt engineering for accurate, reliable responses.

## 7. Model Configuration Awareness
- **Temperature:** Set to 0.3 for factual, deterministic responses in price prediction; increased to 0.7 for general travel advice to allow more creativity.
- **Top-p:** Set to 0.8 for balanced, safe outputs.
- Justification: Lower temperature ensures reliability for critical queries; higher values allow broader, more conversational responses where appropriate.
- Response differences were tested and documented.

## 8. Deliverables
1. Project Report (this document)
2. Source Code (Python scripts, React frontend)
3. Application Link (Vercel deployment)
4. Presentation Slides

## 9. Evaluation Criteria Mapping



- Full understanding of the system will be demonstrated during evaluation.
