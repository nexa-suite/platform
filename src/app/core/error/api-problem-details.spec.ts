import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { isRetryableApiProblem, isStaleApiProblem, readApiProblemDetails } from './api-problem-details';

describe('api problem details', () => {
  it('parses the RFC problem contract and technical extensions', () => {
    const error = new HttpErrorResponse({ status: 502, error: {
      type: 'urn:nexa:error:scanner-unavailable', title: 'Malware scanner unavailable', status: 502,
      detail: 'Malware scanning is temporarily unavailable', code: 'SCANNER_UNAVAILABLE',
      correlationId: 'correlation-1', category: 'SCANNER', retryable: true,
    }});

    expect(readApiProblemDetails(error)).toMatchObject({ code: 'SCANNER_UNAVAILABLE', status: 502, category: 'SCANNER', correlationId: 'correlation-1', retryable: true });
    expect(isRetryableApiProblem(error)).toBe(true);
  });

  it('recognizes stale writes without treating them as automatic retries', () => {
    const error = new HttpErrorResponse({ status: 412, error: { code: 'CONCURRENCY_CONFLICT', retryable: false } });
    expect(isStaleApiProblem(error)).toBe(true);
    expect(isRetryableApiProblem(error)).toBe(false);
  });

  it('accepts serialized problem bodies and rejects unrelated errors', () => {
    const serialized = new HttpErrorResponse({ status: 503, error: JSON.stringify({ title: 'Unavailable', code: 'TECHNICAL_CAPABILITY_UNAVAILABLE' }) });
    expect(readApiProblemDetails(serialized)?.code).toBe('TECHNICAL_CAPABILITY_UNAVAILABLE');
    expect(readApiProblemDetails(new Error('offline'))).toBeNull();
  });
});
