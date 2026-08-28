import type { DispatchOrder } from '../domain/logistics.models';

export function formatDispatchDestination(item: Pick<DispatchOrder, 'destination' | 'deliveryArea'>): string {
  const raw = item.destination?.trim();
  const fallback = item.deliveryArea?.trim() || '—';
  if (!raw) return fallback;
  if (!raw.startsWith('{') && !raw.startsWith('[')) return raw;

  const snapshot = parseSnapshot(raw);
  if (!snapshot) return fallback;
  const delivery = record(snapshot['delivery']);
  const address = record(delivery?.['address']) ?? record(snapshot['address']);
  const nestedAddress = record(address?.['address']);
  const sources = [nestedAddress, address, delivery, snapshot];
  const label = firstText(sources, ['label', 'addressLabel', 'destinationLabel', 'formattedAddress']);
  const line = firstText(sources, ['line', 'addressLine', 'streetAddress']);
  const area = firstText(sources, ['districtName', 'district', 'deliveryArea']);
  const readable = [...new Set([label, line, area].filter((value): value is string => Boolean(value)))].join(' · ');
  return readable || fallback;
}

function parseSnapshot(value: string): Record<string, unknown> | null {
  try {
    return record(JSON.parse(value));
  } catch {
    return null;
  }
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function firstText(sources: readonly (Record<string, unknown> | null)[], keys: readonly string[]): string | null {
  for (const source of sources) {
    for (const key of keys) {
      const value = source?.[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
  }
  return null;
}
