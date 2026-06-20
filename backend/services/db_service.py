import json
import os
import threading
from typing import Dict, List, Optional
from datetime import datetime
import uuid

# Lock for thread safety during database writes
_db_lock = threading.Lock()

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
        init_db()

    def _read(self) -> dict:
        with _db_lock:
            with open(DB_FILE, "r", encoding="utf-8") as f:
                return json.load(f)

    def _write(self, data: dict):
        with _db_lock:
            with open(DB_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)

    def get_latest_assessment(self) -> Optional[dict]:
        db = self._read()
        assessments = db.get("assessments", [])
        if not assessments:
            return None
        # Return the one with latest timestamp or last item
        return assessments[-1]

    def get_assessments(self) -> List[dict]:
        db = self._read()
        return db.get("assessments", [])

    def save_assessment(self, assessment: dict):
        db = self._read()
        db["assessments"].append(assessment)
        self._write(db)

    def get_roadmap(self) -> Optional[dict]:
        db = self._read()
        return db.get("roadmap")

    def save_roadmap(self, roadmap: dict):
        db = self._read()
        db["roadmap"] = roadmap
        self._write(db)

    def get_recommendations(self) -> List[dict]:
        db = self._read()
        return db.get("recommendations", [])

    def save_recommendations(self, recs: List[dict]):
        db = self._read()
        db["recommendations"] = recs
        self._write(db)

    def get_challenges(self) -> List[dict]:
        db = self._read()
        return db.get("challenges", [])

    def complete_challenge(self, challenge_id: str) -> dict:
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
        db = self._read()
        return db.get("eco_points", 0)

    def get_chat_history(self) -> List[dict]:
        db = self._read()
        return db.get("chat_history", [])

    def add_chat_message(self, role: str, content: str):
        db = self._read()
        # Limit history to latest 50 messages to keep file small
        history = db.get("chat_history", [])
        history.append({"role": role, "content": content})
        db["chat_history"] = history[-50:]
        self._write(db)

    def reset_db(self):
        """Helper to reset database state for testing or testing cleanup."""
        db = {
            "assessments": [],
            "roadmap": None,
            "recommendations": [],
            "challenges": INITIAL_CHALLENGES,
            "eco_points": 0,
            "chat_history": []
        }
        self._write(db)
