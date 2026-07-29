# Changelog

All notable changes to this project are documented in this file.
The project uses Semantic Versioning.

## [Unreleased]

### Documentation

- Aligned the README, suite map and runtime diagram with the tagged `v0.2.1` Angular shell.
- Kept broader persistence, AI, IoT, cloud and mobile scope explicit while documenting the secured IAM, workspace and Catalog read slice.
- Added a local repository map and a release-notes index.

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

## [0.4.0] - 2026-07-28

### Added

- Platform sign-in, memory-only session restoration and internal-role route enforcement.
- Secured Product Catalog routes with URL-synchronized query state and explicit error/retry states.
- Integrated `/api/v1/authentication/*`, `/api/v1/session` and secured Catalog read requests.

### Security

- Platform surface accepts internal roles only; Buyer membership is rejected.
- Browser storage is not used for access or refresh tokens.

[Unreleased]: https://github.com/nexa-suite/platform/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/nexa-suite/platform/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/nexa-suite/platform/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/nexa-suite/platform/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/nexa-suite/platform/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/nexa-suite/platform/releases/tag/v0.1.0
