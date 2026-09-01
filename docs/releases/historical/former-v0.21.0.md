# HISTORICAL RELEASE RECORD — FORMER PUBLIC LABEL v0.21.0 — NOT A CURRENT RELEASE

Release record for explicit recovery from partial API sources on the Sales
dashboard.

## Included

- The Sales dashboard keeps its primary Sales Commitment projection visible
  when supporting API sources fail.
- Pending business documents expose independent loading, unavailable and empty
  states through the existing Nexa presentation primitives.
- A failed business-document source can be retried without reloading the main
  dashboard metrics or request inbox.
- Failed client-account references expose a warning and retry action while the
  request inbox keeps server-backed identifiers visible.
- An unavailable document source renders `—` for its count instead of claiming
  that zero documents require action.

## API and role boundary

| Role / capability | Frontend surface | Contract used |
|---|---|---|
| `COMPANY_OWNER` | Executive overview | Existing authorized read-only projections |
| `SALES` | Commercial dashboard and Sales workflows | Existing Sales, Customer and Business Documents ports |
| `WAREHOUSE` | Inventory and warehouse operations | Existing Warehouse projections |
| `LOGISTICS` / Dispatch | Fulfillment and delivery operations | Existing Logistics/Dispatch projections |
| `BOM` | Not implemented | `OPEN`/`DEFERRED`; no accepted contract |

No endpoint, entity, role, lifecycle state or API contract was invented. The
API remains the final authorization and business-truth authority.

## Explicit boundary

- The API, Blueprint, Design Lab and Vue/legacy repositories were not modified.
- Mock adapters remain available only for explicit offline/mock mode; this
  release changes failure transparency in the API-backed Sales projection.
- Local authenticated Sales browser validation remains blocked by the absent
  `NEXA_E2E_SALES_*`/`NEXA_DEV_SALES_*` fixture. The release PR must pass the
  repository CI browser gate before publication.

## Validation

- Platform unit suite: 175 tests across 83 files.
- Design Lab v1.0.2 foundation, catalog asset and bounded-context validators.
- Production build with existing SCSS style-budget warnings.
- `npm audit --omit=dev`: 0 vulnerabilities.
- Focused component tests cover document and client-reference failure/retry
  behavior.

## Release status

Release candidate prepared through the `release/v0.21.0` GitFlow line after the
implementation PR is merged to `develop`. Publication remains gated by the
release PR checks, annotated tag and GitHub Release metadata.
