/**
 * Heurísticas para comprobantes de transferencia en español (p. ej. Banco Pichincha).
 * Sin dependencias externas; testeable de forma aislada.
 */

const MONTHS_ES = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
};

export function stripDiacritics(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}

function normalizeMoneyToken(s) {
  const raw = String(s).trim();
  if (!raw) return NaN;
  const lastComma = raw.lastIndexOf(',');
  const lastDot = raw.lastIndexOf('.');
  let n;
  if (lastComma > lastDot && /,\d{1,2}$/.test(raw)) {
    n = parseFloat(raw.replace(/\./g, '').replace(',', '.'));
  } else if (lastDot > lastComma && /\.\d{1,2}$/.test(raw)) {
    n = parseFloat(raw.replace(/,/g, ''));
  } else if (!raw.includes(',') && !raw.includes('.')) {
    n = parseFloat(raw);
  } else {
    n = parseFloat(raw.replace(/,/g, '.'));
  }
  return n;
}

/**
 * @param {string} text
 * @returns {number|null}
 */
export function parseAmount(text) {
  if (!text) return null;
  const candidates = [];
  const re = /\$\s*([\d]{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|[\d]+[.,]\d{1,2}|[\d]+)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const n = normalizeMoneyToken(m[1]);
    if (!Number.isNaN(n) && n > 0 && n < 1e9) candidates.push(n);
  }
  if (!candidates.length) return null;
  return Math.max(...candidates);
}

/**
 * @param {string} text
 * @returns {string|null} YYYY-MM-DD
 */
export function parseSpanishDate(text) {
  if (!text) return null;
  const t = text.replace(/\s+/g, ' ');

  const reLong = /(\d{1,2})\s+de\s+([a-záéíóúñ]+)\s+de\s+(\d{4})/i;
  let m = t.match(reLong);
  if (m) {
    const day = parseInt(m[1], 10);
    const monName = stripDiacritics(m[2]);
    const year = parseInt(m[3], 10);
    const month = MONTHS_ES[monName];
    if (month && day >= 1 && day <= 31 && year >= 2000 && year <= 2100) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  const reNum = /(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})/;
  m = t.match(reNum);
  if (m) {
    const a = parseInt(m[1], 10);
    const b = parseInt(m[2], 10);
    const y = parseInt(m[3], 10);
    let day;
    let month;
    if (a > 12) {
      day = b;
      month = a;
    } else {
      day = a;
      month = b;
    }
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  return null;
}

/**
 * @param {string} text
 * @returns {string|null}
 */
export function parseComprobante(text) {
  if (!text) return null;
  const re = /(?:comprobante|voucher|n[º°]?\s*de\s*comprobante)\s*[:\s]?\s*(\d{6,12})/i;
  const m = text.match(re);
  return m ? m[1] : null;
}

/**
 * Intenta aislar el nombre del beneficiario (líneas tipo "A Nombre" en apps bancarias).
 * @param {string} text
 * @returns {string}
 */
export function extractBeneficiarySnippet(text) {
  if (!text) return '';
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^a\s+[a-záéíóúñ]/i.test(line) && line.length > 3 && line.length < 120) {
      return line.replace(/^a\s+/i, '').trim();
    }
  }
  const reDe = /\bde\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){2,5})/;
  const m = text.match(reDe);
  if (m) return m[1].trim();
  return '';
}

const STOP = new Set(['de', 'del', 'la', 'los', 'las', 'y', 'da', 'do', 'san', 'santa']);

function nameTokens(name) {
  return stripDiacritics(name)
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP.has(w));
}

/**
 * @param {Array<{id:number|string,name:string}>} students
 * @param {string} fullText
 * @returns {{ studentId: number|string|null, ambiguous: boolean, score: number, candidates: Array }}
 */
export function matchStudent(students, fullText) {
  const text = stripDiacritics(fullText);
  if (!students?.length || !text) {
    return { studentId: null, ambiguous: false, score: 0, candidates: [] };
  }

  const scored = students.map((s) => {
    const tokens = nameTokens(s.name);
    if (!tokens.length) return { student: s, score: 0 };
    const hits = tokens.filter((tok) => text.includes(tok)).length;
    const ratio = hits / tokens.length;
    const joined = stripDiacritics(s.name.replace(/\s+/g, ' '));
    const substr = joined.length >= 8 && text.includes(joined);
    let score = ratio;
    if (substr) score = Math.max(score, 0.95);
    return { student: s, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  const second = scored[1];

  if (!best || best.score < 0.51) {
    return { studentId: null, ambiguous: false, score: best?.score || 0, candidates: scored.slice(0, 3) };
  }

  const ambiguous = second && second.score >= best.score - 0.05 && best.score < 0.9;
  if (ambiguous) {
    return {
      studentId: null,
      ambiguous: true,
      score: best.score,
      candidates: scored.slice(0, 5).filter((x) => x.score >= best.score - 0.1),
    };
  }

  return {
    studentId: best.student.id,
    ambiguous: false,
    score: best.score,
    candidates: [best],
  };
}

/**
 * @param {string} rawText
 * @returns {{ amount: number|null, dateStr: string|null, comprobante: string|null, beneficiarySnippet: string }}
 */
export function parseReceiptFields(rawText) {
  const normalized = rawText || '';
  return {
    amount: parseAmount(normalized),
    dateStr: parseSpanishDate(normalized),
    comprobante: parseComprobante(normalized),
    beneficiarySnippet: extractBeneficiarySnippet(normalized),
  };
}
