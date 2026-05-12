import { parseReceiptFields } from './paymentReceiptParse';

/**
 * OCR en el navegador (Tesseract.js). Carga el worker solo al llamar esta función.
 *
 * @param {string} imageDataUrl - data URL (JPEG/PNG) del comprobante
 * @returns {Promise<{ rawText: string, amount: number|null, dateStr: string|null, comprobante: string|null, beneficiarySnippet: string }>}
 */
export async function runReceiptOcr(imageDataUrl) {
  if (!imageDataUrl || typeof imageDataUrl !== 'string') {
    return { rawText: '', amount: null, dateStr: null, comprobante: null, beneficiarySnippet: '' };
  }

  const { createWorker } = await import('tesseract.js');

  const worker = await createWorker('spa', 1, {
    logger: () => {},
  });

  try {
    const {
      data: { text },
    } = await worker.recognize(imageDataUrl);
    const rawText = text || '';
    const parsed = parseReceiptFields(rawText);
    return {
      rawText,
      ...parsed,
    };
  } finally {
    await worker.terminate();
  }
}
