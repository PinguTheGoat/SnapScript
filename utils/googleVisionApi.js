const GOOGLE_VISION_API_KEY = 'AIzaSyC85Hdj9AwKJZPuaPKe2t4k2DOnnQ4pq4k';
const GOOGLE_VISION_URL = 'https://vision.googleapis.com/v1/images:annotate';

export async function extractTextFromImage(base64Image, apiKey = GOOGLE_VISION_API_KEY) {
  if (!base64Image) {
    return { text: '', confidence: 0, words: [] };
  }

  const response = await fetch(`${GOOGLE_VISION_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          image: { content: base64Image },
          features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Google Vision request failed with status ${response.status}`);
  }

  const data = await response.json();
  const annotation = data?.responses?.[0]?.fullTextAnnotation || {};
  const words = collectWords(annotation);
  const confidence = calculateAverageConfidence(words, annotation);

  return {
    text: String(annotation.text || '').trim(),
    confidence,
    words,
  };
}

function collectWords(annotation) {
  const words = [];
  const pages = annotation?.pages || [];

  pages.forEach((page) => {
    (page.blocks || []).forEach((block) => {
      (block.paragraphs || []).forEach((paragraph) => {
        (paragraph.words || []).forEach((word) => {
          words.push({
            text: collectWordText(word),
            confidence: typeof word.confidence === 'number' ? word.confidence : null,
          });
        });
      });
    });
  });

  return words;
}

function collectWordText(word) {
  return (word?.symbols || []).map((symbol) => symbol?.text || '').join('');
}

function calculateAverageConfidence(words, annotation) {
  const confidenceValues = words.map((word) => word.confidence).filter((value) => typeof value === 'number');

  if (confidenceValues.length) {
    const total = confidenceValues.reduce((sum, value) => sum + value, 0);
    return total / confidenceValues.length;
  }

  const pageConfidence = annotation?.pages?.map((page) => page?.confidence).filter((value) => typeof value === 'number') || [];

  if (pageConfidence.length) {
    const total = pageConfidence.reduce((sum, value) => sum + value, 0);
    return total / pageConfidence.length;
  }

  return 0.5;
}

export { GOOGLE_VISION_API_KEY };