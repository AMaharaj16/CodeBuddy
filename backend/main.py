from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware


# Backend with FastAPI instance
app = FastAPI()

# CORS middleware allows Reacts to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Requests only allowed from React Server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CodeRequest(BaseModel):
    code: str

# Runs when React calls POST /analyze
@app.post("/analyze")
async def analyze_code(request: CodeRequest):
    code = request.code
    # TODO: Add code execution and complexity analysis here
    return