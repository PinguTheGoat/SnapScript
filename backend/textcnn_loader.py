from pathlib import Path
import logging

import torch

logger = logging.getLogger(__name__)

CHECKPOINT_PATH = Path(__file__).resolve().parent / "models" / "textcnn_weights.pt"


class TextCNN(torch.nn.Module):
    def __init__(self, vocab_size: int, embed_dim: int = 128, num_filters: int = 100):
        super().__init__()
        self.embedding = torch.nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.convs = torch.nn.ModuleList([
            torch.nn.Conv1d(embed_dim, num_filters, k) for k in (3, 4, 5)
        ])
        self.dropout = torch.nn.Dropout(0.5)
        self.fc = torch.nn.Linear(num_filters * 3, 1)
        self.sigmoid = torch.nn.Sigmoid()

    def forward(self, input_ids: torch.Tensor) -> torch.Tensor:
        embedded = self.embedding(input_ids).transpose(1, 2)
        features = [torch.relu(conv(embedded)) for conv in self.convs]
        pooled = [torch.max(f, dim=2).values for f in features]
        concatenated = torch.cat(pooled, dim=1)
        logits = self.fc(self.dropout(concatenated)).squeeze(1)
        return self.sigmoid(logits)


TEXTCNN_AVAILABLE = False
TEXTCNN_MODEL = None
TEXTCNN_VOCAB = None
TEXTCNN_DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

if CHECKPOINT_PATH.exists():
    try:
        checkpoint = torch.load(CHECKPOINT_PATH, map_location=TEXTCNN_DEVICE)
        vocab = checkpoint.get('vocab') or checkpoint.get('vocabulary')
        if vocab is None:
            raise KeyError('vocab not found in checkpoint')
        model = TextCNN(len(vocab))
        model.load_state_dict(checkpoint['state_dict'])
        model.to(TEXTCNN_DEVICE)
        model.eval()
        TEXTCNN_AVAILABLE = True
        TEXTCNN_MODEL = model
        TEXTCNN_VOCAB = vocab
        logger.info('Loaded TextCNN checkpoint from %s', CHECKPOINT_PATH)
    except Exception:
        logger.exception('Failed to load TextCNN checkpoint from %s', CHECKPOINT_PATH)
else:
    logger.info('TextCNN checkpoint not found at %s; TextCNN route will be unavailable', CHECKPOINT_PATH)
