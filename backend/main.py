import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from predictor import predict
from schemas import PredictRequest, PredictResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SnapScript API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "model": "codebert-finetuned", "supports": ["handwritten", "printed"]}


@app.post("/predict", response_model=PredictResponse)
async def predict_route(req: PredictRequest):
    if not req.code.strip():
        raise HTTPException(status_code=422, detail="Code cannot be empty")

    logger.info("Predicting - ocr_type: %s, length: %s", req.ocr_type, len(req.code))
    result = predict(req.code, req.ocr_type)
    logger.info("Result: %s", result)
    return result
