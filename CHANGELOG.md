# Changelog

All notable changes to this project are documented in this file.
The project uses Semantic Versioning.

## [0.19.0] - 2026-08-28

API-backed continuity across internal operational roles.

### Added

- Source-specific operational error signals and explicit partial-data notices so successful API projections are not presented as complete when another source is unavailable.
- Release documentation for the canonical `COMPANY_OWNER`, `SALES`, `WAREHOUSE` and `LOGISTICS`/Dispatch role boundaries.

### Changed

- Sales Dashboard KPI cards now use API-backed pending and confirmed Sales Order metrics instead of fabricated credit-request and blocked-order counters.
- Operations Dashboard role selection respects the canonical `LOGISTICS` role and effective permissions while preserving the Warehouse surface for `WAREHOUSE`.
- Catalog lookup failures keep the inventory identifier visible and explain the degraded product-name projection.

### Boundary

- Dispatch remains a capability of canonical `LOGISTICS`; no separate `DISPATCH` role was introduced.
- `BOM` remains `OPEN`/`DEFERRED` because the accepted API and Blueprint expose no canonical role, endpoint, entity or lifecycle contract.
- API, Blueprint, Design Lab and legacy repositories were not modified; mock adapters remain available only for explicit mock mode.

### Validation

- Platform unit suite: 167 tests across 81 files passed.
- Design Lab v1.0.2 foundation, catalog asset and bounded-context validators passed.
- Production build passed with existing style budget warnings.
- Authenticated Logistics E2E against Docker: 2/2 passed.
- `npm audit --omit=dev`: 0 vulnerabilities.

## [0.18.0] - 2026-08-28

API continuity and role-separated operational landings.

### Changed

- Manual Sales Order items rehydrate a non-empty canonical server draft over any restored browser cart, while an empty draft remains available for unsaved catalog input until the explicit save command.
- Pure `LOGISTICS` sessions land on Dispatch Orders instead of the Warehouse dashboard, preserving the backend permission boundary while making the operational role explicit.

### Boundary

- `COMPANY_OWNER`, `SALES`, `WAREHOUSE` and `LOGISTICS`/Dispatch remain the canonical internal roles.
- `BOM` remains OPEN/DEFERRED; no role, endpoint or domain model is invented.

### Validation

- Role landing and navigation unit tests cover the separated Dispatch area and the absence of a BOM role.
- Live role E2E remains credential-dependent; the existing pure `COMPANY_OWNER` fixture gap is documented separately.

## [0.17.0] - 2026-08-28

Server-backed Sales and role-separated operations preparation.

### Added

- Reconciled Manual Sales Order item state from the canonical server draft after the items mutation, preserving server-authoritative prices, availability and versioned values.
- Added explicit authenticated E2E assertions for manual draft creation and item replacement against the existing API contract.
- Added executable coverage for the canonical internal work areas: `COMPANY_OWNER`, `SALES`, `WAREHOUSE` and `LOGISTICS`/Dispatch.

### Changed

- Kept Platform navigation and area selection permission-backed, with the backend session remaining the authority for visibility and route access.
- Prepared the next role-oriented increment without introducing a non-canonical `DISPATCH` or `BOM` role.

### Boundary

- `BOM` remains OPEN/DEFERRED: the current Blueprint/API baseline exposes no canonical role, endpoint or domain model, so this release does not invent one.
- API, Blueprint, Design Lab and legacy repositories were not modified by this frontend release.

### Validation

- Platform unit tests passed: 165 tests across 81 files.
- Platform production build passed; existing bundle/style budget warnings remain non-blocking.
- Live Sales manual-order E2E passed against the Docker API.
- The full role matrix passed 7/8 cases; the pure `COMPANY_OWNER` credential is not currently seeded consistently by the local API bootstrap and remains an environment fixture gap.

## [0.16.0] - 2026-08-28

Server-backed executive projections and permission-aware operational surfaces.

### Added

- Company Owner executive overview composed from the existing Sales, Client Account, Warehouse, Dispatch and change-feed ports.
- Effective-permission checks that keep Warehouse and Dispatch projections unavailable unless the authenticated session grants `warehouse:read` or `logistics:read`.
- Explicit role preparation for `COMPANY_OWNER`, `SALES`, `WAREHOUSE` and `LOGISTICS`/Dispatch without creating a non-canonical Dispatch role.

### Changed

- Replaced static Company Owner “Read-only” cards with live server totals and operational indicators.
- Added live recent activity from the authorized workspace change-feed.

### Boundary

- BOM remains OPEN/DEFERRED: no canonical role, API endpoint or domain model exists yet, so no contract was invented.
- API and Blueprint repositories were not changed; the existing API contracts were sufficient for this frontend composition.

### Validation

- Focused Company Owner facade tests passed (3/3).
- Bounded-context, i18n and diff checks are required before publication.

## [0.15.0] - 2026-08-28

IAM and Sales flow hardening for the canonical frontend boundaries.

### Added

- Workspace preview and recognized-tenant gating before Platform and Portal credentials are submitted.
- Explicit two-factor challenge boundary in both frontends, with deterministic mock verification and an API-mode capability error when the backend contract does not expose a second-factor endpoint.
- Canonical six-step organization registration in Platform: company, operation, location, administrator, workspace and review.
- Google Maps direction adapter behind the BC-04 application port, using server route snapshots and coordinates without coupling the domain to a provider SDK.
- Design provenance synchronized to Nexa Design Lab v1.0.2 with source-checked consumer tokens.
- Quantity controls and catalog-based subtotal preview for manual Sales orders.
- Catalog-owned cart shared by operational Catalog and manual-order Items, with draft-aware return navigation and an empty-cart handoff to Catalog.
- Capability-scoped Sales mock navigation and embedded Google Maps route preview in the manual-order review.

### Changed

- Corrected the manual-order route guard for the API/mock availability vocabularies and the `DELIVERY_COMPLETE` transition.
- Kept password recovery behind the existing unauthenticated API boundary for both surfaces; no email delivery implementation was invented in the frontend.

### Validation

- Platform: 161 unit tests across 80 files; bounded-context, catalog-asset and Design Lab foundation validators passed.
- Portal: 113 unit tests across 58 files; bounded-context, catalog-asset and Design Lab foundation validators passed.
- Platform and Portal production builds passed within their configured warning/error budgets.
- Production dependency audits reported zero vulnerabilities.
- Browser evidence: ICISA workspace preview, Platform 2FA mock login, catalog-backed manual order through route review, embedded Google Maps and zero console errors.

### Boundary

- No API, Blueprint canonical definition or Vue source was changed.
- Platform registration currently submits the existing minimal API contract; richer Vue-parity fields are validated and reviewed in the frontend but are not persisted until the API contract supports them.
- API mode remains the default. Mock state is in-memory and does not claim backend persistence, email delivery or production 2FA.
- Blueprint marks detailed Web acceptance criteria as pending; this release does not claim 100% of those pending criteria.

## [0.14.0] - 2026-08-26

Runtime mock slices for generic and ICISA tenant profiles across the canonical frontend boundaries.

### Added

- Runtime-selectable `api` and local `mock` modes with deterministic `generic` and `icisa` fixtures.
- Mock adapters behind application ports across BC-01 through BC-10, plus the
  local BC-11 audit/change-feed projection: tenant administration, catalog
  management, inventory, fulfillment, payments, documents and notifications
  are available in the offline demo.
- Offline no-op change-feed adapters for mock mode; the existing SSE stream remains the API-mode adapter.
- Functional baseline and mock-mode documentation for the executable Platform
  slices.

### Changed

- Preserved REST contracts and existing navigation while making the first Platform commercial flows executable without the API.
- Kept tenant profile selection in runtime configuration and infrastructure composition, outside the domain layer.
- Adjusted production bundle budgets to account for the explicitly included mock adapter baseline.

### Validation

- Bounded-context, catalog-asset and Design Lab foundation validators passed.
- 156 unit tests passed across 78 test files.
- Angular production build passed with an `853.29 kB` initial bundle and no budget warning under the `880 kB` warning / `920 kB` error budgets.
- Production dependency audit reported zero vulnerabilities; `git diff --check` passed.

### Boundary

- No API endpoints, API contracts or Blueprint canonical definitions were changed.
- Mock state is in-memory and intentionally does not simulate backend
  persistence, authorization, jobs or webhooks.
- This remains a PRE-V1 functional foundation; it does not claim complete product migration or Production Readiness.

## [0.13.0] - 2026-08-26

Canonical bounded-context layering and Angular composition release for the internal operations workspace.

### Added

- Canonical direct bounded-context roots aligned with the API vocabulary, each with explicit `application`, `domain`, `infrastructure` and `presentation` layers.
- Executable bounded-context validation for the eleven canonical contexts, layer direction, legacy-root removal and framework-free domain code.
- An application boundary for change-feed consumption so operational contexts do not import infrastructure clients directly.

### Changed

- Reorganized implemented Platform features under their canonical bounded contexts while preserving routes and REST contracts.
- Kept cross-context collaboration explicit through application-facing ports and adapters.
- Corrected the translation asset loader path so public routes resolve language files in the browser.

### Validation

- Bounded-context, catalog-asset and Design Lab foundation validators passed.
- 131 unit tests passed across 67 test files.
- TypeScript no-emit compilation and Angular production build passed.
- `git diff --check` passed.

### Boundary

- No API endpoints, API contracts or Blueprint canonical definitions were changed by this release.
- This remains a PRE-V1 architecture release; it does not claim complete product migration or Production Readiness.

## [0.12.0] - 2026-08-23

Visual and interaction convergence baseline using Nexa Design Lab (v1.0.1) tokens and components.

### Added

- Added standardized standalone presentation primitives: `nexa-numeric-stepper`, `nexa-segmented-control`, `nexa-surface`, and `nexa-button`.
- Integrated `nexa-segmented-control` across Company Administration section tabs.
- Added comprehensive unit tests for all new presentation components (`128/128 tests passing`).

### Changed

- Updated Logistics Dispatch Board and Stock Movements views with semantic Design Lab tokens.
- Bumped workspace package baseline to `0.12.0`.

### Validation

- Unit tests (`100% PASS`), Design Lab v1.0.1 token checksum validation (`PASS`), catalog asset validation (`PASS`), and production build (`PASS`).

## [0.11.0] - 2026-08-23

PRE-V1 Architecture & Governance Foundation release for the internal Angular operations workspace.

### Added

- Customer & Buyer Relationships feature boundary separation, distinct from legacy commercial client views.
- Sales Commitment feature boundary alignment reflecting explicit commercial commitment responsibilities.
- Updated Tenant and Workspace governance UX enforcing single operational workspace and exactly-one Company Owner model.
- Workforce team invitation and role assignment controls aligned with V1 capability model.
- Nexa Design Lab v1.0.1 design token integration and accessibility foundation enhancements.

### Changed

- Realigned domain facades and presentation layers to respect frozen Bounded Context boundaries.
- Hardened role-access route guards and operational navigation.

### Known limitations

- This milestone does not represent Nexa V1 functional completion or Production Readiness.

### Validation

- Catalog asset validation passed.
- Design Lab token and foundation validation passed.
- 124 unit tests passed across 60 test suites.
- Angular production build succeeded.

## [0.10.0] - 2026-08-22

Functional convergence continuation baseline for the internal Angular operations workspace.

### Added

- Integrated the current platform work with the consolidated Angular dependency baseline.
- Preserved the implemented Sales, Warehouse and Logistics boundaries and their tenant-safe operational navigation.

### Validation

- Catalog asset validation, tests, production build and CI gates passed.

## [0.7.1] - 2026-08-18

Operations release stabilization for the internal Angular workspace.
