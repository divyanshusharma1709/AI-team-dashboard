import firebase_admin
from datetime import datetime, timedelta
from firebase_admin import credentials, firestore


def init_db():
    if not firebase_admin._apps:
        cred = credentials.Certificate("firebase-credentials.json")
        firebase_admin.initialize_app(cred)
    return firestore.client()


def iso_date(days_from_now: int) -> str:
    return (datetime.now() + timedelta(days=days_from_now)).strftime("%Y-%m-%d")


def employees():
    return [
        {"name": "Ava Patel", "email": "ava.patel@company.com", "role": "Engineering Manager", "department": "Engineering"},
        {"name": "Noah Kim", "email": "noah.kim@company.com", "role": "Senior Backend Engineer", "department": "Engineering"},
        {"name": "Maya Chen", "email": "maya.chen@company.com", "role": "Frontend Engineer", "department": "Engineering"},
        {"name": "Liam Carter", "email": "liam.carter@company.com", "role": "SRE", "department": "Engineering"},
        {"name": "Sofia Ramos", "email": "sofia.ramos@company.com", "role": "QA Lead", "department": "Engineering"},
        {"name": "Ethan Brooks", "email": "ethan.brooks@company.com", "role": "Product Director", "department": "Product"},
        {"name": "Olivia Nguyen", "email": "olivia.nguyen@company.com", "role": "Senior Product Manager", "department": "Product"},
        {"name": "Mason Reed", "email": "mason.reed@company.com", "role": "Product Manager", "department": "Product"},
        {"name": "Isabella Flores", "email": "isabella.flores@company.com", "role": "Design Lead", "department": "Design"},
        {"name": "Lucas Shah", "email": "lucas.shah@company.com", "role": "UX Designer", "department": "Design"},
        {"name": "Amelia Scott", "email": "amelia.scott@company.com", "role": "Growth Marketing Manager", "department": "Marketing"},
        {"name": "Elijah Brown", "email": "elijah.brown@company.com", "role": "Content Strategist", "department": "Marketing"},
        {"name": "Harper Lewis", "email": "harper.lewis@company.com", "role": "Sales Manager", "department": "Sales"},
        {"name": "Benjamin Hall", "email": "benjamin.hall@company.com", "role": "Account Executive", "department": "Sales"},
        {"name": "Grace Turner", "email": "grace.turner@company.com", "role": "Customer Success Lead", "department": "Customer Success"},
        {"name": "Daniel White", "email": "daniel.white@company.com", "role": "Data Analyst", "department": "Operations"},
    ]


def tasks():
    return [
        # Critical incident stream
        {"title": "Fix API gateway timeout spike", "description": "P95 latency > 2.8s since Monday incident", "assigned_to": "liam.carter@company.com", "status": "in_progress", "due_date": iso_date(-1)},
        {"title": "Patch auth token refresh race condition", "description": "Users intermittently logged out during peak traffic", "assigned_to": "noah.kim@company.com", "status": "in_progress", "due_date": iso_date(-2)},
        {"title": "Backfill failed billing webhooks", "description": "Recover missed invoices after queue outage", "assigned_to": "noah.kim@company.com", "status": "pending", "due_date": iso_date(1)},
        {"title": "Create customer incident timeline", "description": "Public-facing postmortem draft for enterprise accounts", "assigned_to": "grace.turner@company.com", "status": "in_progress", "due_date": iso_date(0)},
        {"title": "Security review: OAuth callback validation", "description": "Blocker before enterprise rollout", "assigned_to": "sofia.ramos@company.com", "status": "pending", "due_date": iso_date(-3)},
        # Sprint deliverables
        {"title": "Launch usage analytics dashboard v2", "description": "Executive metrics and anomaly tiles", "assigned_to": "maya.chen@company.com", "status": "in_progress", "due_date": iso_date(2)},
        {"title": "Migrate reporting jobs to async workers", "description": "Reduce dashboard load times by 40%", "assigned_to": "noah.kim@company.com", "status": "in_progress", "due_date": iso_date(3)},
        {"title": "Implement onboarding checklist flow", "description": "Increase first-week activation", "assigned_to": "mason.reed@company.com", "status": "pending", "due_date": iso_date(4)},
        {"title": "Redesign task detail panel", "description": "Usability fixes from design audit", "assigned_to": "lucas.shah@company.com", "status": "pending", "due_date": iso_date(5)},
        {"title": "Roll out enterprise SSO setup wizard", "description": "Required for ACME expansion", "assigned_to": "olivia.nguyen@company.com", "status": "in_progress", "due_date": iso_date(2)},
        {"title": "Create launch campaign for Q2 release", "description": "Multi-channel sequence and webinar", "assigned_to": "amelia.scott@company.com", "status": "in_progress", "due_date": iso_date(6)},
        {"title": "Publish release announcement page", "description": "Coordinate with Product and Sales", "assigned_to": "elijah.brown@company.com", "status": "pending", "due_date": iso_date(7)},
        {"title": "Prepare top-20 renewal risk list", "description": "Customers affected by incident need outreach", "assigned_to": "harper.lewis@company.com", "status": "pending", "due_date": iso_date(1)},
        {"title": "Draft board KPI packet", "description": "Include completion rate, SLA trend, ARR impact", "assigned_to": "daniel.white@company.com", "status": "in_progress", "due_date": iso_date(2)},
        # Completed baseline
        {"title": "Set up canary deploy checks", "description": "Automated rollback gates", "assigned_to": "liam.carter@company.com", "status": "completed", "due_date": iso_date(-5)},
        {"title": "Clean up stale feature flags", "description": "Reduce dead-code paths", "assigned_to": "maya.chen@company.com", "status": "completed", "due_date": iso_date(-4)},
        {"title": "Finalize Q2 roadmap narrative", "description": "Approved in product review", "assigned_to": "ethan.brooks@company.com", "status": "completed", "due_date": iso_date(-6)},
        {"title": "Run accessibility audit on dashboard", "description": "WCAG contrast and keyboard flow", "assigned_to": "isabella.flores@company.com", "status": "completed", "due_date": iso_date(-3)},
        {"title": "Onboard new enterprise account: Northstar", "description": "Kickoff complete and integrations mapped", "assigned_to": "benjamin.hall@company.com", "status": "completed", "due_date": iso_date(-2)},
    ]


def meetings():
    return [
        {
            "title": "Incident War Room",
            "date": iso_date(0),
            "participants": [
                "ava.patel@company.com",
                "liam.carter@company.com",
                "noah.kim@company.com",
                "sofia.ramos@company.com",
                "grace.turner@company.com",
            ],
            "department": "Engineering",
        },
        {
            "title": "Executive Risk Review",
            "date": iso_date(1),
            "participants": [
                "ava.patel@company.com",
                "ethan.brooks@company.com",
                "olivia.nguyen@company.com",
                "daniel.white@company.com",
                "harper.lewis@company.com",
            ],
            "department": "Operations",
        },
        {
            "title": "Q2 Release Readiness",
            "date": iso_date(2),
            "participants": [
                "maya.chen@company.com",
                "olivia.nguyen@company.com",
                "isabella.flores@company.com",
                "amelia.scott@company.com",
                "benjamin.hall@company.com",
            ],
            "department": "Product",
        },
        {
            "title": "Customer Escalation Sync",
            "date": iso_date(0),
            "participants": [
                "grace.turner@company.com",
                "harper.lewis@company.com",
                "noah.kim@company.com",
                "liam.carter@company.com",
            ],
            "department": "Customer Success",
        },
        {
            "title": "Board Prep Metrics Review",
            "date": iso_date(3),
            "participants": [
                "daniel.white@company.com",
                "ethan.brooks@company.com",
                "ava.patel@company.com",
                "olivia.nguyen@company.com",
            ],
            "department": "Operations",
        },
    ]


def clear_collection(db, name: str):
    docs = db.collection(name).stream()
    for doc in docs:
        doc.reference.delete()


def seed_collection(db, name: str, items):
    for item in items:
        db.collection(name).add(item)


def main():
    db = init_db()

    employees_data = employees()
    tasks_data = tasks()
    meetings_data = meetings()

    print("Clearing existing collections...")
    for collection_name in ["employees", "tasks", "meetings"]:
        clear_collection(db, collection_name)

    print("Seeding high-pressure demo dataset...")
    seed_collection(db, "employees", employees_data)
    seed_collection(db, "tasks", tasks_data)
    seed_collection(db, "meetings", meetings_data)

    print(f"Done. Seeded {len(employees_data)} employees, {len(tasks_data)} tasks, {len(meetings_data)} meetings.")


if __name__ == "__main__":
    main()
