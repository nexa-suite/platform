import { effect, Injectable, inject } from '@angular/core';
import { firstValueFrom, Subject } from 'rxjs';
import { AuthenticationService } from '../../../iam/application/authentication.service';
import { PLATFORM_RUNTIME_CONFIG, platformApiUrl } from '../../security/runtime-config';
import { ChangeEvent } from '../domain/change-feed.models';

const MAX_CONNECTION_MS = 60_000;
const MAX_EVENT_IDS = 500;
const RECONNECT_MS = 1_000;

@Injectable({ providedIn: 'root' })
export class ChangeFeedService {
  private readonly authentication = inject(AuthenticationService);
  private readonly config = inject(PLATFORM_RUNTIME_CONFIG);
  private readonly subject = new Subject<ChangeEvent>();
  private readonly seenIds = new Set<string>();
  private controller: AbortController | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private running = false;
  private lastEventId: string | null = null;
  private reconnectAttempt = 0;
  private refreshAttempted = false;

  readonly events = this.subject.asObservable();

  constructor() {
    effect(() => {
      if (!this.authentication.isAuthenticated()) this.disconnect();
      else if (this.running === false && this.authentication.hasAccessToken()) this.connect();
    });
  }

  connect(): void {
    if (this.running || typeof fetch === 'undefined') return;
    this.running = true;
    void this.consume();
  }

  disconnect(): void {
    this.running = false;
    this.controller?.abort();
    this.controller = null;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  private async consume(): Promise<void> {
    if (!this.running) return;
    if (this.authentication.status() !== 'authenticated' || !this.authentication.hasAccessToken()) {
      this.scheduleReconnect();
      return;
    }

    const controller = new AbortController();
    this.controller = controller;
    const timeout = setTimeout(() => controller.abort(), MAX_CONNECTION_MS);

    try {
      const headers: Record<string, string> = {
        Accept: 'text/event-stream',
        Authorization: `Bearer ${this.authentication.accessToken()}`
      };
      if (this.lastEventId) headers['Last-Event-ID'] = this.lastEventId;
      const response = await fetch(platformApiUrl(this.config, '/api/v1/change-feed/stream'), { headers, signal: controller.signal });
      if (response.status === 401 && !this.refreshAttempted) {
        this.refreshAttempted = true;
        await firstValueFrom(this.authentication.refreshAccessToken());
        throw new Error('change-feed-token-refreshed');
      }
      if (!response.ok || !response.body) throw new Error(`change-feed-${response.status}`);
      this.reconnectAttempt = 0;
      this.refreshAttempted = false;
      await this.readStream(response.body, controller.signal);
    } catch {
      // The bounded stream is intentionally retryable; auth/session errors are rechecked before reconnect.
    } finally {
      clearTimeout(timeout);
      if (this.controller === controller) this.controller = null;
      this.scheduleReconnect();
    }
  }

  private async readStream(body: ReadableStream<Uint8Array>, signal: AbortSignal): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let eventId = '';
    let eventName = 'change';
    let data: string[] = [];

    try {
      while (!signal.aborted && this.running) {
        const result = await reader.read();
        if (result.done) break;
        buffer += decoder.decode(result.value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line) {
            if (data.length) this.publish(eventId, eventName, data.join('\n'));
            eventId = '';
            eventName = 'change';
            data = [];
          } else if (line.startsWith('id:')) {
            eventId = line.slice(3).trim();
          } else if (line.startsWith('event:')) {
            eventName = line.slice(6).trim() || 'change';
          } else if (line.startsWith('data:')) {
            data.push(line.slice(5).trimStart());
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private publish(eventId: string, eventName: string, rawData: string): void {
    let parsed: Readonly<Record<string, unknown>> = {};
    try {
      const value: unknown = JSON.parse(rawData);
      if (value !== null && typeof value === 'object') parsed = value as Readonly<Record<string, unknown>>;
    } catch {
      return;
    }
    const id = eventId || this.stringValue(parsed, 'eventId', 'id') || `${eventName}:${this.stringValue(parsed, 'occurredAt', 'createdAt')}:${this.stringValue(parsed, 'resourceId')}`;
    if (this.seenIds.has(id)) return;
    this.seenIds.add(id);
    this.lastEventId = eventId || this.lastEventId;
    while (this.seenIds.size > MAX_EVENT_IDS) this.seenIds.delete(this.seenIds.values().next().value ?? id);
    this.subject.next({
      id,
      eventType: eventName === 'resync-required' ? 'resync-required' : this.stringValue(parsed, 'eventType', 'type') || eventName,
      resourceType: this.stringValue(parsed, 'resourceType', 'aggregateType'),
      resourceId: this.nullableString(parsed, 'resourceId', 'aggregateId'),
      tenantId: this.nullableString(parsed, 'tenantId'),
      workspaceId: this.nullableString(parsed, 'workspaceId'),
      occurredAt: this.stringValue(parsed, 'occurredAt', 'createdAt'),
      payload: parsed
    });
  }

  private scheduleReconnect(): void {
    if (!this.running || this.reconnectTimer) return;
    const delay = Math.min(30_000, RECONNECT_MS * 2 ** this.reconnectAttempt++);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.consume();
    }, delay);
  }

  private stringValue(value: Readonly<Record<string, unknown>>, ...keys: string[]): string {
    for (const key of keys) if (typeof value[key] === 'string') return value[key] as string;
    return '';
  }

  private nullableString(value: Readonly<Record<string, unknown>>, ...keys: string[]): string | null {
    return this.stringValue(value, ...keys) || null;
  }
}
