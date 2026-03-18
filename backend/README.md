# Team Management Dashboard Backend

This is the backend service for the AI-powered Team Management Dashboard. It provides APIs for task management, employee management, and AI-powered features like sentiment analysis and text summarization.

## Features

- Task Management API
- Employee Management API
- Sentiment Analysis using Hugging Face
- Text Summarization using Hugging Face
- Firebase Integration for data storage
- FastAPI for high-performance API endpoints

## Prerequisites

- Python 3.8+
- Firebase project and credentials
- Hugging Face API token

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit the `.env` file with your Firebase and Hugging Face credentials.

4. Add your Firebase credentials:
- Download your Firebase service account key JSON file
- Rename it to `firebase-credentials.json`
- Place it in the root directory of the backend

## Running the Application

1. Start the development server:
```bash
uvicorn main:app --reload
```

2. Access the API documentation:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

- `GET /`: Welcome message
- `GET /tasks`: List all tasks
- `POST /tasks`: Create a new task
- `GET /employees`: List all employees
- `POST /employees`: Create a new employee
- `POST /analyze-sentiment`: Analyze text sentiment
- `POST /summarize`: Generate text summary

## Development

The project uses:
- FastAPI for the web framework
- Firebase Admin SDK for database operations
- Hugging Face Transformers for AI features
- Pydantic for data validation
- Python-dotenv for environment variable management

## Security Notes

- In production, update CORS settings to allow only specific origins
- Store sensitive credentials securely
- Use environment variables for configuration
- Implement proper authentication and authorization 