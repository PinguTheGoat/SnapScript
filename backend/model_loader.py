from pathlib import Path

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

BACKEND_DIR = Path(__file__).resolve().parent
MODEL_DIR = BACKEND_DIR / "models" / "codebert_finetuned"
FALLBACK_MODEL_DIR = BACKEND_DIR.parent / "codebert_finetuned"
DEVICE = torch.device("cpu")

if not MODEL_DIR.exists() and not FALLBACK_MODEL_DIR.exists():
    raise FileNotFoundError(
        f"Missing model folder: {MODEL_DIR}. Place the fine-tuned CodeBERT model in backend/models/codebert_finetuned/ or codebert_finetuned/ before starting the app."
    )

ACTIVE_MODEL_DIR = MODEL_DIR if MODEL_DIR.exists() else FALLBACK_MODEL_DIR

TOKENIZER = AutoTokenizer.from_pretrained(str(ACTIVE_MODEL_DIR), local_files_only=True)
MODEL = AutoModelForSequenceClassification.from_pretrained(
    str(ACTIVE_MODEL_DIR),
    local_files_only=True,
)
MODEL.to(DEVICE)
MODEL.eval()
