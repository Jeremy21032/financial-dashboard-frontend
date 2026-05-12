/** Convierte 16 bytes a UUID estándar (misma forma que el backend con uuid/stringify). */
function bytesJsonToUuid(bufObj) {
  if (!bufObj || bufObj.type !== 'Buffer' || !Array.isArray(bufObj.data)) return null;
  const arr = bufObj.data;
  if (arr.length !== 16) return null;
  const h = arr.map((x) => Number(x).toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

/** Normaliza id de estudiante (filas del dashboard). */
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

/** Excedente / déficit total del curso por categoría (suma de todos los estudiantes). */
export function buildClassCategoryTotals(byStudentMap) {
  const surplusTotalByCat = new Map();
  const deficitTotalByCat = new Map();
  byStudentMap.forEach((catMap) => {
    catMap.forEach((cell, cid) => {
      if (!(cell.budget > 0)) return;
      const raw = round2(cell.spent - cell.budget);
      if (raw < -0.005) {
        surplusTotalByCat.set(cid, round2((surplusTotalByCat.get(cid) || 0) - raw));
      } else if (raw > 0.005) {
        deficitTotalByCat.set(cid, round2((deficitTotalByCat.get(cid) || 0) + raw));
      }
    });
  });
  return { surplusTotalByCat, deficitTotalByCat };
}

/** Asignaciones persistidas a nivel curso (sin estudiante). */
export function buildAllocationSumsCourse(allocations) {
  const out = new Map();
  const inn = new Map();
  (allocations || []).forEach((a) => {
    const fid = Number(a.from_category_id);
    const tid = Number(a.to_category_id);
    out.set(fid, round2((out.get(fid) || 0) + Number(a.amount)));
    inn.set(tid, round2((inn.get(tid) || 0) + Number(a.amount)));
  });
  return { out, inn };
}

/**
 * Diferencia efectiva por celda: reparto proporcional del excedente/déficit de curso
 * que cubren las asignaciones entre categorías.
 */
export function effectiveCategoryDiffCourse(spent, budget, categoryId, classTotals, sums) {
  const cid = Number(categoryId);
  const raw = round2(Number(spent) - Number(budget));
  if (!(budget > 0)) return { raw, effective: raw, allocInShare: 0, allocOutShare: 0 };

  const allocOutCat = sums.out.get(cid) || 0;
  const allocInCat = sums.inn.get(cid) || 0;
  const T_sur = classTotals.surplusTotalByCat.get(cid) || 0;
  const T_def = classTotals.deficitTotalByCat.get(cid) || 0;

  let allocOutShare = 0;
  let allocInShare = 0;
  if (raw < -0.005 && T_sur > 0) {
    const u = -raw;
    allocOutShare = round2((u / T_sur) * allocOutCat);
  }
  if (raw > 0.005 && T_def > 0) {
    const d = raw;
    allocInShare = round2((d / T_def) * allocInCat);
  }
  const effective = round2(raw - allocInShare + allocOutShare);
  return { raw, effective, allocInShare, allocOutShare };
}
