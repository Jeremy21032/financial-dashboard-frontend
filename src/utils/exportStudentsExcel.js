import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import moment from 'moment';

/**
 * Exporta listado de estudiantes a Excel con encabezado de curso/paralelo.
 * @param {{ id: number, name: string }[]} students
 * @param {{ level?: string, parallel?: string, academic_year?: string } | null} course
 * @param {{ searchText?: string }=} options
 */
export function exportStudentsToExcel(students, course, options = {}) {
  const searchText = options.searchText || '';
  const list = searchText
    ? students.filter((s) =>
        String(s.name || '')
          .toLowerCase()
          .includes(searchText.toLowerCase())
      )
    : [...students];

  const level = course?.level != null ? String(course.level) : '—';
  const parallel = course?.parallel != null ? String(course.parallel) : '—';
  const year = course?.academic_year != null ? String(course.academic_year) : '—';
  const paraleloLabel = `${level} · Paralelo ${parallel}`;

  const aoa = [];

  aoa.push(['Listado de estudiantes']);
  aoa.push([]);
  aoa.push(['Nivel / grado', level]);
  aoa.push(['Paralelo', parallel]);
  aoa.push(['Año lectivo', year]);
  aoa.push(['Combinación (referencia)', paraleloLabel]);
  aoa.push(['Total estudiantes', list.length]);
  aoa.push(['Exportado el', moment().format('DD/MM/YYYY HH:mm')]);
  if (searchText) {
    aoa.push(['Filtro de búsqueda', searchText]);
  }
  aoa.push([]);
  aoa.push(['#', 'ID', 'Nombre completo', 'Paralelo', 'Nivel', 'Año lectivo']);

  list.forEach((s, i) => {
    aoa.push([i + 1, s.id, s.name || '', parallel, level, year]);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];

  ws['!cols'] = [
    { wch: 5 },
    { wch: 8 },
    { wch: 42 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Estudiantes');

  const safeParallel = String(parallel).replace(/[/\\?%*:|"<>]/g, '-');
  const fname = `Estudiantes_Paralelo_${safeParallel}_${moment().format('YYYY-MM-DD_HH-mm')}.xlsx`;
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), fname);
}
