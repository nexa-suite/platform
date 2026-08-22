import { HttpErrorResponse } from '@angular/common/http';

export interface ApiProblemDetails {
  readonly type?: string;
  readonly title?: string;
  readonly status?: number;
  readonly detail?: string;
  readonly instance?: string;
  readonly code: string;
  readonly correlationId?: string;
  readonly traceId?: string;
  readonly category?: string;
  readonly retryable: boolean;
}

const RETRYABLE_STATUSES = new Set([408, 425, 429, 502, 503, 504]);

export function readApiProblemDetails(error: unknown): ApiProblemDetails | null {
  const response = error instanceof HttpErrorResponse ? error : null;
  const body = response?.error ?? error;
  const value = parseObject(body);
  if (!value) return null;
  const status = numberValue(value, 'status') ?? response?.status;
  const code = stringValue(value, 'code') ?? (status && status > 0 ? `HTTP_${status}` : 'API_PROBLEM');
  const hasProblemShape = code !== 'API_PROBLEM' || ['type', 'title', 'detail', 'instance'].some((key) => key in value);
  if (!hasProblemShape) return null;
  const explicitRetryable = value['retryable'];
  return {
    type: stringValue(value, 'type'),
    title: stringValue(value, 'title'),
    status,
    detail: stringValue(value, 'detail'),
    instance: stringValue(value, 'instance'),
    code,
    correlationId: stringValue(value, 'correlationId'),
    traceId: stringValue(value, 'traceId'),
    category: stringValue(value, 'category'),
    retryable: typeof explicitRetryable === 'boolean' ? explicitRetryable : status !== undefined && RETRYABLE_STATUSES.has(status),
  };
}

export function isRetryableApiProblem(error: unknown): boolean {
  return readApiProblemDetails(error)?.retryable === true;
}

export function isStaleApiProblem(error: unknown): boolean {
  const problem = readApiProblemDetails(error);
  return problem?.code === 'CONCURRENCY_CONFLICT' || problem?.status === 409 || problem?.status === 412;
}

function parseObject(value: unknown): Record<string, unknown> | null {
  if (typeof value === 'string') {
    try { return parseObject(JSON.parse(value)); } catch { return null; }
  }
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function stringValue(value: Record<string, unknown>, key: string): string | undefined {
  const candidate = value[key];
  return typeof candidate === 'string' && candidate.trim() ? candidate : undefined;
}

function numberValue(value: Record<string, unknown>, key: string): number | undefined {
  const candidate = value[key];
  return typeof candidate === 'number' && Number.isFinite(candidate) ? candidate : undefined;
}
