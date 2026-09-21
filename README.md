# AI-Powered Severity-Aware Multi-Label Content Moderation System (Version 1)

A complete, production-ready, and severity-aware content moderation platform for English user comments. The system performs multi-label toxicity classification across six independent categories using Hugging Face Transformers, interprets probabilities into calibrated severity tiers, applies configurable policy decisions, and provides word-boundary-safe text censoring with an interactive React dashboard.

---

## 1. System Architecture Diagram

```
[ USER COMMENT ]
       │
       ▼
[ 1. TEXT PREPROCESSING & VALIDATION ]
       │
       ▼
[ 2. HUGGING FACE TOXICITY MODEL ] ──► (XLM-RoBERTa / AutoModelForSequenceClassification)
       │
       ▼
[ 3. SIGMOID ACTIVATION ] ──► (6 Independent Multi-Label Probabilities: 0.00 - 1.00)
       │
       ├────────────────────────────────────────┐
       ▼                                        ▼
[ 4. SEVERITY ASSESSMENT ENGINE ]       [ 5. CENSOR ENGINE ]
   (LOW / MEDIUM / HIGH / CRITICAL)        (Safe \b Regex Word Masking)
       │                                        │
       └───────────────────┬────────────────────┘
                           ▼
              [ 6. POLICY / DECISION ENGINE ]
         (ALLOW / CENSOR / HIDE / FLAG / DELETE)
                           │
                           ▼
          [ 7. SQLITE DATABASE AUDIT LOG ]
                           │
                           ▼
         [ 8. FASTAPI REST API / REACT UI ]
```

---

## 2. Key Technologies

- **Backend**: Python 3.10+, FastAPI, PyTorch, Hugging Face Transformers (`transformers`), Pydantic v2, SQLAlchemy, Uvicorn, Pytest.
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React icons.
- **Database**: SQLite with SQLAlchemy ORM.
- **Model**: Pretrained Hugging Face sequence classification model (`oleksiizirka/xlm-roberta-toxicity-classifier`).

---

## 3. The 6 Independent Toxicity Labels

Unlike binary toxic/clean classifiers, this system assesses comments across six distinct and orthogonal dimensions simultaneously:

| Label | Description | Example Target |
| :--- | :--- | :--- |
| **`toxic`** | General rude, aggressive, disrespectful, or hostile commentary. | "You have no idea what you are doing." |
| **`severe_toxic`** | Extremely hateful, aggressive, or destructive toxicity. | Compound attacks combining extreme hostility. |
| **`obscene`** | Vulgarities, sexual explicit remarks, or severe profanities. | Profane insults and vulgar slurs. |
| **`threat`** | Direct physical threats, intimidation, or violence statements. | "I am going to find you and kill you." |
| **`insult`** | Demeaning, belittling, or derogatory personal remarks. | "You are a complete idiot and moron." |
| **`identity_hate`** | Hate speech targeting race, religion, gender, ethnicity, or sexual orientation. | Slurs or discriminatory expulsion calls. |

A single comment can trigger multiple labels simultaneously (e.g., both `toxic` and `insult`, or `toxic`, `threat`, and `severe_toxic`).

---

## 4. Multi-Label Classification & Sigmoid Activation

### Why Not Softmax?
In single-label multi-class classification, `Softmax` forces all category probabilities to sum to 1.0 ($100\%$). If applied to multi-label toxicity, a high probability in `insult` would artificially suppress the probability of `threat` or `toxic`.

### The Sigmoid Approach
In this system, we apply the element-wise **Sigmoid function** ($\sigma(z) = \frac{1}{1 + e^{-z}}$) to each output logit independently:
$$P(\text{label}_i) = \sigma(\text{logit}_i) \in [0.0, 1.0]$$
This allows each toxicity category to be evaluated independently on its own merit.

---

## 5. Severity Assessment Engine

The Severity Engine (`app/services/severity.py`) interprets raw model probabilities into four calibrated severity levels and an aggregate severity score:

- **`CRITICAL`** (Score $\ge 0.85$): Physical threats (`threat >= 0.50`), extreme severe toxicity (`severe_toxic >= 0.55`), or combination threat indicators.
- **`HIGH`** (Score $\ge 0.65$): Identity-based hate speech (`identity_hate >= 0.45`), elevated severe toxicity, or strong multi-label attacks.
- **`MEDIUM`** (Score $\ge 0.40$): Standard toxicity, insult, or obscene content exceeding the threshold ($0.50$).
- **`LOW`** (Score $\le 0.25$): Benign comments with no signals passing detection thresholds.

---

## 6. Policy / Decision Engine

The Policy Engine (`app/policy/rules.py`) converts the detected labels, confidence scores, and severity level into one of five actionable moderation recommendations:

1. **`ALLOW`**: Safe comments with `LOW` severity and no policy violations.
2. **`CENSOR`**: Comments with `LOW` or `MEDIUM` severity containing matched profanities or bad words from the dictionary. Words are masked while sentence structure is preserved.
3. **`HIDE`**: Comments with `MEDIUM` severity where harm is contextual (e.g., hostile insults) without clean standalone profanity words.
4. **`FLAG`**: Comments with `HIGH` severity (e.g., identity hate, harassment) queued for human moderator inspection.
5. **`DELETE`**: Comments with `CRITICAL` severity (e.g., direct violence threats) mandating immediate removal.

---

## 7. Censor Engine

The Censor Engine (`app/services/censor.py`) performs safe text masking using a configurable dictionary (`resources/bad_words.txt`):
- **Word-Boundary Preservation**: Uses strict regex word boundaries (`\bword\b`) so benign words containing bad substrings are never corrupted (e.g., *assume*, *classic*, *butter*, *pass* remain untouched).
- **Case-Insensitive**: Matches regardless of casing while preserving punctuation and spacing.
- **Selective Activation**: Censoring is executed only when the policy recommends `CENSOR`, generating a distinct `censored_comment`.

---

## 8. REST API Endpoints

### 1. `GET /health`
Returns service operational health and Hugging Face model loading status.

### 2. `POST /predict`
Performs complete toxicity analysis without saving to the database.
```json
// POST http://localhost:8000/predict
{
  "comment": "You are a stupid idiot"
}
```
**Response:**
```json
{
  "comment": "You are a stupid idiot",
  "toxicity": {
    "toxic": 0.9521,
    "severe_toxic": 0.1240,
    "obscene": 0.0410,
    "threat": 0.0105,
    "insult": 0.9230,
    "identity_hate": 0.0210
  },
  "detected_labels": ["toxic", "insult"],
  "severity": {
    "level": "MEDIUM",
    "score": 0.92
  },
  "recommended_action": "CENSOR",
  "censored_comment": "You are a ****** *****",
  "explanation": "Moderate toxic, insult detected with actionable profanities..."
}
```

### 3. `POST /moderate`
Runs the complete moderation pipeline and persists an audit record into SQLite.

### 4. `GET /history`
Query paginated audit logs with search, severity filter, and action filter parameters (`skip`, `limit`, `severity`, `action`, `search`).

### 5. `GET /stats`
Returns aggregated analytics (total analyzed, toxic vs clean counts, action counts, label frequency distribution).

---

## 9. Installation & Running

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### Backend Setup
```bash
cd backend
python -m venv venv
# Activate venv:
# Windows: venv\Scripts\activate
# Linux/Mac: source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Backend API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend UI: [http://localhost:5173](http://localhost:5173)

### Running with Docker Compose
```bash
docker-compose up --build
```
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8000](http://localhost:8000)

---

## 10. Automated Testing

Run the comprehensive unit and integration test suite:
```bash
cd backend
pytest
```

---

## 11. Future Extensions (Roadmap)

The system architecture is intentionally decoupled so future capabilities can be plugged in seamlessly:
- **Sarcasm Detection Engine**: Intercepts comments where literal polarity masks subtle harassment.
- **Multilingual Support**: Hindi and Hinglish tokenization and classification.
- **Token-Level Toxic Span Extraction**: Transformer token classification for fine-grained contextual span masking.
