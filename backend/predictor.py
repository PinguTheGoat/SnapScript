import logging
import re

import torch

from model_loader import DEVICE, MODEL, TOKENIZER

logger = logging.getLogger(__name__)

WHITESPACE_RE = re.compile(r"\s+")
NON_ASCII_RE = re.compile(r"[^\x00-\x7F]+")


def predict(code: str, ocr_type: str = "unknown") -> dict:
    try:
        cleaned_code = clean_code(code)
        inputs = TOKENIZER(
            cleaned_code,
            max_length=512,
            truncation=True,
            padding=True,
            return_tensors="pt",
        )
        inputs = {key: value.to(DEVICE) for key, value in inputs.items()}

        with torch.no_grad():
            outputs = MODEL(**inputs)
            probabilities = torch.softmax(outputs.logits, dim=-1)[0]
            predicted_class = int(torch.argmax(probabilities).item())
            confidence = round(float(probabilities[predicted_class].item()), 2)
            predicted_type = "Human-Written" if predicted_class == 0 else "AI-Generated"

        logger.info(
            "Prediction completed | length=%s | ocr_type=%s | class=%s | confidence=%.2f",
            len(cleaned_code),
            ocr_type,
            predicted_type,
            confidence,
        )

        return {
            "type": predicted_type,
            "confidence": confidence,
            "ocr_type": ocr_type,
        }
    except Exception:
        logger.exception("Prediction failed")
        return {"type": "Unknown", "confidence": 0.0, "ocr_type": ocr_type}


def clean_code(code: str) -> str:
    source = str(code or "").strip()
    source = source.replace("\r\n", "\n").replace("\r", "\n")
    source = NON_ASCII_RE.sub("", source)
    source = WHITESPACE_RE.sub(" ", source)
    return source.strip()
