/** Convierte 16 bytes a UUID estándar (misma forma que el backend con uuid/stringify). */
function bytesJsonToUuid(bufObj) {
  if (!bufObj || bufObj.type !== 'Buffer' || !Array.isArray(bufObj.data)) return null;
  const arr = bufObj.data;
  if (arr.length !== 16) return null;
  const h = arr.map((x) => Number(x).toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

/** Normaliza id de estudiante para coincidir con API de asignaciones (string estable). */
export function normStudentId(v) {
  if (v == null || v === '') return '';
  if (typeof v === 'object' && v !== null && v.type === 'Buffer' && Array.isArray(v.data)) {
    const u = bytesJsonToUuid(v);
    if (u) return u;
  }
  return String(v);
}

/**
 * Agrega gasto compartido por estudiante y categoría (usa category_id si viene en raw).
 * @returns {Map<string, Map<number, { categoryName: string, spent: number, budget: number }>>}
 */
export function aggregateStudentCategories(rawData) {
  const byStudent = new Map();

  (rawData || []).forEach((entry) => {
    const sid = normStudentId(entry.studentID);
    const catName = entry.category || 'Sin categoría';
    const catId = entry.category_id != null ? Number(entry.category_id) : null;
    const amount = parseFloat(entry.shared_amount) || 0;
    const budget = parseFloat(entry.category_base_amount ?? entry.base_amount) || 0;
    if (catId == null || Number.isNaN(catId)) return;

    if (!byStudent.has(sid)) byStudent.set(sid, new Map());
    const catMap = byStudent.get(sid);
    if (!catMap.has(catId)) {
      catMap.set(catId, { categoryName: catName, spent: 0, budget: budget });
    }
    const cell = catMap.get(catId);
    cell.spent += amount;
    if (budget > 0 && cell.budget === 0) cell.budget = budget;
  });

  return byStudent;
}

export function buildAllocationSums(allocations) {
  const out = new Map();
  const inn = new Map();
  (allocations || []).forEach((a) => {
    const sk = normStudentId(a.student_id);
    const fk = `${sk}::${Number(a.from_category_id)}`;
    const tk = `${sk}::${Number(a.to_category_id)}`;
    out.set(fk, (out.get(fk) || 0) + Number(a.amount));
    inn.set(tk, (inn.get(tk) || 0) + Number(a.amount));
  });
  return { out, inn };
}

export function effectiveCategoryDiff(spent, budget, studentId, categoryId, sums) {
  const sk = normStudentId(studentId);
  const raw = Math.round((Number(spent) - Number(budget)) * 100) / 100;
  if (!(budget > 0)) return { raw, effective: raw, allocIn: 0, allocOut: 0 };
  const allocIn = sums.inn.get(`${sk}::${Number(categoryId)}`) || 0;
  const allocOut = sums.out.get(`${sk}::${Number(categoryId)}`) || 0;
  const effective = Math.round((raw - allocIn + allocOut) * 100) / 100;
  return { raw, effective, allocIn, allocOut };
}
