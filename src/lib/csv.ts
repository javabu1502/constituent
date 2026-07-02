/**
 * Minimal RFC-4180 CSV serializer. No dependency — the repo has no CSV writer.
 * Quotes any field containing a comma, quote, or newline, and doubles embedded
 * quotes. Prefixes a UTF-8 BOM so Excel opens accented characters correctly.
 */

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
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
