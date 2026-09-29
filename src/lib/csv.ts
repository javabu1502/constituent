/**
 * Minimal RFC-4180 CSV serializer. No dependency — the repo has no CSV writer.
 * Quotes any field containing a comma, quote, or newline, and doubles embedded
 * quotes. Prefixes a UTF-8 BOM so Excel opens accented characters correctly.
 */

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  let s = String(value);
  // Spreadsheet formula injection: a cell starting with = + - @ (or a tab/CR
  // before one) would execute in Excel/Sheets. User text (titles, bodies)
  // reaches this export, so neutralize with a leading apostrophe.
  if (/^[\t\r]*[=+\-@]/.test(s)) s = `'${s}`;
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Build a CSV string from a header row and data rows.
 * @param headers column titles
 * @param rows array of rows, each an array of cell values aligned to headers
 */
export function toCSV(headers: string[], rows: unknown[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(','));
  return '﻿' + lines.join('\r\n');
}
