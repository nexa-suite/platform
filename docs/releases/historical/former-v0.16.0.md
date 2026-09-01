# HISTORICAL RELEASE RECORD — FORMER PUBLIC LABEL v0.16.0 — NOT A CURRENT RELEASE

Release record for live Company Owner projections and permission-aware
operational role surfaces.

## Included

- Company Owner executive overview backed by the existing Sales, Client
  Account, Warehouse and Logistics API ports.
- Server totals for Sales Orders, Purchase Requests, Client Accounts,
  Warehouses and Inventory Lots.
- Dispatch indicators for active workload, incidents and deliveries reported
  today when the authenticated session has `logistics:read`.
- Recent activity from the authorized workspace change-feed.
- Explicit role preparation for `COMPANY_OWNER`, `SALES`, `WAREHOUSE` and
  `LOGISTICS`.

## Role boundary

| Role / capability | Frontend surface | Effective permission |
|---|---|---|
| `COMPANY_OWNER` | Executive overview and company projections | `owner:dashboard:read` |
| `SALES` | Sales dashboard, Purchase Requests, Sales Orders and Client Accounts | `sales:read` / `sales:write` |
| `WAREHOUSE` | Inventory, Warehouses, Lots and Reservations | `warehouse:read` / `warehouse:write` |
| `LOGISTICS` / Dispatch | Dispatch board, route lifecycle, temperature, incidents and POD | `logistics:read` / `logistics:write` plus canonical `dispatch.*` authorities |

Dispatch is a capability of the canonical `LOGISTICS` role in the current API;
this release does not create a separate Dispatch role. UI visibility remains
permission-backed and the API remains the final authorization authority.

## Explicit boundary

- BOM is `OPEN`/`DEFERRED`. The current API and Blueprint contain no canonical
  BOM role, endpoint, entity or lifecycle contract. Implementing it would
  invent Product/Domain authority, so it is intentionally not included.
- No API, Blueprint or Vue source changed. Existing REST contracts were enough
  for the frontend composition.
- Mock adapters remain available only for explicit mock mode; the default
  runtime remains API-backed.

## Validation

- Company Owner facade focused tests: 3/3 passed.
- Buyer Request Builder focused tests: 5/5 passed.
- Full unit suites, bounded-context validators, Design Lab foundation checks,
  production builds, dependency audits and authenticated browser checks are
  recorded at publication time.

## Release status

Published through the `release/v0.16.0` GitFlow line with an annotated
`v0.16.0` tag and GitHub Release. Tags are annotated but unsigned in this
repository unless a signing key is configured before publication.
