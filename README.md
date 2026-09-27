# TradePortfolio Chatbot & Financial Analytics Platform

A natural language financial analytics and portfolio querying platform powered by Groq (Llama 3.3 70B), FastAPI, SentenceTransformers, FAISS Vector RAG, and a React + Vite frontend.

---

## Overview

TradePortfolio Chatbot translates conversational financial questions into dialect-correct SQLite queries over portfolio holdings and trades datasets. It utilizes Retrieval-Augmented Generation (RAG) to find relevant SQL examples and dynamically indexes successfully executed queries to improve future accuracy.

---

## Key Features

- Natural Language to SQL: Converts natural language portfolio queries into executable SQL.
- RAG-Enhanced Generation: Retrieves the most relevant valid query patterns using FAISS and SentenceTransformers (all-MiniLM-L6-v2).
- Continuous Self-Learning: Successfully executed queries are dynamically indexed into the vector store.
- SQL Guardrails: Enforces read-only SELECT statements, prevents SQL injection, and automatically applies query limit constraints.
- Built-In Rate Limiting: In-memory sliding-window rate limiter per client IP to safeguard LLM tokens and API resources from abuse.
- Pre-loaded Datasets: Pre-configured with Portfolio Holdings and Historical Trades in an embedded SQLite database.
- Modern Web Interface: React interface with schema explorer, query knowledge bank, interactive data tables, and custom SQL workbench.

---

## Project Structure

```
TradePortfolio_Chatbot/
├── backend/                  # FastAPI Application & AI Engine
│   ├── app/
│   │   ├── api/v1/           # API endpoints (chat, datasets, health)
│   │   ├── middleware/       # Rate limiting and security middleware
│   │   ├── schemas/          # Pydantic request and response schemas
│   │   ├── services/         # RAG, Database Manager, SQL Generator, SQL Guard
│   │   ├── utils/            # Data formatting helpers
│   │   ├── config.py         # Application settings
│   │   └── main.py           # FastAPI entrypoint
│   ├── data/                 # Financial datasets & SQLite storage
│   │   ├── holdings.csv      # Portfolio Holdings dataset
│   │   └── trades.csv        # Historical Trades dataset
│   ├── .env.example          # Environment variable template
│   ├── requirements.txt      # Python dependencies
│   └── run_server.py         # Backend development runner (port 8000)
│
├── frontend/                 # React 19 + Vite Application
│   ├── src/
│   │   ├── api/              # Backend API client
│   │   ├── components/       # UI components (ChatFeed, Sidebar, Header, Modals)
│   │   ├── App.jsx           # Main React component
│   │   └── index.css         # Styling and design system
│   ├── package.json          # Frontend dependencies
│   ├── vercel.json           # Vercel SPA routing configuration
│   └── vite.config.js        # Vite dev server configuration (port 5173)
│
├── .gitignore                # Git ignore rules (node_modules, .env, *.db)
└── README.md                 # Project documentation
```

---

## Technology Stack

- Frontend: React 19, Vite, Lucide Icons, Vanilla CSS
- Backend API: FastAPI, Uvicorn, Pydantic, Starlette
- LLM Provider: Groq API (llama-3.3-70b-versatile)
- Embeddings & Vector Search: SentenceTransformers (all-MiniLM-L6-v2), FAISS
- Database: SQLite, SQLAlchemy, Pandas, NumPy

---

## Installation and Setup

### Prerequisites

- Python 3.10+
- Node.js 18+ and npm
- Groq API Key

### 1. Clone the Repository

```bash
git clone https://github.com/Lyakhat/TradePortfolio_Chatbot.git
cd TradePortfolio_Chatbot
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
EMBEDDING_MODEL_NAME=sentence-transformers/all-MiniLM-L6-v2
HOST=127.0.0.1
PORT=8000
RATE_LIMIT_PER_MINUTE=30
```

A template is also available at `backend/.env.example`.

### 3. Backend Setup

```bash
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate       # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Start backend server
python backend/run_server.py
```

The API will run at `http://127.0.0.1:8000` with Swagger UI at `http://127.0.0.1:8000/docs`.

### 4. Frontend Setup

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

The web application will be accessible at `http://localhost:5173`.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/health` | Health status and model initialization check |
| POST | `/api/v1/chat/query` | Natural language to SQL query conversion and execution |
| POST | `/api/v1/chat/execute-raw-sql` | Guarded execution of direct SQL queries |
| GET | `/api/v1/datasets/{session_id}/schema` | Retrieves table schemas, types, counts, and sample records |
| GET | `/api/v1/datasets/{session_id}/samples` | Retrieves RAG query bank examples |

---

## Deployment

### Frontend (Vercel)

1. Import the repository in the Vercel Dashboard.
2. Set Root Directory to `frontend`.
3. Under Environment Variables, add `VITE_API_BASE_URL` with your deployed backend URL.
4. Deploy.

### Backend (Render / Railway / Fly.io)

1. Create a new Web Service pointing to `backend/`.
2. Build Command: `pip install -r backend/requirements.txt`
3. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Set Environment Variable: `GROQ_API_KEY`.

---

## Security

- No sensitive credentials or `.env` files are tracked in version control.
- In-memory rate limiting restricts abusive client requests.
- SQL guardrails restrict destructive SQL statements (`DROP`, `DELETE`, `UPDATE`, `INSERT`, `ALTER`, `TRUNCATE`).

---

## License

This project is licensed under the MIT License.