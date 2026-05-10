// Voylix: helper-haye export-e gozaresh-haye Buchhaltung be CSV (Excel-compatible) va PDF.
// CSV ba ; jodaa-konande va UTF-8 BOM tolid mishe — Excel-e Almani be khoobi baz mikonad.
// PDF ba jsPDF ke az qabl tu node_modules dare.

import { jsPDF } from 'jspdf';

// ----- CSV / Excel ------------------------------------------------------------
function escapeCsv(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // CRLF, ", ; ya \n bashe → quote
  if (/[";\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function downloadCsv(rows: Array<Record<string, any>>, filename: string, columns?: { key: string; label: string }[]) {
  if (!rows || rows.length === 0) {
    // Header faqat
    const header = columns ? columns.map(c => c.label).join(';') : '';
    const blob = new Blob(['﻿' + header], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, filename);
    return;
  }

  const cols = columns ?? Object.keys(rows[0]).map(k => ({ key: k, label: k }));
  const header = cols.map(c => c.label).join(';');
  const body = rows.map(r => cols.map(c => escapeCsv(r[c.key])).join(';')).join('\r\n');
  const csv = '﻿' + header + '\r\n' + body;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);
}

// ----- PDF (table) ------------------------------------------------------------
// Minimal table renderer — bedoone jspdf-autotable; manual layout
export function downloadPdfTable(opts: {
  title: string;
  subtitle?: string;
  filename: string;
  columns: { key: string; label: string; align?: 'left' | 'right' | 'center'; width?: number }[];
  rows: Array<Record<string, any>>;
  meta?: { label: string; value: string }[];
}) {
  const { title, subtitle, filename, columns, rows, meta } = opts;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth  = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 30;
  let y = margin;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(title, margin, y);
  y += 18;

  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(subtitle, margin, y);
    doc.setTextColor(0);
    y += 14;
  }

  if (meta && meta.length > 0) {
    doc.setFontSize(9);
    doc.setTextColor(80);
    const metaText = meta.map(m => `${m.label}: ${m.value}`).join('   |   ');
    doc.text(metaText, margin, y);
    doc.setTextColor(0);
    y += 14;
  }

  y += 4;

  // Compute column widths
  const totalSpecified = columns.reduce((s, c) => s + (c.width ?? 0), 0);
  const unspecifiedCount = columns.filter(c => !c.width).length;
  const tableWidth = pageWidth - margin * 2;
  const remaining = Math.max(0, tableWidth - totalSpecified);
  const defaultW = unspecifiedCount > 0 ? remaining / unspecifiedCount : 0;
  const colWidths = columns.map(c => c.width ?? defaultW);
  const xStart = margin;

  // Header
  const headerHeight = 22;
  doc.setFillColor(240, 240, 240);
  doc.rect(xStart, y, tableWidth, headerHeight, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  let cx = xStart;
  columns.forEach((col, i) => {
    const w = colWidths[i];
    const text = col.label;
    const tx =
      col.align === 'right'  ? cx + w - 6 :
      col.align === 'center' ? cx + w / 2 :
      cx + 6;
    doc.text(text, tx, y + 14, { align: col.align ?? 'left' });
    cx += w;
  });
  y += headerHeight;

  // Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const rowHeight = 18;

  for (const r of rows) {
    if (y + rowHeight > pageHeight - margin - 30) {
      doc.addPage();
      y = margin;
    }
    cx = xStart;
    // alternating row stripe
    if ((rows.indexOf(r) % 2) === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(xStart, y, tableWidth, rowHeight, 'F');
    }
    columns.forEach((col, i) => {
      const w = colWidths[i];
      const raw = r[col.key];
      const text = raw === null || raw === undefined ? '' : String(raw);
      // truncate
      const maxChars = Math.floor(w / 4);
      const displayText = text.length > maxChars ? text.slice(0, maxChars - 1) + '…' : text;
      const tx =
        col.align === 'right'  ? cx + w - 6 :
        col.align === 'center' ? cx + w / 2 :
        cx + 6;
      doc.text(displayText, tx, y + 12, { align: col.align ?? 'left' });
      cx += w;
    });
    y += rowHeight;
  }

  // Footer (timestamp)
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(140);
    const ts = new Date().toLocaleString('de-DE');
    doc.text(`Erstellt: ${ts}   |   Seite ${p} / ${total}`, margin, pageHeight - 12);
    doc.setTextColor(0);
  }

  doc.save(filename);
}

// ----- helper ---------------------------------------------------------------
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ----- formatters -----------------------------------------------------------
export const fmtCurrency = (n: number, currency = 'EUR') =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(Number(n) || 0);

export const fmtNumber = (n: number) =>
  new Intl.NumberFormat('de-DE').format(Number(n) || 0);

export const fmtDate = (s?: string | null) => {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString('de-DE');
};
