# TradePortfolio Chatbot & CSV Analytics Engine

A production-grade, natural language financial portfolio chatbot and dynamic CSV analytics platform powered by **Groq (Llama 3.3 70B)**, **FastAPI**, **SentenceTransformers**, **FAISS Vector RAG**, and a modern **React + Vite** frontend.

---

## 🌟 Key Features

- 💬 **Dynamic Natural Language to SQL**: Converts complex conversational finance queries into safe, dialect-correct SQLite queries.
- ⚡ **RAG-Enhanced SQL Generation**: Retrieves the most relevant valid SQL schema patterns using FAISS vector similarity search and SentenceTransformers (`all-MiniLM-L6-v2`).
- 🧠 **Continuous Self-Learning Vector Store**: Successfully executed user queries are dynamically indexed into the FAISS vector store to continuously improve future generation accuracy.
- 🛡️ **Multi-Tier SQL Guardrails**: Enforces read-only `SELECT` queries, protects against SQL injection, disallows destructive queries, and automatically injects query `LIMIT` clauses.
- 📁 **Dynamic Multi-CSV Ingestion & Session Isolation**: Upload custom CSV datasets (e.g. Holdings, Trades, PnL, Transactions) on the fly with per-session isolated SQLite databases.
- 💻 **Modern Glassmorphism UI**: Beautiful, responsive React interface with interactive data tables, query execution metrics, schema inspectors, raw SQL execution modals, and real-time backend health monitoring.

---

## 🏗️ Project Architecture

```
TradePortfolio_Chatbot/
├── backend/                  # FastAPI Application & AI RAG Engine
│   ├── app/
│   │   ├── api/v1/           # API endpoints (chat, datasets, health)
│   │   ├── schemas/          # Pydantic models & request schemas
│   │   ├── services/         # Core logic: RAG, DB Manager, SQL Gen & Guard
│   │   ├── utils/            # Data & SQL formatting helpers
│   │   ├── config.py         # App configuration & environment loaders
│   │   └── main.py           # FastAPI entrypoint & lifecycle handlers
│   ├── requirements.txt      # Python dependencies
│   └── run_server.py         # Backend dev runner (port 8000)
│
├── frontend/                 # React 19 + Vite Web Application
│   ├── src/
│   │   ├── api/              # Backend API client integration
│   │   ├── components/       # UI components (ChatFeed, PromptInput, TablePreviewModal, etc.)
│   │   ├── App.jsx           # Main React component
│   │   └── index.css         # Modern design system & styling
│   ├── package.json          # Frontend dependencies
│   ├── vercel.json           # Vercel SPA routing configuration
│   └── vite.config.js        # Vite dev server & proxy settings (port 5173)
│
├── data/                     # Financial datasets & SQLite storage
│   ├── holdings.csv          # Sample Portfolio Holdings dataset
│   ├── trades.csv            # Sample Trades dataset
│   └── portfolio.db          # Embedded SQLite database
│
├── .gitignore                # Git ignore configuration
└── README.md                 # Project documentation
```

---

## 🛠️ Technology Stack

| Layer | Technologies | Role |
|---|---|---|
| **Frontend** | React 19, Vite, Lucide Icons, Vanilla CSS Glassmorphism | Interactive Chat UI, Data Tables, & Dataset Manager |
| **Backend API** | FastAPI, Uvicorn, Pydantic | RESTful API, Lifecycle management & Request validation |
| **LLM Inference** | Groq API (`llama-3.3-70b-versatile`) | Fast, accurate NL-to-SQL query generation |
| **Embeddings & RAG** | SentenceTransformers (`all-MiniLM-L6-v2`), FAISS | Semantic similarity matching & Self-learning vector memory |
| **Database Engine** | SQLite, SQLAlchemy, Pandas, NumPy | Relational analytics, dynamic table creation & query execution |

---

## 🚀 Quick Start & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/Lyakhat/TradePortfolio_Chatbot.git
cd TradePortfolio_Chatbot
```

### 2. Configure Environment Variables
Create a `.env` file in the project root:
```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
EMBEDDING_MODEL_NAME=sentence-transformers/all-MiniLM-L6-v2
HOST=127.0.0.1
PORT=8000
```

### 3. Backend Setup
```bash
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate       # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Start FastAPI server
python backend/run_server.py
```
> The API will be available at **`http://127.0.0.1:8000`** with interactive Swagger documentation at **`http://127.0.0.1:8000/docs`**.

### 4. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
> The web interface will be available at **`http://localhost:5173`**.

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Service health, model status & Groq API key verification |
| `POST` | `/api/v1/chat/query` | Natural language question to SQL conversion & execution |
| `POST` | `/api/v1/chat/execute-raw-sql` | Direct, guarded execution of custom SQL queries |
| `GET` | `/api/v1/datasets/{session_id}/schema` | Retrieves table schemas, types, row counts & sample preview |
| `GET` | `/api/v1/datasets/{session_id}/samples` | Retrieves RAG seed examples and self-learned queries |
| `POST` | `/api/v1/datasets/upload` | Ingests one or more CSV files into an isolated database session |

---

## 🌐 Deployment

### Frontend (Vercel)
1. Import repository on [Vercel Dashboard](https://vercel.com/dashboard).
2. Set **Root Directory** to `frontend`.
3. Set Environment Variable `VITE_API_BASE_URL` to your backend URL.
4. Click **Deploy**.

### Backend (Render / Railway / Fly.io)
1. Create a new Web Service pointing to `backend/`.
2. Build Command: `pip install -r backend/requirements.txt`
3. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Set Environment Variable: `GROQ_API_KEY`.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).