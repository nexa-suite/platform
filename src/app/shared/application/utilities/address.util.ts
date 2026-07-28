export function formatAddress(...parts: unknown[]): string {
  const seen = new Set<string>();
  const values: string[] = [];
  for (const part of parts) {
    if (part === null || part === undefined) continue;
    const value = String(part).trim();
    if (!value) continue;
    const key = value.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    values.push(value);
  }
  return values.join(', ');
}
