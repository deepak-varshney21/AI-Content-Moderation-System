# Backend: AI Content Moderation System

Production-ready FastAPI backend for multi-label English toxicity classification, severity estimation, policy decision making, and word-boundary safe text censoring.

## Architecture

```
backend/
├── app/
│   ├── main.py               # Application entrypoint & lifespan management
│   ├── config.py             # Centralized configuration & thresholds
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py         # REST endpoints (/health, /predict, /moderate, /history, /stats)
│   ├── services/
│   │   ├── __init__.py
│   │   ├── toxicity_model.py # Hugging Face Model wrapper (Sigmoid multi-label)
│   │   ├── severity.py       # Severity estimation engine (LOW, MEDIUM, HIGH, CRITICAL)
│   │   ├── censor.py         # Safe word-boundary text masking engine
│   │   └── moderation.py     # End-to-end pipeline orchestrator
│   ├── policy/
│   │   ├── __init__.py
│   │   └── rules.py          # Action decision rules (ALLOW, CENSOR, HIDE, FLAG, DELETE)
│   ├── database/
│   │   ├── __init__.py
│   │   ├── database.py       # SQLite engine & session dependency
│   │   └── models.py         # SQLAlchemy ModerationRecord model
│   └── schemas/
│       ├── __init__.py
│       └── moderation.py     # Pydantic request/response validation schemas
├── resources/
│   └── bad_words.txt         # Configurable profanities dictionary
├── tests/
│   ├── test_pipeline.py      # Unit tests for core engines
│   └── test_api.py           # Integration tests for FastAPI endpoints
├── requirements.txt
├── .env.example
├── Dockerfile
└── pytest.ini
```

## Quickstart

### 1. Create and Activate Virtual Environment
```bash
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run FastAPI Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Interactive Swagger API documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

### 4. Run Automated Tests
```bash
pytest
```
