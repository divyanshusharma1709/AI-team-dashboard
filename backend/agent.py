import json
import logging
import os
import re
from datetime import datetime
from typing import Any, Dict, List, Tuple

import firebase_admin
import requests
from dotenv import load_dotenv
from firebase_admin import credentials, firestore

load_dotenv()

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)


class TeamDashboardAgent:
    STOPWORDS = {
        "the",
        "a",
        "an",
        "is",
        "are",
        "and",
        "or",
        "to",
        "for",
        "of",
        "in",
        "on",
        "with",
        "show",
        "me",
        "what",
        "who",
    }

    def __init__(self):
        try:
            if not firebase_admin._apps:
                private_key = os.getenv("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n")
                cred = credentials.Certificate(
                    {
                        "type": "service_account",
                        "project_id": os.getenv("FIREBASE_PROJECT_ID"),
                        "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
                        "private_key": private_key,
                        "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
                        "client_id": os.getenv("FIREBASE_CLIENT_ID"),
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                        "client_x509_cert_url": os.getenv("FIREBASE_CLIENT_X509_CERT_URL"),
                        "universe_domain": "googleapis.com",
                    }
                )
                firebase_admin.initialize_app(cred)

            self.db = firestore.client()
            self.api_key = os.getenv("TOGETHER_API_KEY")
            self.model = "mistralai/Mistral-Small-24B-Instruct-2501"
        except Exception as e:
            logger.error(f"Init error: {e}")
            raise

    @staticmethod
    def _tokenize(text: str) -> List[str]:
        tokens = re.findall(r"[a-z0-9]+", text.lower())
        return [t for t in tokens if len(t) > 2 and t not in TeamDashboardAgent.STOPWORDS]

    @staticmethod
    def _safe_text(value: Any) -> str:
        if value is None:
            return ""
        if isinstance(value, list):
            return " ".join(str(v) for v in value)
        return str(value)

    @staticmethod
    def _to_iso_date(date_text: str) -> str:
        try:
            return datetime.fromisoformat(date_text.replace("Z", "")).date().isoformat()
        except Exception:
            return ""

    def call_llm(self, prompt: str, max_tokens: int = 700) -> str:
        if not self.api_key:
            return ""

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        data = {
            "model": self.model,
            "prompt": prompt,
            "max_tokens": max_tokens,
            "temperature": 0.2,
            "top_p": 0.9,
        }

        try:
            res = requests.post(
                "https://api.together.xyz/v1/completions",
                json=data,
                headers=headers,
                timeout=30,
            )
            if res.status_code != 200:
                logger.error(f"LLM call failed: {res.text}")
                return ""
            return res.json()["choices"][0]["text"].strip()
        except Exception as e:
            logger.error(f"LLM request failed: {e}")
            return ""

    async def classify_query(self, query: str) -> str:
        task_keywords = [
            "task",
            "employee",
            "meeting",
            "status",
            "due",
            "assign",
            "completed",
            "progress",
            "blocked",
            "summary",
            "report",
            "dashboard",
            "department",
            "workload",
        ]
        query_lower = query.lower()
        if any(keyword in query_lower for keyword in task_keywords):
            return "task-related"
        return "general"

    async def get_context(self) -> Dict[str, List[Dict[str, Any]]]:
        context: Dict[str, List[Dict[str, Any]]] = {"employees": [], "tasks": [], "meetings": []}
        limits = {"employees": 80, "tasks": 160, "meetings": 80}
        for collection_name in context.keys():
            docs = self.db.collection(collection_name).limit(limits[collection_name]).stream()
            for doc in docs:
                data = doc.to_dict() or {}
                data["id"] = doc.id
                context[collection_name].append(data)
        return context

    def _compute_kpis(self, context: Dict[str, List[Dict[str, Any]]]) -> Dict[str, Any]:
        tasks = context.get("tasks", [])
        employees = context.get("employees", [])
        meetings = context.get("meetings", [])

        total_tasks = len(tasks)
        completed_tasks = sum(1 for t in tasks if str(t.get("status", "")).lower() == "completed")
        in_progress_tasks = sum(1 for t in tasks if str(t.get("status", "")).lower() == "in_progress")
        pending_tasks = sum(1 for t in tasks if str(t.get("status", "")).lower() == "pending")

        today = datetime.utcnow().date().isoformat()
        overdue_tasks = sum(
            1
            for t in tasks
            if self._to_iso_date(self._safe_text(t.get("due_date")))
            and self._to_iso_date(self._safe_text(t.get("due_date"))) < today
            and str(t.get("status", "")).lower() != "completed"
        )

        completion_rate = round((completed_tasks / total_tasks) * 100, 1) if total_tasks else 0.0

        by_assignee: Dict[str, int] = {}
        for task in tasks:
            assignee = self._safe_text(task.get("assigned_to")) or "Unassigned"
            by_assignee[assignee] = by_assignee.get(assignee, 0) + 1

        top_assignees = sorted(by_assignee.items(), key=lambda x: x[1], reverse=True)[:3]

        return {
            "total_tasks": total_tasks,
            "total_employees": len(employees),
            "total_meetings": len(meetings),
            "completed_tasks": completed_tasks,
            "in_progress_tasks": in_progress_tasks,
            "pending_tasks": pending_tasks,
            "overdue_tasks": overdue_tasks,
            "completion_rate": completion_rate,
            "top_assignees": [{"name": name, "task_count": count} for name, count in top_assignees],
        }

    def _score_doc(self, query_tokens: List[str], query_lower: str, collection: str, doc: Dict[str, Any]) -> float:
        searchable_fields: Dict[str, List[str]] = {
            "tasks": ["title", "description", "assigned_to", "status", "due_date"],
            "employees": ["name", "email", "role", "department"],
            "meetings": ["title", "date", "participants", "department"],
        }

        text_parts: List[str] = []
        for field in searchable_fields.get(collection, []):
            text_parts.append(self._safe_text(doc.get(field)))

        combined_text = " ".join(text_parts).lower()
        if not combined_text.strip():
            return 0.0

        doc_tokens = set(self._tokenize(combined_text))
        if not doc_tokens:
            return 0.0

        token_hits = sum(1 for token in set(query_tokens) if token in doc_tokens)
        score = token_hits / max(1, len(set(query_tokens)))

        if collection == "tasks":
            status = self._safe_text(doc.get("status")).lower()
            if "completed" in query_lower and status == "completed":
                score += 0.35
            if "in progress" in query_lower and status == "in_progress":
                score += 0.35
            if "pending" in query_lower and status == "pending":
                score += 0.35
            if "overdue" in query_lower:
                due = self._to_iso_date(self._safe_text(doc.get("due_date")))
                if due and due < datetime.utcnow().date().isoformat() and status != "completed":
                    score += 0.45

        if collection == "employees":
            dept = self._safe_text(doc.get("department")).lower()
            if dept and dept in query_lower:
                score += 0.4

        return round(score, 3)

    def _retrieve_relevant(self, query: str, context: Dict[str, List[Dict[str, Any]]]) -> Tuple[List[Dict[str, Any]], float]:
        query_lower = query.lower()
        query_tokens = self._tokenize(query)
        matches: List[Dict[str, Any]] = []

        for collection in ["tasks", "employees", "meetings"]:
            for doc in context.get(collection, []):
                score = self._score_doc(query_tokens, query_lower, collection, doc)
                if score <= 0:
                    continue

                preview_fields = {
                    "tasks": ["title", "status", "assigned_to", "due_date"],
                    "employees": ["name", "role", "department"],
                    "meetings": ["title", "date", "participants"],
                }[collection]

                preview = {field: doc.get(field) for field in preview_fields if field in doc}

                matches.append(
                    {
                        "collection": collection,
                        "id": doc.get("id"),
                        "score": score,
                        "preview": preview,
                    }
                )

        matches.sort(key=lambda item: item["score"], reverse=True)
        top_matches = matches[:8]

        confidence = 0.0
        if top_matches:
            confidence = min(0.98, round(sum(m["score"] for m in top_matches[:3]) / max(1, min(3, len(top_matches))), 2))

        return top_matches, confidence

    def _fallback_answer(self, query: str, matches: List[Dict[str, Any]], kpis: Dict[str, Any]) -> str:
        if not matches:
            return (
                "I could not find direct matches in your current dashboard data. "
                "Try naming a person, department, task status, or due date range."
            )

        lines = [
            f"Based on your current data, there are {kpis['total_tasks']} tasks and {kpis['total_employees']} employees.",
            f"Completion rate is {kpis['completion_rate']}% with {kpis['overdue_tasks']} overdue task(s).",
            "Top relevant records:",
        ]

        for item in matches[:4]:
            preview_text = ", ".join(f"{k}: {v}" for k, v in item["preview"].items())
            lines.append(f"- [{item['collection']}] {preview_text}")

        return "\n".join(lines)

    def _parse_json_response(self, text: str) -> Dict[str, Any]:
        if not text:
            return {}
        try:
            start = text.find("{")
            end = text.rfind("}")
            if start == -1 or end == -1:
                return {}
            return json.loads(text[start : end + 1])
        except Exception:
            return {}

    def _llm_answer(self, query: str, matches: List[Dict[str, Any]], kpis: Dict[str, Any]) -> Dict[str, Any]:
        prompt = f"""
You are an AI operations analyst for a team dashboard.
Use only the evidence provided.

User query:
{query}

Dashboard KPIs:
{kpis}

Top retrieved evidence:
{matches}

Return JSON only with this schema:
{{
  "answer": "string",
  "follow_ups": ["string", "string"],
  "risk_flags": ["string"]
}}

Rules:
- Be concise and business-ready.
- Mention concrete numbers when available.
- If confidence is low, say what data is missing.
"""

        text = self.call_llm(prompt)
        return self._parse_json_response(text)

    async def process_general_query(self, query: str) -> Dict[str, Any]:
        prompt = f"""
You are a friendly assistant in a team dashboard app.

A user asked: "{query}"

Return JSON only:
{{
  "answer": "string",
  "follow_ups": ["string", "string"],
  "risk_flags": []
}}
"""
        parsed = self._parse_json_response(self.call_llm(prompt, max_tokens=280))
        if parsed:
            return parsed
        return {
            "answer": "Happy to help. Ask about workload, overdue tasks, department capacity, or employee assignments.",
            "follow_ups": [
                "Do you want a weekly workload summary?",
                "Should I list overdue tasks by owner?",
            ],
            "risk_flags": [],
        }

    async def process_query(self, query: str) -> Dict[str, Any]:
        try:
            query_type = await self.classify_query(query)
            context = await self.get_context()
            kpis = self._compute_kpis(context)

            if query_type == "general":
                general = await self.process_general_query(query)
                return {
                    "answer": general.get("answer", "Happy to help."),
                    "confidence": 0.55,
                    "query_type": "general",
                    "kpis": kpis,
                    "evidence": [],
                    "follow_ups": general.get("follow_ups", []),
                    "risk_flags": general.get("risk_flags", []),
                }

            evidence, confidence = self._retrieve_relevant(query, context)
            llm_payload = self._llm_answer(query, evidence, kpis)

            answer = llm_payload.get("answer") or self._fallback_answer(query, evidence, kpis)
            follow_ups = llm_payload.get("follow_ups") or [
                "Show me overdue tasks grouped by assignee.",
                "Highlight teams with the highest in-progress workload.",
            ]
            risk_flags = llm_payload.get("risk_flags") or []

            return {
                "answer": answer,
                "confidence": confidence,
                "query_type": "task-related",
                "kpis": kpis,
                "evidence": evidence,
                "follow_ups": follow_ups[:3],
                "risk_flags": risk_flags[:4],
            }

        except Exception as e:
            logger.error(f"process_query error: {e}")
            return {
                "answer": "Something went wrong while processing your query.",
                "confidence": 0.0,
                "query_type": "error",
                "kpis": {},
                "evidence": [],
                "follow_ups": [],
                "risk_flags": ["Query processing error"],
            }
