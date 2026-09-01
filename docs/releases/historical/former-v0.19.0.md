# HISTORICAL RELEASE RECORD — FORMER PUBLIC LABEL v0.19.0 — NOT A CURRENT RELEASE

Release record for API-backed continuity across the internal role surfaces.

## Included

- Sales Dashboard KPI values now come from the existing Sales Order projection;
  fabricated credit-request and blocked-order counters were removed.
- Operations Dashboard keeps source-specific API failures visible while
  preserving successful warehouse, catalog and Logistics/Dispatch data.
- The canonical `LOGISTICS` role is recognized as the Dispatch capability and
  remains distinct from `WAREHOUSE`; custom permission-only sessions continue
  to resolve from effective permissions.

## Role boundary

| Role / capability | Frontend surface | Effective permission |
|---|---|---|
| `COMPANY_OWNER` | Executive overview and company projections | `owner:dashboard:read` |
| `SALES` | Sales dashboard, Purchase Requests, Sales Orders and Client Accounts | `sales:read` / `sales:write` |
| `WAREHOUSE` | Inventory, Warehouses, Lots and Reservations | `warehouse:read` / `warehouse:write` |
| `LOGISTICS` / Dispatch | Dispatch board, route lifecycle, temperature, incidents and POD | `logistics:read` / `logistics:write` plus canonical `dispatch.*` authorities |

Dispatch is a capability of `LOGISTICS` in the current API and is not a new
role. Frontend visibility remains permission-backed; the API remains the final
authorization authority.

## Explicit boundary

- BOM is `OPEN`/`DEFERRED`. No canonical API, Blueprint or Product contract
  defines a BOM role, endpoint, entity or lifecycle, so this release does not
  invent one.
- API, Blueprint, Design Lab and Vue/legacy sources were not modified.
- Mock adapters remain available only when `nexaDataMode=mock` is explicitly
  selected; the default runtime remains API-backed.

## Validation

- Platform unit suite: 167 tests across 81 files.
- Design Lab v1.0.2 foundation, catalog asset and bounded-context validators.
- Production build passed; existing style budget warnings remain non-blocking.
- Authenticated Logistics E2E against the Docker API: 2/2.
- `npm audit --omit=dev`: 0 vulnerabilities.

## Release status

Candidate prepared through the `release/v0.19.0` GitFlow line. Publication
requires the release PR checks, annotated tag and GitHub Release gates.
