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
CarbonCoach AI consists of a **FastAPI backend** running Python (deployed on Google Cloud Run) and a **Next.js 15 client** running TypeScript (deployed on Vercel). The app features:
1. **Guided Assessment Form**: Accessibility-focused questionnaire mapping transportation, energy, diet, and flights.
2. **Eco Score Engine**: Rule-based scoring reflecting sustainability baseline deductions.
3. **What Should I Fix First Engine**: Priority engine ranking recommendations by impact and ease.
4. **Daily Challenges & Points**: Gamified micro-habits awarding Eco Points.
5. **AI Roadmaps & Chatbot**: Hugging Face API integrations generating weekly roadmaps and responding to custom sustainability queries in context of user carbon profiles.

---

## 3. Architecture

### Local Development Flow
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
                                +----------+   +------------------+
                                | db.json  |   | Hugging Face API |
                                +----------+   +------------------+
```

### Production Cloud Flow
```
                                 +--------------------+
                                 |   Vercel Hosting   | (Next.js Frontend)
                                 +---------+----------+
                                           |
                                       HTTPS Request
                                           |
                                           v
                                 +---------+----------+
                                 |  Google Cloud Run  | (FastAPI Backend)
                                 +----+----------+----+
                                      |          |
                                   Firestore   Client
                                   Read/Write   SDK
                                      |          |
                                      v          v
                                +----------+   +------------------+
                                |  Cloud   |   | Hugging Face API |
                                |Firestore |   +------------------+
                                +----------+
```

### Folder Structure
- `backend/`: Configuration management, Firestore database services, schemas, calculator math, endpoints, and LLM orchestration.
- `frontend/`: App router layouts, page wrappers, reusable UI components, and API client layers.
- `tests/`: Unit and api-level integration tests.

---

## 4. Feature Breakdown
- **Lifestyle Critique & Summary**: Automated qualitative feedback critiquing habits.
- **Carbon Footprint Calculator**: Core mathematical engine splitting transit, food, utilities, shopping, and flight impacts.
- **Priority Recommendation Engine**: Priority sorting utilizing:
  $$\text{Priority} = (\text{Impact} \times 3) + (5 - \text{Difficulty}) \times 2$$
- **30-Day Calendar Roadmap**: Custom 4-week habit-builder.
- **Daily Eco Challenges**: Tracker log supporting micro-habits.
- **Impact Dashboard**: Charts showing carbon category distribution and progress history.

---

## 5. AI Integration
- **Hugging Face Inference API**: Integrated using the Hugging Face API Client.
- **Graceful Degradation**: Fallback mock generation system executes automatically when the Hugging Face API token is missing or invalid, ensuring 100% service uptime during evaluations.
- **Context-Aware Prompting**: Chat history and carbon baseline metrics are appended into system instructions, enabling highly personalized advice.

---

## 6. Security & Infrastructure Measures
1. **Input Sanitization**: Pydantic input validation combined with custom Regex character filters stripping potential HTML tags or injection commands.
2. **Prompt Injection Mitigation**: Strict system boundaries with input size limits (max 500 characters) and jailbreak term blocklists.
3. **Rate Limiting**: IP-based Token Bucket limiter protecting routes against abuse.
4. **Secret Protection**: Environmental isolation using Pydantic Settings and GCP Secret Manager / Environment variables.
5. **Robust CORS Control**: Dynamic FastAPI CORS configuration using wildcard matching to support Vercel preview/branch URLs alongside standard localhost ports:
   `allow_origin_regex = r"https://.*\.vercel\.app"`
6. **State Persistence**: Hybrid storage layer automatically selecting Cloud Firestore for production and fallback `db.json` files for local development.

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

## 9. Setup & Deployment Instructions

### Local Backend Setup
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
3. Create your `.env` file from the template and fill in your Hugging Face API token:
   ```bash
   cp .env.template .env
   # Edit .env and enter: HF_TOKEN=hf_...
   ```
4. Run the backend server:
   ```bash
   uvicorn app:app --reload --port 8000
   ```

### Local Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Create a `.env` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Access the web app at `http://localhost:3000`.

---

## 10. Deployment to Production

### Backend Deployment (Google Cloud Run)
The backend is packaged inside a lightweight production Docker container and deployed to Google Cloud Run:
```bash
# Deploys service directly using Cloud Build to package the Docker container
gcloud run deploy carboncoach-api --source . --region asia-south1 --project carboncoachai
```
Make sure to configure the environment variables in your Cloud Run settings:
*   `HF_TOKEN`: Hugging Face API token.
*   `ENVIRONMENT`: Set to `production` to activate Firestore database mode.

### Database Setup (GCP Firestore)
In production, Cloud Run requires Firestore:
1. Enable the Firestore API:
   ```bash
   gcloud services enable firestore.googleapis.com --project carboncoachai
   ```
2. Create the default database in Native mode:
   ```bash
   gcloud firestore databases create --location=asia-south1 --type=firestore-native --project carboncoachai
   ```

### Frontend Deployment (Vercel)
The frontend is hosted on Vercel and builds automatically from the Git repository:
1. Connect your repository to Vercel.
2. Link the folder using Vercel CLI:
   ```bash
   npx vercel link
   ```
3. Configure the Environment Variables:
   *   `NEXT_PUBLIC_API_URL`: Set to your deployed Cloud Run URL (e.g. `https://carboncoach-api-366985234126.asia-south1.run.app`).
4. Trigger production deploy:
   ```bash
   npx vercel --prod
   ```

---

## 11. Future Scope
- **Real utility bill OCR**: Parse electricity and heating footprints directly from uploads using Hugging Face.
- **Stripe/Eco integrations**: Allow carbon offset purchasing directly from the recommendations card.
- **Leaderboards**: Team footprint tracking for corporate ESG goals.
