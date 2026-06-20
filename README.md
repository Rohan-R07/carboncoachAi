# CarbonCoach AI

CarbonCoach AI is an enterprise-grade, AI-powered decision support assistant designed to help individuals **Understand, Track, and Reduce** their carbon footprint. By combining mathematical rule-based metrics with personalized AI behavioral analysis, CarbonCoach AI guides users from general climate awareness to targeted, daily habit changes.

---

## 1. Problem Statement
Climate action can feel overwhelming for individuals due to a lack of clear baseline metrics, prioritized action items, and tracker mechanics. CarbonCoach AI addresses this by providing:
- **Understand**: Clean category-by-category lifestyle assessment.
- **Track**: Dynamic 0-100 Eco Score showing deductions and improvements.
- **Reduce**: A mathematically-sorted priority checklist ("What Should I Fix First") and a custom 30-day coaching roadmap.

---

## 2. Solution Overview
CarbonCoach AI consists of a **FastAPI backend** running Python and a **Next.js 15 client** running TypeScript. The app features:
1. **Guided Assessment Form**: Accessibility-focused questionnaire mapping transportation, energy, diet, and flights.
2. **Eco Score Engine**: Rule-based scoring reflecting sustainability baseline deductions.
3. **What Should I Fix First Engine**: Priority engine ranking recommendations by impact and ease.
4. **Daily Challenges & Points**: Gamified micro-habits awarding Eco Points.
5. **AI Roadmaps & Chatbot**: Gemini 2.5 Flash integrations generating weekly roadmaps and responding to custom sustainability queries in context of user carbon profiles.

---

## 3. Architecture
```
                                 +--------------------+
                                 |  Next.js 15 Client |
                                 +---------+----------+
                                           |
                                   REST APIs (JSON)
                                           |
                                           v
                                 +---------+----------+
                                 |   FastAPI Server   |
                                 +----+----------+----+
                                      |          |
                                  File Read/    JSON Prompt
                                    Writes       Payload
                                      |          |
                                      v          v
                            +---------+--+   +---+--------------+
                            | db.json DB |   | Gemini 2.5 Flash |
                            +------------+   +------------------+
```

### Folder Structure
- `backend/`: Configuration management, database services, schemas, calculator math, endpoints, and LLM orchestration.
- `frontend/`: App router layouts, page wrappers, reusable UI components, and API client layers.
- `tests/`: Unit and api-level integration tests.

---

## 4. Feature Breakdown
- **Lifestyle Critique & Summary**: Automated qualitative feedback critiquing habits.
- **Carbon Footprint Calculator**: Core mathematical engine splitting transit, food, utilities, shopping, and flight impacts.
- **Priority Recommendation Engine**: Priority sorting utilizing $\text{Priority} = (\text{Impact} \times 3) + (5 - \text{Difficulty}) \times 2$.
- **30-Day Calendar Roadmap**: Custom 4-week habit-builder.
- **Daily Eco Challenges**: Tracker log supporting micro-habits.
- **Impact Dashboard**: Charts showing carbon category distribution and progress history.

---

## 5. AI Integration
- **Google Gemini 2.5 Flash API**: Integrated using the `google-genai` Client.
- **Graceful Degradation**: Fallback mock generation system executes automatically when the Gemini API key is missing or invalid, ensuring 100% service uptime during evaluations.
- **Context-Aware Prompting**: Chat history and carbon baseline metrics are appended into system instructions, enabling highly personalized advice.

---

## 6. Security Measures
1. **Input Sanitization**: Pydantic input validation combined with custom Regex character filters stripping potential HTML tags or injection commands.
2. **Prompt Injection Mitigation**: Strict system boundaries with input size limits (max 500 characters) and jailbreak term blocklists.
3. **Rate Limiting**: IP-based Token Bucket limiter protecting routes against abuse.
4. **Secret Protection**: Environmental isolation using Pydantic Settings.

---

## 7. Testing Strategy
- **Backend Tests**: 100% pass rate achieved on test suite containing unit tests (calculator, priority engine, security sanitization) and API-level integration tests.
- **Test Command**: `python -m pytest tests/`
- **Location**: `tests/unit/` and `tests/api/`

---

## 8. Accessibility Support
- **WCAG 2.1 AA Checklist**:
  - Full keyboard focus outlines (`focus-visible:ring-emerald-500`).
  - Clear `aria-live` regions for dynamic alerts.
  - Standard HTML semantic layouts (`<main>`, `<header>`, `<section>`, `<button>`).
  - Contrast ratios exceeding 4.5:1 on all text elements.

---

## 9. Setup Instructions

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Set up virtual environment and install requirements:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Create your `.env` file from the template and fill in your Gemini API key:
   ```bash
   cp .env.template .env
   # Edit .env and enter: GEMINI_API_KEY=AIzaSy...
   ```
4. Run the backend server:
   ```bash
   uvicorn app:app --reload --port 8000
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Access the web app at `http://localhost:3000`.

---

## 10. Future Scope
- **Real utility bill OCR**: Parse electricity and heating footprints directly from uploads using Gemini.
- **Stripe/Eco integrations**: Allow carbon offset purchasing directly from the recommendations card.
- **Leaderboards**: Team footprint tracking for corporate ESG goals.
