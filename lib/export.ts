import * as XLSX from 'xlsx';

export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const sheet = XLSX.utils.json_to_sheet(rows);
  return XLSX.utils.sheet_to_csv(sheet);
}

export function toXlsxBuffer(rows: Record<string, unknown>[]): Buffer {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, 'Candidates');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}
