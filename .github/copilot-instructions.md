# StudyLM - AI Research Notebook

StudyLM is a NotebookLM-style RAG (Retrieval-Augmented Generation) application that allows users to upload PDFs, organize sources into notebooks, ask questions with citations, add guiding facts, and generate study aids. The application consists of a FastAPI backend with React frontend.

**Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Working Effectively

### Bootstrap and Setup Commands
Execute these commands in order to set up the development environment:

```bash
# Navigate to the main application directory
cd ai-notebook-backend

# Create Python virtual environment (.venv is gitignored)
python3 -m venv .venv
source .venv/bin/activate

# Upgrade pip and install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

**CRITICAL TIMING NOTE**: Python dependency installation takes approximately **80 seconds**. NEVER CANCEL this process. Set timeout to **180+ seconds**.

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend-react

# Install Node.js dependencies (requires Node.js 18+)
npm ci || npm install

# Build the frontend for production
npm run build
```

**TIMING**: Frontend dependency installation takes **20 seconds**. Frontend build takes **3 seconds**. NEVER CANCEL these processes. Set timeouts to **60+ seconds** for install and **30+ seconds** for build.

### Environment Configuration
Create a `.env` file in the `ai-notebook-backend/` directory:

```env
OPENAI_API_KEY=your_openai_api_key_here
ENABLE_API_DOCS=1
```

**CRITICAL**: The application REQUIRES a valid OpenAI API key to function. Without it, PDF processing and question answering will fail.

### Development Servers

**Backend Development:**
```bash
cd ai-notebook-backend
source .venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend Development:**
```bash
cd frontend-react
npm run dev
```
- Frontend dev server starts on http://localhost:5173
- Backend API available at http://127.0.0.1:8000
- API documentation at http://127.0.0.1:8000/docs

**Production Mode:**
```bash
# Build frontend first
cd frontend-react && npm run build

# Start backend (serves built frontend at /app)
cd .. && source .venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
```
- Application available at http://127.0.0.1:8000/ (redirects to /app)

## Docker Operations

**CRITICAL WARNING**: Docker builds may fail in sandboxed environments due to SSL certificate verification issues with PyPI. Use virtual environment setup instead when possible.

```bash
# Single container build (backend + frontend)
docker build -t studylm .

# Multi-service deployment
docker-compose up --build
```

**NEVER CANCEL**: Docker builds can take **15+ minutes** due to compilation of scientific Python packages (PyMuPDF, FAISS). Set timeout to **30+ minutes**.

## Critical Network Requirements

The application has several network dependencies that may fail in restricted environments:

1. **tiktoken**: Downloads tokenizer files from OpenAI on first import
2. **OpenAI API**: Requires internet access for embeddings and chat completion
3. **PyPI**: Required for pip installations
4. **NPM registry**: Required for Node.js packages

**If you encounter network errors**: Document them clearly in your changes and note that functionality requiring external services will be limited.

## Validation Scenarios

**MANDATORY**: After making any changes, validate the application using these complete user scenarios:

### Basic Functionality Test
```bash
# 1. Start the application
cd ai-notebook-backend && source .venv/bin/activate
uvicorn main:app --reload &

# 2. Test health endpoint
curl http://127.0.0.1:8000/health

# 3. Verify API documentation loads
curl http://127.0.0.1:8000/docs
```

### Full User Workflow (requires valid OpenAI API key)
1. **Upload PDF**: Use the /upload endpoint to upload a PDF document
2. **Check Status**: Monitor processing with /status/{file_id} 
3. **Ask Questions**: Use /ask endpoint to query the document
4. **Create Notebook**: Use /notebooks endpoints to organize sources
5. **Generate Study Materials**: Test /notebooks/{id}/summarize and /notebooks/{id}/flashcards

### Frontend Integration Test
1. **Load React App**: Navigate to http://localhost:5173 (dev) or http://127.0.0.1:8000/app (production)
2. **Upload Workflow**: Test file upload through the UI
3. **Chat Interface**: Verify question-answer functionality
4. **Notebook Management**: Test creating and managing notebooks

**CRITICAL**: Do not consider changes complete without running through at least one complete user scenario and verifying the UI loads correctly.

## Common Commands Reference

### Development
```bash
# Backend with auto-reload
cd ai-notebook-backend && source .venv/bin/activate && uvicorn main:app --reload

# Frontend with hot reload
cd frontend-react && npm run dev

# Frontend production build
cd frontend-react && npm run build
```

### Testing and Validation
```bash
# Smoke test (PowerShell script for testing core endpoints)
powershell ./smoke.ps1 -BaseUrl http://127.0.0.1:8000

# Health check
curl http://127.0.0.1:8000/health

# API documentation
open http://127.0.0.1:8000/docs
```

## Project Structure Reference

```
ai-notebook-backend/
├── main.py              # FastAPI application entry point
├── requirements.txt     # Python dependencies
├── .env                 # Environment variables (create this)
├── app/                 # Backend modules
│   ├── config.py        # Application configuration
│   ├── db.py           # Database operations
│   ├── embeddings.py   # OpenAI embeddings
│   ├── pdf_parser.py   # PDF text extraction
│   └── vector_store.py # FAISS vector operations
├── frontend-react/      # React frontend
│   ├── package.json     # Node.js dependencies
│   ├── src/            # React source code
│   └── dist/           # Built frontend (gitignored)
├── streamlit_app/      # Alternative Streamlit UI
├── uploads/            # PDF storage (gitignored)
└── vector_store/       # FAISS indices (gitignored)
```

## Troubleshooting Common Issues

**Import errors with tiktoken**: Network restrictions prevent downloading tokenizer files. This is expected in sandboxed environments.

**OpenAI API errors**: Verify OPENAI_API_KEY is set correctly in .env file and has sufficient credits.

**Frontend build issues**: Ensure Node.js 18+ is installed. The build warnings about "use client" directives are normal and can be ignored.

**Docker SSL errors**: Use virtual environment setup instead in restricted network environments.

**Port conflicts**: Backend defaults to port 8000, frontend dev server to 5173. Change ports if needed.

## File Locations

**Configuration**: `ai-notebook-backend/.env`
**Python deps**: `ai-notebook-backend/requirements.txt`
**Frontend deps**: `ai-notebook-backend/frontend-react/package.json`
**Main backend**: `ai-notebook-backend/main.py`
**Frontend entry**: `ai-notebook-backend/frontend-react/src/main.jsx`

## Important Notes

- **Python 3.11+** required for backend
- **Node.js 18+** required for frontend  
- **OpenAI API key** required for core functionality
- **Virtual environment** (.venv) is gitignored and must be created locally
- **Built frontend** (dist/) is gitignored and must be built locally
- **Upload storage** (uploads/, vector_store/) is gitignored
- **No test infrastructure** currently exists - validate manually through UI/API
- **No CI/CD workflows** currently exist
- **No linting configuration** found - follow existing code style

**Final Note**: Always test your changes through the complete user workflow before considering them complete. This application's core value is in the end-to-end RAG functionality, not just individual API endpoints.