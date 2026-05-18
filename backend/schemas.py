from typing import Optional

from pydantic import BaseModel


class PredictRequest(BaseModel):
    code: str
    ocr_type: Optional[str] = "unknown"


class PredictResponse(BaseModel):
    type: str
    confidence: float
    ocr_type: str
