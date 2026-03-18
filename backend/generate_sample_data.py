import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timedelta
import random
from typing import List, Dict

# Initialize Firebase Admin
cred = credentials.Certificate("firebase-credentials.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# Sample data
FIRST_NAMES = [
    "James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles",
    "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen",
    "Emma", "Liam", "Olivia", "Noah", "Ava", "Ethan", "Sophia", "Mason", "Isabella", "Lucas",
    "Mia", "Jackson", "Amelia", "Aiden", "Harper", "Elijah", "Evelyn", "Grayson", "Abigail", "Benjamin"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
    "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
    "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
    "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores"
]

DEPARTMENTS = ["Engineering", "Product", "Design", "Marketing", "Sales", "HR"]
ROLES = {
    "Engineering": ["Software Engineer", "Senior Engineer", "Tech Lead", "Architect"],
    "Product": ["Product Manager", "Product Owner", "Business Analyst"],
    "Design": ["UI Designer", "UX Designer", "Design Lead"],
    "Marketing": ["Marketing Manager", "Content Strategist", "Digital Marketing"],
    "Sales": ["Sales Representative", "Sales Manager", "Account Executive"],
    "HR": ["HR Manager", "HR Specialist", "Recruiter"]
}

TASK_TITLES = [
    "Implement user authentication",
    "Design new dashboard layout",
    "Create marketing campaign",
    "Conduct team training",
    "Update documentation",
    "Fix bug in login system",
    "Optimize database queries",
    "Create monthly report",
    "Plan quarterly review",
    "Update company policies",
    "Refactor legacy code",
    "Set up CI/CD pipeline",
    "Write unit tests",
    "Review pull requests",
    "Deploy to production",
    "Monitor system performance",
    "Create API documentation",
    "Design database schema",
    "Implement caching layer",
    "Setup monitoring alerts"
]

TASK_DESCRIPTIONS = [
    "Implement secure user authentication system with JWT tokens",
    "Design and implement new responsive dashboard layout using TailwindCSS",
    "Create and launch new marketing campaign for Q2",
    "Organize and conduct team training session on new tools",
    "Update technical documentation for all APIs",
    "Fix critical bug in login system causing session timeouts",
    "Optimize database queries for better performance",
    "Generate and analyze monthly performance metrics",
    "Plan and schedule quarterly team review meeting",
    "Review and update company policies and procedures",
    "Refactor legacy code to improve maintainability",
    "Set up continuous integration and deployment pipeline",
    "Write comprehensive unit tests for core functionality",
    "Review and provide feedback on pull requests",
    "Deploy latest changes to production environment",
    "Monitor and analyze system performance metrics",
    "Create detailed API documentation for developers",
    "Design and implement new database schema",
    "Implement caching layer for better performance",
    "Setup monitoring and alerting system"
]

def generate_employees(count: int = 20) -> List[Dict]:
    employees = []
    used_names = set()  # To ensure unique names
    
    for i in range(count):
        # Generate unique name combination
        while True:
            first_name = random.choice(FIRST_NAMES)
            last_name = random.choice(LAST_NAMES)
            full_name = f"{first_name} {last_name}"
            if full_name not in used_names:
                used_names.add(full_name)
                break
        
        department = random.choice(DEPARTMENTS)
        role = random.choice(ROLES[department])
        email = f"{first_name.lower()}.{last_name.lower()}@company.com"
        
        employees.append({
            "name": full_name,
            "email": email,
            "role": role,
            "department": department
        })
    return employees

def generate_tasks(employees: List[Dict], count: int = 30) -> List[Dict]:
    tasks = []
    statuses = ["pending", "in_progress", "completed"]
    
    for i in range(count):
        assigned_to = random.choice(employees)["email"]
        status = random.choice(statuses)
        due_date = (datetime.now() + timedelta(days=random.randint(1, 30))).strftime("%Y-%m-%d")
        
        task_index = random.randint(0, len(TASK_TITLES) - 1)
        tasks.append({
            "title": TASK_TITLES[task_index],
            "description": TASK_DESCRIPTIONS[task_index],
            "assigned_to": assigned_to,
            "status": status,
            "due_date": due_date
        })
    return tasks

def generate_meetings(employees: List[Dict], count: int = 10) -> List[Dict]:
    meetings = []
    for i in range(count):
        num_participants = random.randint(3, 8)
        participants = random.sample([emp["email"] for emp in employees], num_participants)
        date = (datetime.now() + timedelta(days=random.randint(1, 14))).strftime("%Y-%m-%d")
        
        meetings.append({
            "title": f"Team Meeting {i+1}",
            "date": date,
            "participants": participants,
            "audio_file": None  # Will be populated when actual meeting recording is uploaded
        })
    return meetings

def populate_database():
    try:
        # Generate sample data
        print("Generating sample data...")
        employees = generate_employees()
        print(f"Generated {len(employees)} employees")
        
        tasks = generate_tasks(employees)
        print(f"Generated {len(tasks)} tasks")
        
        meetings = generate_meetings(employees)
        print(f"Generated {len(meetings)} meetings")
        
        # Clear existing data
        print("Clearing existing data...")
        for collection in ["employees", "tasks", "meetings"]:
            docs = db.collection(collection).stream()
            for doc in docs:
                doc.reference.delete()
        
        # Add to Firestore
        print("Adding employees to Firestore...")
        for employee in employees:
            doc_ref = db.collection("employees").add(employee)
            print(f"Added employee: {employee['name']}")
        
        print("Adding tasks to Firestore...")
        for task in tasks:
            doc_ref = db.collection("tasks").add(task)
            print(f"Added task: {task['title']} assigned to {task['assigned_to']}")
        
        print("Adding meetings to Firestore...")
        for meeting in meetings:
            doc_ref = db.collection("meetings").add(meeting)
            print(f"Added meeting: {meeting['title']}")
        
        print(f"Successfully added {len(employees)} employees, {len(tasks)} tasks, and {len(meetings)} meetings to the database.")
        
    except Exception as e:
        print(f"Error populating database: {str(e)}")
        raise e

if __name__ == "__main__":
    populate_database() 