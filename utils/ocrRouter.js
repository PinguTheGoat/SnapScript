import TextRecognition from '@react-native-ml-kit/text-recognition';

import { preprocessImage } from './imagePreprocessor';
import { extractTextFromImage } from './googleVisionApi';

const HANDWRITING_CONFIDENCE_THRESHOLD = 0.85;

export async function detectImageType(imageInput, googleVisionApiKey) {
  const processedImage = await ensureProcessedImage(imageInput);
  const visionResult = await extractTextFromImage(processedImage.base64 || '', googleVisionApiKey);
  const type = visionResult.confidence < HANDWRITING_CONFIDENCE_THRESHOLD ? 'handwritten' : 'printed';

  return {
    type,
    confidence: visionResult.confidence,
    text: visionResult.text,
    words: visionResult.words,
  };
}

export async function extractText(imageInput, googleVisionApiKey, mode = 'auto') {
  const processedImage = await ensureProcessedImage(imageInput);
  const normalizedMode = normalizeMode(mode);

  try {
    if (normalizedMode === 'handwritten') {
      const visionResult = await extractTextFromImage(processedImage.base64 || '', googleVisionApiKey);
      return {
        text: visionResult.text,
        type: 'handwritten',
        confidence: visionResult.confidence,
      };
    }

    if (normalizedMode === 'printed') {
      const recognition = await TextRecognition.recognize(processedImage.uri);
      return {
        text: String(recognition?.text || '').trim(),
        type: 'printed',
        confidence: 0.95,
      };
    }

    const imageType = await detectImageType(processedImage, googleVisionApiKey);

    if (imageType.type === 'handwritten') {
      return {
        text: imageType.text,
        type: 'handwritten',
        confidence: imageType.confidence,
      };
    }

    const recognition = await TextRecognition.recognize(processedImage.uri);
    return {
      text: String(recognition?.text || '').trim(),
      type: 'printed',
      confidence: imageType.confidence,
    };
  } catch (error) {
    const recognition = await TextRecognition.recognize(processedImage.uri).catch(() => ({ text: '' }));
    return {
      text: String(recognition?.text || '').trim(),
      type: normalizedMode === 'handwritten' ? 'handwritten' : 'printed',
      confidence: 0.5,
    };
  }
}

async function ensureProcessedImage(imageInput) {
  if (typeof imageInput === 'string') {
    return preprocessImage(imageInput);
  }

  if (imageInput?.uri && imageInput?.base64) {
    return imageInput;
  }

  if (imageInput?.uri) {
    return preprocessImage(imageInput.uri);
  }

  throw new Error('Invalid image input for OCR router');
}

function normalizeMode(mode) {
  const normalized = String(mode || 'auto').toLowerCase();

  if (normalized === 'handwritten' || normalized === 'printed') {
    return normalized;
  }

  return 'auto';
}