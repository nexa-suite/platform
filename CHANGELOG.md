# Changelog

All notable changes to this project are documented in this file.
The project uses Semantic Versioning.

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
