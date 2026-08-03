import { expect, type APIRequestContext } from '@playwright/test';
import { requiresCredentials } from './auth';
import { credentialEnvironment, type CredentialRole } from './role-fixtures';

const API_URL = process.env.NEXA_API_URL ?? 'http://localhost:8080';

export interface AuthenticatedRole {
  readonly accessToken: string;
  readonly membershipId: string;
}

export interface ApiResource {
  readonly id: string;
  readonly etag: string;
}

export async function loginApi(
  request: APIRequestContext,
  role: CredentialRole,
  surface: 'PLATFORM' | 'PORTAL',
): Promise<AuthenticatedRole> {
  const { email, password, workspace } = credentialEnvironment(role);
  if (!email || !password) throw new Error(`Missing ${role} credential fixture`);
  const response = await request.post(`${API_URL}/api/v1/authentication/sign-in`, {
    headers: { Origin: 'http://localhost:4200' },
    data: { identifier: email, password, workspaceSlug: workspace, surface },
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json() as {
    readonly accessToken?: string;
    readonly session?: { readonly membershipId?: string };
  };
  if (!body.accessToken || !body.session?.membershipId) {
    throw new Error(`Authentication response for ${role} did not contain a usable session`);
  }
  return { accessToken: body.accessToken, membershipId: body.session.membershipId };
}

async function postApi<T>(
  request: APIRequestContext,
  path: string,
  accessToken: string,
  expectedStatus: number,
  options: { readonly data?: unknown; readonly headers?: Record<string, string> } = {},
): Promise<{ readonly body: T; readonly etag: string }> {
  const response = await request.post(`${API_URL}${path}`, {
    headers: {
      Origin: 'http://localhost:4200',
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
    ...(options.data === undefined ? {} : { data: options.data }),
  });
  expect(response.status()).toBe(expectedStatus);
  const body = await response.json() as T;
  return { body, etag: response.headers()['etag'] ?? '' };
}

/** Creates an isolated READY_FOR_OPERATIONS dispatch for repeatable UI evidence. */
export async function createLifecycleDispatch(request: APIRequestContext): Promise<ApiResource> {
  requiresCredentials('SALES');
  requiresCredentials('WAREHOUSE');
  requiresCredentials('LOGISTICS');
  const buyer = credentialEnvironment('BUYER');
  if (!buyer.email || !buyer.password) throw new Error('Missing BUYER credential fixture');

  const buyerSession = await loginApi(request, 'BUYER', 'PORTAL');
  const purchaseRequest = await postApi<{ readonly id: string }>(
    request,
    '/api/v1/purchase-requests',
    buyerSession.accessToken,
    201,
    { data: { lines: [{ catalogItemId: 'CAT-0002', quantity: 1, unit: 'UNIT' }] } },
  );
  const submitted = await postApi<{ readonly id: string }>(
    request,
    `/api/v1/purchase-requests/${purchaseRequest.body.id}/submissions`,
    buyerSession.accessToken,
    200,
    { headers: { 'If-Match': purchaseRequest.etag, 'Idempotency-Key': `e2e-submit-${Date.now()}` } },
  );

  const salesSession = await loginApi(request, 'SALES', 'PLATFORM');
  const reviewed = await postApi<{ readonly id: string }>(
    request,
    `/api/v1/purchase-requests/${purchaseRequest.body.id}/reviews`,
    salesSession.accessToken,
    200,
    { headers: { 'If-Match': submitted.etag } },
  );
  const approved = await postApi<{ readonly id: string }>(
    request,
    `/api/v1/purchase-requests/${purchaseRequest.body.id}/approvals`,
    salesSession.accessToken,
    200,
    { headers: { 'If-Match': reviewed.etag } },
  );
  const salesOrder = await postApi<{ readonly id: string }>(
    request,
    `/api/v1/purchase-requests/${purchaseRequest.body.id}/order-conversions`,
    salesSession.accessToken,
    201,
    { headers: { 'If-Match': approved.etag, 'Idempotency-Key': `e2e-convert-${Date.now()}` }, data: {} },
  );
  const confirmed = await postApi<{ readonly id: string }>(
    request,
    `/api/v1/sales-orders/${salesOrder.body.id}/confirmations`,
    salesSession.accessToken,
    200,
    { headers: { 'If-Match': salesOrder.etag } },
  );

  const warehouseSession = await loginApi(request, 'WAREHOUSE', 'PLATFORM');
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
  const warehouse = await postApi<{ readonly id: string }>(
    request,
    '/api/v1/warehouses',
    warehouseSession.accessToken,
    201,
    { data: { code: `E2E-${suffix.slice(-20)}`, name: 'E2E lifecycle warehouse', address: 'Lima' } },
  );
  const zone = await postApi<{ readonly id: string }>(
    request,
    `/api/v1/warehouses/${warehouse.body.id}/zones`,
    warehouseSession.accessToken,
    201,
    { data: { code: `Z-${suffix.slice(-20)}`, name: 'E2E frozen zone', type: 'FROZEN', temperatureMin: -25, temperatureMax: -15 } },
  );
  await postApi<{ readonly id: string }>(
    request,
    '/api/v1/inventory/inbound-receipts',
    warehouseSession.accessToken,
    201,
    {
      headers: { 'Idempotency-Key': `e2e-inbound-${suffix}` },
      data: {
        warehouseId: warehouse.body.id,
        zoneId: zone.body.id,
        catalogItemId: 'CAT-0002',
        batchNumber: `E2E-${suffix}`,
        expirationDate: '2099-01-01',
        quantity: 20,
        unit: 'UNIT',
        temperatureReading: -18,
      },
    },
  );
  const reservation = await postApi<{ readonly id: string }>(
    request,
    `/api/v1/fulfillment-candidates/${salesOrder.body.id}/inventory-reservations`,
    warehouseSession.accessToken,
    201,
    { headers: { 'If-Match': confirmed.etag, 'Idempotency-Key': `e2e-reserve-${suffix}` } },
  );
  const logisticsSession = await loginApi(request, 'LOGISTICS', 'PLATFORM');
  const dispatch = await postApi<{ readonly id: string }>(
    request,
    `/api/v1/inventory-reservations/${reservation.body.id}/dispatch-orders`,
    logisticsSession.accessToken,
    201,
    { headers: { 'If-Match': reservation.etag, 'Idempotency-Key': `e2e-dispatch-${suffix}` } },
  );
  if (!dispatch.body.id || !reservation.etag) throw new Error('E2E dispatch fixture did not return id and reservation version');
  return { id: dispatch.body.id, etag: dispatch.etag };
}
