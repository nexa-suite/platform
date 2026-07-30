# Changelog

All notable changes to this project are documented in this file.
The project uses Semantic Versioning.

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

[Unreleased]: https://github.com/nexa-suite/platform/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/nexa-suite/platform/compare/v0.3.0...v0.5.0
[0.3.0]: https://github.com/nexa-suite/platform/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/nexa-suite/platform/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/nexa-suite/platform/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/nexa-suite/platform/releases/tag/v0.1.0
