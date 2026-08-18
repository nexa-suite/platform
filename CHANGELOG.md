# Changelog

All notable changes to this project are documented in this file.
The project uses Semantic Versioning.

## Unreleased

No unreleased changes are included in this baseline.

## [0.7.1] - 2026-08-18

Operations release stabilization for the internal Angular workspace.

### Added

- Real server-backed Sales Dashboard metrics, recent resources and working links.
- Dedicated role-route and operations-state coverage for the stabilized surface.

### Changed

- Operations navigation and i18n now expose only implemented Sales, Warehouse and Logistics workflows.
- Duplicate workspace artifacts and generated browser outputs are ignored and removed.

Structural parity with Vue is not claimed.

## [0.7.0] - 2026-07-31

This release consolidates the previously unpublished TASK-NEXA-008, TASK-NEXA-008.6, TASK-NEXA-009, TASK-NEXA-010 and TASK-NEXA-010.5 work.

### Added

- Role-specific operations shell with Warehouse and Logistics workflows.
- Warehouse, Zone, Inbound, Lot, Adjustment, Waste, FEFO, Reservation and shortage/release interfaces.
- Dispatch Board, assignment, scheduling, route readiness, temperature/incidents, reprogramming, POD metadata and analytics.

### Security

- Owner, Sales, Warehouse and Logistics navigation and permissions are separated; Buyer access remains rejected by Platform guards.

## Previously unreleased candidate: 0.6.0

This candidate content was later consolidated into published `v0.7.0`; `v0.6.0` has no published tag or GitHub Release.

### Added

- Internal Sales Order list/detail, status timeline and fulfillment-readiness surfaces.
- Endpoint-specific commercial filters, event mapping and secure change-feed reconnect behavior.
- Platform CI, CodeQL and Dependabot configuration.

### Security

- Buyer access remains rejected by Platform guards; Sales Order mutations are not exposed to Buyer UI.
- Change-feed sessions disconnect on logout and retry only through the authenticated refresh path.

## [0.5.0] - 2026-07-30

This release consolidates previously unreleased Identity, tenant, security and commercial vertical work. Intermediate planned versions were never published.

### Added

- Authentication and protected internal access, Product Catalog, Company Administration, Client Accounts and Purchase Request operations.
- Lazy feature loading, structural Vue parity improvements, bundle consolidation and focused tests.

### Security

- Platform accepts internal roles only; Buyer membership is rejected; browser storage is not used for access or refresh tokens.

## [0.3.0] - 2026-07-28

### Added

- Production Dockerfile, Nginx SPA fallback and healthcheck.
- Modern Compose runtime integration on port `4200`.
- Runtime/browser smoke validation for `/overview`.

### Changed

- Versioned repository baseline as `v0.3.0` before the approved secured API vertical slice.

## [0.2.1] - 2026-07-28

### Changed

- Redesigned the repository README around the five-product Nexa Suite.
- Standardized repository governance and release documentation.
- Corrected repository metadata and navigation.

### Fixed

- Removed verified duplicate local artifacts.

## [0.2.0] - 2026-07-28

### Added

- Durable Platform shell and `/overview` route with responsive navigation and skip link.
- Reusable visual components, language switching, pure formatting utilities and shared tests.
- Normalized SCSS token layers and Angular Material 22 theme integration.
- 50 canonical catalog media assets with checksummed manifest and validation script.

### Changed

- Removed technical architecture messaging from the application surface.

## [0.1.0] - 2026-07-28

### Added

- Independent Angular 22 Platform application with bounded-context package structure, initial shell and EN/ES translation surface.

[Unreleased]: https://github.com/nexa-suite/platform/compare/v0.7.0...HEAD
[0.7.0]: https://github.com/nexa-suite/platform/compare/v0.5.0...v0.7.0
[0.6.0]: https://github.com/nexa-suite/platform/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/nexa-suite/platform/compare/v0.3.0...v0.5.0
[0.3.0]: https://github.com/nexa-suite/platform/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/nexa-suite/platform/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/nexa-suite/platform/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/nexa-suite/platform/releases/tag/v0.1.0
