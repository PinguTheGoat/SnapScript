import { preprocessImage } from './imagePreprocessor';
import { extractTextFromImage } from './googleVisionApi';

let TextRecognition;
try {
  // Lazy-load native module; may be unavailable in Expo Go
  // eslint-disable-next-line global-require
  TextRecognition = require('@react-native-ml-kit/text-recognition').default;
} catch (e) {
  TextRecognition = null;
}

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
      if (TextRecognition && TextRecognition.recognize) {
        try {
          const recognition = await TextRecognition.recognize(processedImage.uri);
          return {
            text: String(recognition?.text || '').trim(),
            type: 'printed',
            confidence: 0.95,
          };
        } catch (err) {
          // Fall through to cloud fallback
        }
      }

      // fallback to cloud OCR when native module unavailable or fails
      const visionResult = await extractTextFromImage(processedImage.base64 || '', googleVisionApiKey);
      return {
        text: visionResult.text,
        type: 'printed',
        confidence: visionResult.confidence,
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

    if (TextRecognition && TextRecognition.recognize) {
      try {
        const recognition = await TextRecognition.recognize(processedImage.uri);
        return {
          text: String(recognition?.text || '').trim(),
          type: 'printed',
          confidence: imageType.confidence,
        };
      } catch (err) {
        // fall back to cloud OCR below
      }
    }

    const fallbackVision = await extractTextFromImage(processedImage.base64 || '', googleVisionApiKey);
    return {
      text: fallbackVision.text,
      type: 'printed',
      confidence: fallbackVision.confidence,
    };
  } catch (error) {
    // If anything goes wrong, try cloud OCR as a safe fallback
    const visionResult = await extractTextFromImage(processedImage.base64 || '', googleVisionApiKey).catch(() => ({ text: '', confidence: 0 }));
    return {
      text: visionResult.text || '',
      type: normalizedMode === 'handwritten' ? 'handwritten' : 'printed',
      confidence: visionResult.confidence || 0.0,
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