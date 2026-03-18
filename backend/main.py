from fastapi import FastAPI, HTTPException, BackgroundTasks
import uuid
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import firebase_admin
from firebase_admin import credentials, firestore
# from transformers import pipeline
import os
from dotenv import load_dotenv
from agent import TeamDashboardAgent
from datetime import date
from fastapi.responses import JSONResponse


# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="Team Management Dashboard API")

def get_allowed_origins() -> List[str]:
    raw = os.getenv("ALLOWED_ORIGINS", "")
    if raw.strip():
        return [origin.strip() for origin in raw.split(",") if origin.strip()]
    return [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]


def build_firebase_credential():
    credential_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "firebase-credentials.json")
    if os.path.exists(credential_path):
        return credentials.Certificate(credential_path)

    config = {
        "type": "service_account",
        "project_id": os.getenv("FIREBASE_PROJECT_ID"),
        "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
        "private_key": os.getenv("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n"),
        "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
        "client_id": os.getenv("FIREBASE_CLIENT_ID"),
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": os.getenv("FIREBASE_CLIENT_X509_CERT_URL"),
        "universe_domain": "googleapis.com",
    }

    required_keys = [
        "project_id",
        "private_key_id",
        "private_key",
        "client_email",
        "client_id",
        "client_x509_cert_url",
    ]
    if all(config.get(key) for key in required_keys):
        return credentials.Certificate(config)

    raise RuntimeError(
        "Firebase credentials are not configured. Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_* environment variables."
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Firebase Admin
if not firebase_admin._apps:
    firebase_admin.initialize_app(build_firebase_credential())
db = firestore.client()

# Initialize Hugging Face models
# sentiment_analyzer = pipeline("sentiment-analysis")
# summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

# Initialize the agent
agent = TeamDashboardAgent()

# Pydantic models for request/response
class Task(BaseModel):
    title: str
    description: str
    assigned_to: str
    status: str = "pending"
    due_date: str | date

class Employee(BaseModel):
    name: str
    email: str
    role: str
    department: str

class Meeting(BaseModel):
    title: str
    date: str
    participants: List[str]
    audio_file: Optional[str] = None

class QueryRequest(BaseModel):
    query: str

# Routes
@app.get("/")
async def root():
    return {"message": "Welcome to Team Management Dashboard API"}


@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/tasks")
async def get_tasks():
    try:
        print("Fetching tasks from Firestore...")
        tasks_ref = db.collection("tasks")
        tasks = tasks_ref.stream()
        tasks_list = [{"id": task.id, **task.to_dict()} for task in tasks]
        print(f"Found {len(tasks_list)} tasks")
        return {
            "data": tasks_list,
            "total": len(tasks_list),
            "page": 1,
            "page_size": len(tasks_list)
        }
    except Exception as e:
        print(f"Error fetching tasks: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tasks")
async def create_task(task: Task):
    try:
        task_ref = db.collection("tasks").document()
        task_ref.set(task.dict())
        return {"id": task_ref.id, **task.dict()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/employees")
async def get_employees():
    try:
        print("Fetching employees from Firestore...")
        employees_ref = db.collection("employees")
        employees = employees_ref.stream()
        employees_list = [{"id": emp.id, **emp.to_dict()} for emp in employees]
        print(f"Found {len(employees_list)} employees")
        return {
            "data": employees_list,
            "total": len(employees_list),
            "page": 1,
            "page_size": len(employees_list)
        }
    except Exception as e:
        print(f"Error fetching employees: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/employees")
async def create_employee(employee: Employee):
    try:
        employee_ref = db.collection("employees").document()
        employee_ref.set(employee.dict())
        return {"id": employee_ref.id, **employee.dict()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-sentiment")
async def analyze_sentiment(text: str):
    try:
        result = sentiment_analyzer(text)
        return {"sentiment": result[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/summarize")
async def summarize_text(text: str):
    try:
        summary = summarizer(text, max_length=130, min_length=30, do_sample=False)
        return {"summary": summary[0]["summary_text"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

job_store: Dict[str, Dict] = {}



@app.post("/query")
async def start_query(request: QueryRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    job_store[job_id] = {"status": "pending", "result": None}

    background_tasks.add_task(run_agent_task, job_id, request.query)
    return {"jobId": job_id}

async def run_agent_task(job_id: str, query: str):
    try:
        print(f"Starting agent task for job {job_id}")
        result = await agent.process_query(query)
        job_store[job_id] = {"status": "complete", "result": result}
        print(f"Agent task completed for job {job_id}")
    except Exception as e:
        job_store[job_id] = {"status": "failed", "error": str(e)}
        print(f"Agent task failed for job {job_id}: {e}")

@app.get("/query-status")
async def get_query_status(jobId: str):
    job = job_store.get(jobId)
    if not job:
        return JSONResponse(status_code=404, content={"error": "Job not found"})

    return job

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 
