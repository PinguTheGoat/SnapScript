# SnapScript

Android-only Expo app for scanning code images, recognizing text on-device, checking syntax with Piston, and displaying authorship predictions.

## Install

```bash
npm install -g expo-cli eas-cli
npm install
```

## Run

```bash
npx expo start
```

Use `npx expo start --android` if you want to jump straight to the Android target.

## Build APK

```bash
eas login
eas build -p android --profile preview
```

Download the `.apk` from your Expo dashboard and install it on Android with Settings > Install Unknown Apps enabled for your browser or file manager.

## Authorship backend

Set `EXPO_PUBLIC_RAILWAY_URL` to the base URL of your deployed FastAPI service. SnapScript will call `POST /predict` on that server when it is available and fall back to a local heuristic when it is not.

## Notes

- OCR runs locally with `@react-native-ml-kit/text-recognition`.
- Language detection is automatic and only supports Python, C, and C++.
- Syntax diagnostics use the free Piston API.
- Scan history and preferences are stored locally with AsyncStorage.

# Docker

To run the backend in a container (recommended for local ML testing and parity with Railway):

1. Build the image from the repo root:

```bash
docker build -t snapscript-backend ./backend
```

2. Run with Docker:

```bash
docker run --rm -p 8000:8000 -e ALLOW_HF_FALLBACK=1 snapscript-backend
```

Or use docker-compose:

```bash
docker-compose up --build
```

Notes:
- The Dockerfile installs a CPU build of PyTorch from the official PyTorch index. If you need GPU support, adjust the Dockerfile accordingly.
- The `backend/models/` folder is ignored by `.dockerignore`. For real inference with your fine-tuned CodeBERT model, copy `backend/models/codebert_finetuned/` into the image build context or mount it as a volume when running.

