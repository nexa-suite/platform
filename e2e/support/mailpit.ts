import { expect, Page } from '@playwright/test';

const mailpitUrl = process.env.NEXA_MAILPIT_URL ?? 'http://localhost:8025';

type MailpitMessage = { readonly ID?: string; readonly Id?: string; readonly id?: string; readonly Created?: string };

function resetOrigin(surface: 'PLATFORM' | 'PORTAL'): string {
  const configuredUrl = surface === 'PORTAL'
    ? process.env.NEXA_PORTAL_URL ?? 'http://localhost:4300'
    : process.env.NEXA_PLATFORM_URL ?? 'http://localhost:4200';
  return new URL(configuredUrl).origin;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function messageIds(page: Page): Promise<Set<string>> {
  const response = await page.request.get(`${mailpitUrl}/api/v1/messages`);
  expect(response.ok()).toBeTruthy();
  const body = await response.json() as { messages?: MailpitMessage[] };
  return new Set((body.messages ?? []).map((message) => message.ID ?? message.Id ?? message.id).filter((id): id is string => Boolean(id)));
}

export async function waitForResetLink(page: Page, surface: 'PLATFORM' | 'PORTAL', before: Set<string>): Promise<string> {
  const origin = resetOrigin(surface);
  const pattern = new RegExp(`${escapeRegExp(origin)}/reset-password\\?token=([^\\s"'<>]+)`);
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    const response = await page.request.get(`${mailpitUrl}/api/v1/messages`);
    expect(response.ok()).toBeTruthy();
    const body = await response.json() as { messages?: MailpitMessage[] };
    for (const message of body.messages ?? []) {
      const id = message.ID ?? message.Id ?? message.id;
      if (!id || before.has(id)) continue;
      const detailResponse = await page.request.get(`${mailpitUrl}/api/v1/message/${encodeURIComponent(id)}`);
      if (!detailResponse.ok()) continue;
      const detail = await detailResponse.json() as Record<string, unknown>;
      const text = Object.values(detail).filter((value): value is string => typeof value === 'string').join('\\n');
      const match = text.match(pattern);
      if (match) return `${origin}/reset-password?token=${match[1]}`;
    }
    await page.waitForTimeout(250);
  }
  throw new Error(`Mailpit did not receive a ${surface} reset message`);
}

export async function assertNoBrowserSecrets(page: Page): Promise<void> {
  const storage = await page.evaluate(() => [...Object.entries(localStorage), ...Object.entries(sessionStorage)]);
  expect(storage.some(([key, value]) => /token|secret|password|credential|^NEXA_/i.test(key) || /eyJ[a-zA-Z0-9_-]+\./.test(value))).toBeFalsy();
}
