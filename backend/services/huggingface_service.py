import json
import logging
import os
import re
from typing import Dict, List, Optional
from config import settings
from models.schemas import (
    AssessmentRequest,
    AnalysisResponse,
    RoadmapResponse,
    RoadmapItem,
    AIQuestion,
)

logger = logging.getLogger("huggingface_service")

from openai import OpenAI


def clean_and_parse_json(text: str) -> dict:
    """
    Cleans raw model text response and parses it to a dict.
    Supports pure JSON, markdown-wrapped blocks (```json), leading/trailing text.
    Logs the raw response and raises on failure.
    """
    logger.info(f"Raw CarbonCoach AI Response to Parse:\n{text}")

    if not text or not text.strip():
        raise ValueError("Failed: Empty response received from CarbonCoach AI")

    cleaned = text.strip()

    # 1. Clean markdown code block fences (e.g. ```json ... ``` or ``` ... ```)
    if "```" in cleaned:
        match = re.search(r"```(?:json)?\s*(.*?)\s*```", cleaned, re.DOTALL)
        if match:
            cleaned = match.group(1).strip()

    # 2. Extract contents between first '{' and last '}' (or '[' and ']' for lists)
    first_brace = cleaned.find("{")
    last_brace = cleaned.rfind("}")

    first_bracket = cleaned.find("[")
    last_bracket = cleaned.rfind("]")

    # Find which enclosure is outer
    has_braces = first_brace != -1 and last_brace != -1 and last_brace > first_brace
    has_brackets = (
        first_bracket != -1 and last_bracket != -1 and last_bracket > first_bracket
    )

    if has_braces and has_brackets:
        if first_brace < first_bracket:
            cleaned = cleaned[first_brace : last_brace + 1]
        else:
            cleaned = cleaned[first_bracket : last_bracket + 1]
    elif has_braces:
        cleaned = cleaned[first_brace : last_brace + 1]
    elif has_brackets:
        cleaned = cleaned[first_bracket : last_bracket + 1]

    if not cleaned:
        raise ValueError(
            "Failed: Could not find any JSON brackets or braces in the response"
        )

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        logger.error(
            f"JSONDecodeError parsing text: {e}. Cleaned content attempted: {cleaned}"
        )
        raise ValueError(f"Failed: Invalid JSON format returned from AI: {e}")


class HuggingFaceService:
    def __init__(self):
        # Load Hugging Face Token from environment, settings, or fallback
        self.api_key = os.getenv("HF_TOKEN", settings.HF_TOKEN)
        self.client = None
        print("HF_TOKEN:", self.api_key[:10] if self.api_key else "NOT FOUND")
        if self.api_key and "your_" not in self.api_key.lower():
            try:
                self.client = OpenAI(
                    base_url="https://router.huggingface.co/v1",
                    api_key=self.api_key,
                )
                logger.info("Hugging Face OpenAI client successfully initialized.")
            except Exception as e:
                logger.error(f"Failed to initialize Hugging Face OpenAI client: {e}")
        else:
            logger.info("No valid HF_TOKEN or API key found.")

    def _call_huggingface(self, prompt: str, system_instruction: str) -> str:
        """
        Interacts with Hugging Face Qwen model via OpenAI compatible API.
        """
        if not self.client:
            raise ValueError(
                "Hugging Face API key (HF_TOKEN) is missing or not configured. Please add a valid HF_TOKEN to your backend/.env file."
            )

        try:
            completion = self.client.chat.completions.create(
                model="deepseek-ai/DeepSeek-V4-Flash:novita",
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": prompt},
                ],
            )
            return completion.choices[0].message.content or ""
        except Exception as e:
            logger.error(f"Error calling Hugging Face: {e}")
            err_msg = str(e)
            if "401" in err_msg or "unauthorized" in err_msg.lower() or "invalid username or password" in err_msg.lower():
                raise ValueError(
                    "Your Hugging Face API key (HF_TOKEN) is unauthorized or invalid. Please check the HF_TOKEN variable in your backend/.env file."
                )
            raise ValueError(err_msg)

    def generate_assessment_questions(
        self, latest_assessment: Optional[dict] = None
    ) -> List[AIQuestion]:
        """
        Generates 5 personalized, engaging questions for the assessment categories:
        transportation, electricity, diet, shopping, flights.
        Options must be exactly the set of enums we support in calculator.py.
        Tailors question titles/descriptions if a previous assessment exists.
        """
        prompt = (
            "Generate 5 engaging, modern sustainability questions for an assessment form.\n"
            "The 5 questions must map to the following identifiers in order: 'transportation', 'electricity', 'diet', 'shopping', 'flights'.\n"
            "For each question, provide a title, a user-friendly description, and a list of options. The options list must match the allowed values exactly.\n"
            "Allowed values map:\n"
            "- transportation: ['Walk', 'Bicycle', 'Public Transport', 'Car']\n"
            "- electricity: ['Rarely', '1–4 Hours', '4–8 Hours', '8+ Hours']\n"
            "- diet: ['Vegan', 'Vegetarian', 'Mixed', 'Meat Heavy']\n"
            "- shopping: ['Rarely', 'Monthly', 'Weekly', 'Frequently']\n"
            "- flights: ['0', '1–2', '3–5', '5+']\n"
        )

        if latest_assessment:
            prompt += (
                f"\nThis is a RETAKE assessment. Customize the question titles and descriptions to challenge or follow up "
                f"on their previous assessment choices:\n"
                f"- Transportation previously chosen: {latest_assessment.get('transportation')}\n"
                f"- High electricity usage previously chosen: {latest_assessment.get('electricity')}\n"
                f"- Diet previously chosen: {latest_assessment.get('diet')}\n"
                f"- Shopping habits previously chosen: {latest_assessment.get('shopping')}\n"
                f"- Flight count previously chosen: {latest_assessment.get('flights')}\n"
                f"Create questions that focus on their specific areas of high emissions, prompting them on optimization plans or tracking changes. "
                f"Keep the options exactly the same, but rewrite the title/description to reflect this context."
            )

        system_instruction = (
            "You are CarbonCoach AI, a sustainability UX architect.\n"
            "Generate the questions in JSON format. Do not return any explanatory text or markdown backticks.\n"
            "Return ONLY a JSON array of objects adhering to this schema:\n"
            "[\n"
            "  {\n"
            '    "id": "transportation",\n'
            '    "title": "Engaging question title",\n'
            '    "description": "Engaging question description",\n'
            '    "options": ["Walk", "Bicycle", "Public Transport", "Car"]\n'
            "  },\n"
            "  ...\n"
            "]"
        )

        try:
            res_text = self._call_huggingface(prompt, system_instruction)
            data = clean_and_parse_json(res_text)

            ALLOWED_OPTIONS = {
                "transportation": ["Walk", "Bicycle", "Public Transport", "Car"],
                "electricity": ["Rarely", "1–4 Hours", "4–8 Hours", "8+ Hours"],
                "diet": ["Vegan", "Vegetarian", "Mixed", "Meat Heavy"],
                "shopping": ["Rarely", "Monthly", "Weekly", "Frequently"],
                "flights": ["0", "1–2", "3–5", "5+"],
            }

            questions = []
            for q in data:
                q_id = q["id"]
                # Enforce correct options to prevent 422 Unprocessable Entity
                opts = ALLOWED_OPTIONS.get(q_id, q.get("options", []))
                questions.append(
                    AIQuestion(
                        id=q_id,
                        title=q["title"],
                        description=q["description"],
                        options=opts,
                    )
                )

            if len(questions) != 5:
                raise ValueError(f"Expected 5 questions, got {len(questions)}")

            return questions
        except Exception as e:
            logger.error(f"Failed CarbonCoach AI questions generation: {e}")
            raise ValueError(str(e))

    def analyze_lifestyle(self, req: AssessmentRequest) -> AnalysisResponse:
        """
        Generates lifestyle summary, sustainability profile, and behavior observations.
        """
        prompt = (
            f"Assessment Data:\n"
            f"- Transportation: {req.transportation}\n"
            f"- High Electricity Usage hours/day: {req.electricity}\n"
            f"- Diet Type: {req.diet}\n"
            f"- Shopping habits: {req.shopping}\n"
            f"- Annual Flights: {req.flights}\n"
            f"- Lifestyle Notes: {req.notes}\n"
        )

        system_instruction = (
            "You are CarbonCoach AI, a sustainability analysis expert.\n"
            "Analyze the user's lifestyle and output a JSON object with this exact schema:\n"
            "{\n"
            '  "summary": "A 1-2 sentence overview of the carbon assessment findings.",\n'
            '  "profile": "A 1 sentence user persona (e.g. Eco-conscious commuter with high flight footprint).",\n'
            '  "observations": ["Observation 1", "Observation 2", "Observation 3"]\n'
            "}\n"
            "Keep observations actionable, factual, and strictly aligned with their inputs. "
            "Return ONLY raw JSON. Do not return markdown wrapping or backticks."
        )

        try:
            res_text = self._call_huggingface(prompt, system_instruction)
            data = clean_and_parse_json(res_text)
            return AnalysisResponse(
                summary=data.get("summary", ""),
                profile=data.get("profile", ""),
                observations=data.get("observations", []),
            )
        except Exception as e:
            logger.error(f"Failed CarbonCoach AI analysis: {e}")
            raise ValueError(str(e))

    def generate_roadmap(self, req: AssessmentRequest) -> RoadmapResponse:
        """
        Generates personalized 30-day roadmap.
        """
        prompt = (
            f"Assessment Data:\n"
            f"- Transportation: {req.transportation}\n"
            f"- Electricity: {req.electricity}\n"
            f"- Diet: {req.diet}\n"
            f"- Shopping: {req.shopping}\n"
            f"- Flights: {req.flights}\n"
        )

        system_instruction = (
            "You are CarbonCoach AI, a sustainability coach.\n"
            "Generate a personalized 4-week roadmap where each week contains a single specific action item, goal, and outcome.\n"
            "Output JSON matching this exact structure:\n"
            "{\n"
            '  "week1": {"action": "str", "goal": "str", "outcome": "str"},\n'
            '  "week2": {"action": "str", "goal": "str", "outcome": "str"},\n'
            '  "week3": {"action": "str", "goal": "str", "outcome": "str"},\n'
            '  "week4": {"action": "str", "goal": "str", "outcome": "str"}\n'
            "}\n"
            "Focus action items on the categories with the highest footprint. "
            "Return ONLY raw JSON. Do not return markdown wrapping or backticks."
        )

        try:
            res_text = self._call_huggingface(prompt, system_instruction)
            data = clean_and_parse_json(res_text)
            return RoadmapResponse(
                week1=RoadmapItem(**data.get("week1", {})),
                week2=RoadmapItem(**data.get("week2", {})),
                week3=RoadmapItem(**data.get("week3", {})),
                week4=RoadmapItem(**data.get("week4", {})),
            )
        except Exception as e:
            logger.error(f"Failed CarbonCoach AI roadmap: {e}")
            raise ValueError(str(e))

    def generate_chat_response(
        self, message: str, assessment: Optional[dict], chat_history: List[dict]
    ) -> str:
        """
        Responds to chatbot query using user carbon footprint profile and recommendation context.
        """
        history_str = ""
        for h in chat_history[-6:]:
            role = "User" if h.get("role") == "user" else "Assistant"
            history_str += f"{role}: {h.get('content')}\n"

        profile_context = "No assessment completed yet."
        if assessment:
            carbon = assessment.get("carbon_data", {})
            profile_context = (
                f"Transportation: {assessment.get('transportation')}, "
                f"Electricity: {assessment.get('electricity')}, "
                f"Diet: {assessment.get('diet')}, "
                f"Shopping: {assessment.get('shopping')}, "
                f"Flights: {assessment.get('flights')}.\n"
                f"Carbon footprint Breakdown: {json.dumps(carbon)} kg CO2/year.\n"
                f"Eco Score: {assessment.get('eco_score')}/100."
            )

        system_instruction = (
            "You are CarbonCoach AI, a friendly, encouraging sustainability chatbot.\n"
            "Analyze the user's carbon footprint profile and answer their sustainability questions.\n"
            "Always link advice back to their specific lifestyle choices. Be concise and professional.\n"
            "Do not suggest extreme lifestyle changes, focus on practical actions.\n"
            f"User Profile Context:\n{profile_context}\n"
        )

        prompt = f"Chat History:\n{history_str}\nUser Message: {message}"

        try:
            return self._call_huggingface(prompt, system_instruction)
        except Exception as e:
            logger.error(f"Failed CarbonCoach AI chat response: {e}")
            return f"Chat Error: {e}"
