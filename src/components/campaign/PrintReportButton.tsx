'use client';

/** Triggers the browser print dialog so an org can Save-as-PDF the report. */
export function PrintReportButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden shrink-0 text-sm font-medium px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors"
    >
      Print / Save as PDF
    </button>
  );
}
