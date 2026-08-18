export type CsvRow = Readonly<Record<string, unknown>>;

export function toCsv(rows: readonly CsvRow[]): string {
  if (!rows.length) return '';
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const escape = (value: unknown): string => {
    const text = value === null || value === undefined ? '' : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [headers.map(escape).join(','), ...rows.map((row) => headers.map((header) => escape(row[header])).join(','))].join('\r\n');
}

export function downloadCsv(filename: string, rows: readonly CsvRow[]): void {
  if (typeof document === 'undefined' || !rows.length) return;
  const blob = new Blob([`\ufeff${toCsv(rows)}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function printCurrentView(): void {
  if (typeof window !== 'undefined') window.print();
}
