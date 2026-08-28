import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { requiresCredentials, signIn } from './support/auth';
import { credentialEnvironment, type CredentialRole } from './support/role-fixtures';

const API_URL = process.env.NEXA_API_URL ?? 'http://localhost:8080';

type ForbiddenReason = 'ROLE_NOT_ASSIGNED' | 'PERMISSION_NOT_GRANTED';

interface DeniedRoute {
  readonly path: string;
  readonly reason: ForbiddenReason;
}

const REASON_COPY: Record<ForbiddenReason, RegExp> = {
  ROLE_NOT_ASSIGNED: /current roles|roles actuales/i,
  PERMISSION_NOT_GRANTED: /permission required|permiso requerido/i,
};

const DISPATCH_DETAIL_ROUTE =
  '/ops/operations/dispatch-orders/00000000-0000-0000-0000-000000000000';

interface DispatchFixture {
  readonly id: string;
  readonly dispatchNumber: string;
  readonly status: string;
  readonly temperatureMin: number | null;
  readonly temperatureMax: number | null;
  readonly version: number;
}

interface DispatchMutation {
  readonly id: string;
  readonly status: string;
  readonly version: number;
}

interface AuthenticatedRole {
  readonly accessToken: string;
  readonly membershipId: string;
}

interface ApiResource {
  readonly id: string;
  readonly etag: string;
}

async function loginApi(
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
    readonly session?: { readonly membershipId?: string; readonly roles?: readonly string[]; readonly surface?: string };
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

async function createLifecycleDispatch(request: APIRequestContext): Promise<ApiResource> {
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
  return { id: dispatch.body.id, etag: logisticsSession.accessToken };
}

async function signInLogistics(page: Page, request: APIRequestContext): Promise<AuthenticatedRole> {
  let sessionBody: { readonly membership?: { readonly membershipId?: string } } | undefined;
  await page.route('**/api/v1/session', async (route) => {
    const response = await route.fetch();
    sessionBody = JSON.parse((await response.body()).toString('utf8')) as {
      readonly membership?: { readonly membershipId?: string };
    };
    await route.fulfill({ response });
  });
  try {
    await signIn(page, 'LOGISTICS');
  } finally {
    await page.unroute('**/api/v1/session');
  }
  const apiSession = await loginApi(request, 'LOGISTICS', 'PLATFORM');
  if (!sessionBody) throw new Error('E2E browser session response body was not captured');
  expect(sessionBody.membership?.membershipId).toBeTruthy();
  expect(sessionBody.membership!.membershipId).toBe(apiSession.membershipId);
  return apiSession;
}

async function assertNoForbiddenSidebarLink(page: Page): Promise<void> {
  const sidebar = page.locator('mat-sidenav.platform-sidebar nav[aria-label]').first();
  await expect(sidebar).toBeAttached();
  if (!(await sidebar.isVisible())) {
    if ((page.viewportSize()?.width ?? 1280) <= 760) {
      const menuButton = page.locator('button.mobile-menu-button');
      await expect(menuButton).toBeVisible();
      await menuButton.click();
    }
  }
  await expect(sidebar).toBeVisible();
  await expect(sidebar.locator('a[href*="/forbidden"]')).toHaveCount(0);
  await expect(sidebar).not.toContainText(/forbidden|access restricted|acceso restringido/i);
}

async function assertAllowedSurface(page: Page, path: string, heading: RegExp): Promise<void> {
  await test.step(`LOGISTICS allowed ${path}`, async () => {
    await page.goto(path);
    await expect.poll(() => new URL(page.url()).pathname).toBe(path);
    await expect(page.locator('.forbidden-page')).toHaveCount(0);
    await expect(page.locator('main#main-content')).toBeVisible();
    await expect(page.locator('h1')).toContainText(heading);
    await assertNoForbiddenSidebarLink(page);
  });
}

async function assertDeniedSurface(page: Page, denied: DeniedRoute): Promise<void> {
  await test.step(`LOGISTICS denied ${denied.path}`, async () => {
    await page.goto(denied.path);
    await expect(page).toHaveURL(/\/forbidden(?:\?|$)/);
    const currentUrl = new URL(page.url());
    expect(currentUrl.pathname).toBe('/forbidden');
    expect(currentUrl.searchParams.get('returnUrl')).toBe(denied.path);
    expect(currentUrl.searchParams.get('reason')).toBe(denied.reason);
    await expect(
      page.getByRole('heading', { name: /access restricted|acceso restringido/i }),
    ).toBeVisible();
    await expect(page.locator('.forbidden-page')).toContainText(REASON_COPY[denied.reason]);
    await expect(page.locator('nav a')).toHaveCount(0);
  });
}

test('pure LOGISTICS reaches operational reads and dispatch detail without promotion management', async ({
  page,
  request,
}) => {
  requiresCredentials('LOGISTICS');
  await signInLogistics(page, request);
  await expect.poll(() => new URL(page.url()).pathname).toBe('/ops/operations/dashboard');
  await assertNoForbiddenSidebarLink(page);

  await assertAllowedSurface(
    page,
    '/ops/operations/inventory',
    /inventory control|control de inventario/i,
  );
  await assertAllowedSurface(
    page,
    '/ops/operations/inventory-overview',
    /inventory control|control de inventario/i,
  );
  await assertAllowedSurface(
    page,
    '/ops/operations/fulfillment-readiness',
    /fulfillment readiness|preparación de despacho/i,
  );
  await assertAllowedSurface(
    page,
    '/ops/operations/dispatch-orders',
    /dispatch board|tablero de despachos/i,
  );
  await assertAllowedSurface(page, DISPATCH_DETAIL_ROUTE, /dispatch detail|detalle del despacho/i);
  await assertAllowedSurface(
    page,
    '/ops/operations/proof-of-delivery',
    /proof of delivery|prueba de entrega/i,
  );
  await assertAllowedSurface(
    page,
    '/ops/operations/temperature-incidents',
    /temperature|temperatura/i,
  );
  await assertAllowedSurface(
    page,
    '/ops/operations/operational-analytics',
    /operational analytics|analítica operativa/i,
  );
  await assertAllowedSurface(page, '/ops/catalog', /catalog management|gestión de catálogo/i);
  await assertAllowedSurface(page, '/ops/catalog/products', /products|productos/i);
  await assertAllowedSurface(page, '/ops/catalog/promotions', /promotions|promociones/i);

  await assertAllowedSurface(page, '/ops/catalog/pricing', /pricing|precios/i);
  await expect(page.getByRole('button', { name: /create price|crear precio/i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /cancel price|cancelar precio/i })).toHaveCount(0);

  await assertDeniedSurface(page, {
    path: '/ops/catalog/products/new',
    reason: 'PERMISSION_NOT_GRANTED',
  });
});

async function mutateDispatch(
  page: Page,
  accessToken: string,
  dispatchId: string,
  suffix: string,
  action: () => Promise<void>,
  expectedStatus: string,
  previousVersion: number,
): Promise<DispatchMutation> {
  const responsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response.url().includes(`/api/v1/dispatch-orders/${dispatchId}/${suffix}`),
  );
  await action();
  const response = await responsePromise;
  expect(response.ok(), `dispatch mutation returned HTTP ${response.status()} for ${suffix}`).toBeTruthy();
  const detailResponse = await page.request.get(`${API_URL}/api/v1/dispatch-orders/${dispatchId}`, {
    headers: { Origin: 'http://localhost:4200', Authorization: `Bearer ${accessToken}` },
  });
  expect(detailResponse.ok()).toBeTruthy();
  const detail = await detailResponse.json() as { readonly id: string; readonly status: string; readonly version: number };
  expect(detail.status).toBe(expectedStatus);
  expect(detail.version).toBeGreaterThan(previousVersion);
  return { id: detail.id, status: detail.status, version: detail.version };
}

function futureLocal(minutes: number): string {
  const value = new Date(Date.now() + minutes * 60_000);
  value.setSeconds(0, 0);
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

test('LOGISTICS performs supported dispatch lifecycle actions against the server state', async ({
  page,
  request,
}) => {
  requiresCredentials('LOGISTICS');
  const fixture = await createLifecycleDispatch(request);
  const logisticsSession = await signInLogistics(page, request);
  const membershipId = logisticsSession.membershipId;
  await page.goto('/ops/operations/dispatch-orders');
  await expect(page.locator('h1')).toContainText(/dispatch board|tablero de despachos/i);
  await expect(page.locator('nexa-loading-state')).toHaveCount(0, { timeout: 10_000 });

  const dispatchListResponse = await page.request.get(`${API_URL}/api/v1/dispatch-orders?page=0&size=100`, {
    headers: { Origin: 'http://localhost:4200', Authorization: `Bearer ${logisticsSession.accessToken}` },
  });
  expect(dispatchListResponse.ok()).toBeTruthy();
  const dispatchList = (await dispatchListResponse.json()) as {
    readonly items?: readonly DispatchFixture[];
  };
  const dispatch = dispatchList.items?.find((item) => item.id === fixture.id);
  if (!dispatch) throw new Error(`E2E fixture ${fixture.id} was not returned by the server-backed dispatch list`);

  const dispatchId = dispatch.id;
  let status = dispatch.status;
  let version = dispatch.version;
  let actions = 0;

  while (actions < 8 && status !== 'DELIVERED' && status !== 'CANCELLED') {
    let mutation: DispatchMutation;
    if (status === 'READY_FOR_OPERATIONS') {
      await page.goto('/ops/operations/dispatch-orders');
      const card = page.locator(`[data-status="READY_FOR_OPERATIONS"] article`).filter({ has: page.locator(`a[href$="/${dispatchId}"]`) });
      mutation = await mutateDispatch(page, logisticsSession.accessToken, dispatchId, 'preparation-starts', () => card.getByRole('button', { name: /start preparation|move(?: dispatch)? forward|iniciar preparación|avanzar/i }).click(), 'PREPARING', version);
    } else {
      await page.goto(`/ops/operations/dispatch-orders/${dispatchId}`);
      await expect(page.locator('h1')).toContainText(/dispatch detail|detalle del despacho/i);
      await expect(page.locator('nexa-loading-state')).toHaveCount(0, { timeout: 10_000 });

      if (status === 'PREPARING') {
        await page.locator('[formcontrolname="responsibleMembershipId"]').selectOption(membershipId);
        await page.locator('[formcontrolname="vehicleReference"]').fill('E2E-TRUCK-01');
        await page.locator('[formcontrolname="routeName"]').fill('E2E route');
        mutation = await mutateDispatch(page, logisticsSession.accessToken, dispatchId, 'assignments', () => page.getByRole('button', { name: /^assign$|^asignar$/i }).click(), 'ASSIGNED', version);
      } else if (status === 'ASSIGNED' || status === 'REPROGRAMMED') {
        await page.locator('[formcontrolname="deliveryWindowStart"]').first().fill(futureLocal(60));
        await page.locator('[formcontrolname="deliveryWindowEnd"]').first().fill(futureLocal(180));
        await page.locator('[formcontrolname="eta"]').first().fill(futureLocal(120));
        mutation = await mutateDispatch(page, logisticsSession.accessToken, dispatchId, 'schedules', () => page.getByRole('button', { name: /^schedule$|^programar$/i }).click(), 'SCHEDULED', version);
      } else if (status === 'SCHEDULED') {
        mutation = await mutateDispatch(page, logisticsSession.accessToken, dispatchId, 'route-readiness', () => page.getByRole('button', { name: /mark ready for route|marcar listo para ruta/i }).click(), 'READY_FOR_ROUTE', version);
      } else if (status === 'READY_FOR_ROUTE') {
        mutation = await mutateDispatch(page, logisticsSession.accessToken, dispatchId, 'route-starts', () => page.getByRole('button', { name: /start route|iniciar ruta/i }).click(), 'IN_ROUTE', version);
      } else if (status === 'IN_ROUTE') {
        const safeTemperature = dispatch!.temperatureMin !== null && dispatch!.temperatureMax !== null
          ? (dispatch!.temperatureMin + dispatch!.temperatureMax) / 2
          : -18;
        await page.locator('[formcontrolname="value"]').fill(String(safeTemperature));
        await page.locator('[formcontrolname="source"]').fill('E2E');
        const temperatureMutation = await mutateDispatch(page, logisticsSession.accessToken, dispatchId, 'temperature-readings', () => page.getByRole('button', { name: /record reading|registrar lectura/i }).click(), 'IN_ROUTE', version);
        version = temperatureMutation.version;
        actions += 1;
        await page.locator('[formcontrolname="receiverName"]').fill('E2E receiver');
        mutation = await mutateDispatch(page, logisticsSession.accessToken, dispatchId, 'delivery-completions', () => page.getByRole('button', { name: /complete delivery|completar entrega/i }).click(), 'DELIVERED', version);
      } else if (status === 'INCIDENT') {
        await page.locator('[formcontrolname="deliveryWindowStart"]').last().fill(futureLocal(240));
        await page.locator('[formcontrolname="deliveryWindowEnd"]').last().fill(futureLocal(360));
        await page.locator('[formcontrolname="eta"]').last().fill(futureLocal(300));
        await page.locator('[formcontrolname="reason"]').fill('E2E route reprogramming');
        mutation = await mutateDispatch(page, logisticsSession.accessToken, dispatchId, 'reprogrammings', () => page.getByRole('button', { name: /reprogram|reprogramar/i }).click(), 'REPROGRAMMED', version);
      } else {
        throw new Error(`E2E fixture ${dispatch.dispatchNumber} reached unsupported lifecycle status ${status}`);
      }
    }
    status = mutation.status;
    version = mutation.version;
    actions += 1;
  }

  expect(actions).toBeGreaterThanOrEqual(7);
  expect(status).toBe('DELIVERED');
});
