const BACKEND_URL = 'https://railway.com/project/baf9ee19-c129-4a8f-9458-2beedf4529a7?environmentId=0f96b3a0-b07a-4760-ac16-c9696e0b1a8a';

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
