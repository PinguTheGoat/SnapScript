from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SnapScript Dev API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "model": "dev-mock"}


def simple_predict(code: str):
    # Lightweight heuristic used only for local dev tests
    if not code.strip():
        return {"type": "Unknown", "confidence": 0.0}
    human_signals = ['def ', 'class ', '#include', 'printf(', 'cout<<']
    score = 0.5
    for s in human_signals:
        if s in code:
            score += 0.1
    return {"type": "Human-Written" if score >= 0.5 else "AI-Generated", "confidence": round(min(1.0, score), 2)}


@app.post("/predict")
async def predict_route(payload: dict):
    code = payload.get('code', '')
    if not isinstance(code, str) or not code.strip():
        raise HTTPException(status_code=422, detail='Code cannot be empty')
    result = simple_predict(code)
    logger.info('Dev predict -> %s', result)
    return result
