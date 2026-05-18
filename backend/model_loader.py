from pathlib import Path

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

MODEL_DIR = Path(__file__).resolve().parent / "models" / "codebert_finetuned"
DEVICE = torch.device("cpu")

if not MODEL_DIR.exists():
    raise FileNotFoundError(
        f"Missing model folder: {MODEL_DIR}. Place the fine-tuned CodeBERT model in backend/models/codebert_finetuned/ before starting the app."
    )

TOKENIZER = AutoTokenizer.from_pretrained(str(MODEL_DIR), local_files_only=True)
MODEL = AutoModelForSequenceClassification.from_pretrained(
    str(MODEL_DIR),
    local_files_only=True,
    map_location="cpu",
)
MODEL.to(DEVICE)
MODEL.eval()
