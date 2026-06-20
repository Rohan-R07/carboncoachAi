import json
import os
import threading
import logging
from typing import Dict, List, Optional
from datetime import datetime
import uuid

# Lock for thread safety during local database writes
_db_lock = threading.Lock()

logger = logging.getLogger("db_service")

# Dynamic import check for Google Cloud Firestore to prevent local execution crashes
try:
    from google.cloud import firestore
    FIRESTORE_AVAILABLE = True
except ImportError:
    FIRESTORE_AVAILABLE = False

# Fallback path for local development database
DB_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "storage", "db.json")

INITIAL_CHALLENGES = [
    { "id": "challenge_1", "title": "Turn off unused electronics & appliances", "points": 10, "completed": False },
    { "id": "challenge_2", "title": "Avoid food delivery and cook at home", "points": 15, "completed": False },
    { "id": "challenge_3", "title": "Use a reusable water bottle/coffee mug today", "points": 10, "completed": False },
    { "id": "challenge_4", "title": "Commute via walking, biking, or public transit", "points": 20, "completed": False },
    { "id": "challenge_5", "title": "Unplug standby electronics overnight", "points": 10, "completed": False }
]

def init_db():
    """
    Ensures storage folder exists and db.json is initialized with standard structure.
    """
    os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)
    with _db_lock:
        if not os.path.exists(DB_FILE) or os.path.getsize(DB_FILE) == 0:
            default_structure = {
                "assessments": [],
                "roadmap": None,
                "recommendations": [],
                "challenges": INITIAL_CHALLENGES,
                "eco_points": 0,
                "chat_history": []
            }
            with open(DB_FILE, "w", encoding="utf-8") as f:
                json.dump(default_structure, f, indent=2)

class DatabaseService:
    def __init__(self):
        # Configure database source
        self.use_firestore = (
            FIRESTORE_AVAILABLE 
            and (
                os.getenv("USE_FIRESTORE", "").lower() == "true"
                or os.getenv("ENVIRONMENT", "").lower() == "production"
            )
        )
        self.firestore_client = None

        if self.use_firestore:
            try:
                # In GCP Cloud Run, default credentials will resolve automatically
                self.firestore_client = firestore.Client()
                logger.info("Stateless Google Cloud Firestore persistence layer successfully initialized.")
            except Exception as e:
                logger.error(f"Failed to initialize Firestore client, falling back to local file storage: {e}")
                self.use_firestore = False
        
        if not self.use_firestore:
            init_db()
            logger.info("Local file-based JSON persistence layer initialized.")

    # --- Local File Helper Methods ---
    def _read(self) -> dict:
        with _db_lock:
            with open(DB_FILE, "r", encoding="utf-8") as f:
                return json.load(f)

    def _write(self, data: dict):
        with _db_lock:
            with open(DB_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)

    # --- Common Persistence API Interface ---
    def get_latest_assessment(self) -> Optional[dict]:
        if self.use_firestore and self.firestore_client:
            try:
                # Retrieve the assessment with the latest timestamp
                docs = self.firestore_client.collection("assessments").order_by(
                    "timestamp", direction=firestore.Query.DESCENDING
                ).limit(1).stream()
                results = [doc.to_dict() for doc in docs]
                return results[0] if results else None
            except Exception as e:
                logger.error(f"Firestore get_latest_assessment error: {e}")
                return None
        else:
            db = self._read()
            assessments = db.get("assessments", [])
            return assessments[-1] if assessments else None

    def get_assessments(self) -> List[dict]:
        if self.use_firestore and self.firestore_client:
            try:
                docs = self.firestore_client.collection("assessments").order_by("timestamp").stream()
                return [doc.to_dict() for doc in docs]
            except Exception as e:
                logger.error(f"Firestore get_assessments error: {e}")
                return []
        else:
            db = self._read()
            return db.get("assessments", [])

    def save_assessment(self, assessment: dict):
        if self.use_firestore and self.firestore_client:
            try:
                self.firestore_client.collection("assessments").document(assessment["id"]).set(assessment)
            except Exception as e:
                logger.error(f"Firestore save_assessment error: {e}")
        else:
            db = self._read()
            db["assessments"].append(assessment)
            self._write(db)

    def get_roadmap(self) -> Optional[dict]:
        if self.use_firestore and self.firestore_client:
            try:
                doc = self.firestore_client.collection("roadmap").document("current").get()
                return doc.to_dict() if doc.exists else None
            except Exception as e:
                logger.error(f"Firestore get_roadmap error: {e}")
                return None
        else:
            db = self._read()
            return db.get("roadmap")

    def save_roadmap(self, roadmap: dict):
        if self.use_firestore and self.firestore_client:
            try:
                self.firestore_client.collection("roadmap").document("current").set(roadmap)
            except Exception as e:
                logger.error(f"Firestore save_roadmap error: {e}")
        else:
            db = self._read()
            db["roadmap"] = roadmap
            self._write(db)

    def get_recommendations(self) -> List[dict]:
        if self.use_firestore and self.firestore_client:
            try:
                doc = self.firestore_client.collection("recommendations").document("current").get()
                return doc.to_dict().get("list", []) if doc.exists else []
            except Exception as e:
                logger.error(f"Firestore get_recommendations error: {e}")
                return []
        else:
            db = self._read()
            return db.get("recommendations", [])

    def save_recommendations(self, recs: List[dict]):
        if self.use_firestore and self.firestore_client:
            try:
                self.firestore_client.collection("recommendations").document("current").set({"list": recs})
            except Exception as e:
                logger.error(f"Firestore save_recommendations error: {e}")
        else:
            db = self._read()
            db["recommendations"] = recs
            self._write(db)

    def get_challenges(self) -> List[dict]:
        if self.use_firestore and self.firestore_client:
            try:
                doc = self.firestore_client.collection("challenges").document("current").get()
                if doc.exists:
                    return doc.to_dict().get("list", [])
                else:
                    self.firestore_client.collection("challenges").document("current").set({"list": INITIAL_CHALLENGES})
                    return INITIAL_CHALLENGES
            except Exception as e:
                logger.error(f"Firestore get_challenges error: {e}")
                return INITIAL_CHALLENGES
        else:
            db = self._read()
            return db.get("challenges", [])

    def complete_challenge(self, challenge_id: str) -> dict:
        if self.use_firestore and self.firestore_client:
            try:
                challenges = self.get_challenges()
                found = False
                points_earned = 0
                for c in challenges:
                    if c["id"] == challenge_id and not c["completed"]:
                        c["completed"] = True
                        points_earned = c["points"]
                        found = True
                        break
                
                current_points = self.get_eco_points()
                new_points = current_points
                if found:
                    new_points = current_points + points_earned
                    self.firestore_client.collection("challenges").document("current").set({"list": challenges})
                    self.firestore_client.collection("user_profile").document("default_user").set(
                        {"eco_points": new_points}, merge=True
                    )
                
                return {
                    "success": found,
                    "eco_points": new_points,
                    "challenges": challenges
                }
            except Exception as e:
                logger.error(f"Firestore complete_challenge error: {e}")
                return {
                    "success": False,
                    "eco_points": 0,
                    "challenges": INITIAL_CHALLENGES
                }
        else:
            db = self._read()
            challenges = db.get("challenges", [])
            found = False
            points_earned = 0
            for c in challenges:
                if c["id"] == challenge_id and not c["completed"]:
                    c["completed"] = True
                    points_earned = c["points"]
                    found = True
                    break
            
            if found:
                db["eco_points"] = db.get("eco_points", 0) + points_earned
                self._write(db)
                
            return {
                "success": found,
                "eco_points": db["eco_points"],
                "challenges": challenges
            }

    def get_eco_points(self) -> int:
        if self.use_firestore and self.firestore_client:
            try:
                doc = self.firestore_client.collection("user_profile").document("default_user").get()
                return doc.to_dict().get("eco_points", 0) if doc.exists else 0
            except Exception as e:
                logger.error(f"Firestore get_eco_points error: {e}")
                return 0
        else:
            db = self._read()
            return db.get("eco_points", 0)

    def get_chat_history(self) -> List[dict]:
        if self.use_firestore and self.firestore_client:
            try:
                doc = self.firestore_client.collection("user_profile").document("default_user").get()
                return doc.to_dict().get("chat_history", []) if doc.exists else []
            except Exception as e:
                logger.error(f"Firestore get_chat_history error: {e}")
                return []
        else:
            db = self._read()
            return db.get("chat_history", [])

    def add_chat_message(self, role: str, content: str):
        if self.use_firestore and self.firestore_client:
            try:
                history = self.get_chat_history()
                history.append({"role": role, "content": content})
                history = history[-50:]  # cap at 50 messages
                self.firestore_client.collection("user_profile").document("default_user").set(
                    {"chat_history": history}, merge=True
                )
            except Exception as e:
                logger.error(f"Firestore add_chat_message error: {e}")
        else:
            db = self._read()
            history = db.get("chat_history", [])
            history.append({"role": role, "content": content})
            db["chat_history"] = history[-50:]
            self._write(db)

    def reset_db(self):
        """Resets database state for fresh user onboarding or test runs."""
        if self.use_firestore and self.firestore_client:
            try:
                # Delete all assessment entries
                assessments = self.firestore_client.collection("assessments").stream()
                for doc in assessments:
                    doc.reference.delete()
                
                # Delete static/current configs
                self.firestore_client.collection("roadmap").document("current").delete()
                self.firestore_client.collection("recommendations").document("current").delete()
                
                # Reset challenges
                self.firestore_client.collection("challenges").document("current").set({"list": INITIAL_CHALLENGES})
                
                # Reset profile
                self.firestore_client.collection("user_profile").document("default_user").set(
                    {"eco_points": 0, "chat_history": []}
                )
                logger.info("Stateless Firestore DB structure successfully reset.")
            except Exception as e:
                logger.error(f"Firestore reset_db error: {e}")
        else:
            db = {
                "assessments": [],
                "roadmap": None,
                "recommendations": [],
                "challenges": INITIAL_CHALLENGES,
                "eco_points": 0,
                "chat_history": []
            }
            self._write(db)
            logger.info("Local JSON DB structure successfully reset.")
