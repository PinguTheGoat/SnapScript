// Temporary testing URL (local tunnel). Replace with your production backend when ready.
const BACKEND_URL = 'https://proud-pots-refuse.loca.lt';
// const BACKEND_URL = 'https://snapscript-production-e25b.up.railway.app';

export async function checkAuthorship(code, ocrType = 'unknown') {
  try {
    const response = await fetch(`${BACKEND_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, ocr_type: ocrType }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    return {
      type: data.type ?? 'Unknown',
      confidence: data.confidence ?? 0.0,
      ocrType: data.ocr_type ?? ocrType,
    };
  } catch (error) {
    console.error('Authorship API error:', error);
    return { type: 'Unknown', confidence: 0.0, ocrType };
  }
}
