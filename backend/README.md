# SnapScript FastAPI Backend

## 1. Train your model (Google Colab)
- Open notebooks/02_train_codebert.ipynb in Colab
- Set runtime to T4 GPU (free)
- Run all cells — takes about 45 minutes
- Download models/codebert_finetuned/ from Google Drive to your PC
- Place it at backend/models/codebert_finetuned/

## 2. Test locally
```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# Visit http://localhost:8000/health to verify
```

## 3. Test from your Android phone (ngrok)
```bash
ngrok http 8000
# Copy https://xxx.ngrok.io into utils/authorshipApi.js BACKEND_URL
# Run npx expo start -> test full scan flow on phone
```

## 4. Deploy to Railway.app (free, permanent)
```bash
# Push backend/ folder to a GitHub repo (include models/ folder)
# railway.app -> New Project -> Deploy from GitHub -> select repo
# Wait about 5 minutes for build
# Copy your permanent URL from Railway dashboard
# Replace YOUR_RAILWAY_URL in utils/authorshipApi.js
# Rebuild APK: eas build -p android --profile preview
```

## API
- `GET /health` returns the service status and confirms the model directory is available.
- `POST /predict` accepts `{ "code": "..." }` and returns `{ "type": "Human-Written" | "AI-Generated" | "Unknown", "confidence": 0.0-1.0 }`.
