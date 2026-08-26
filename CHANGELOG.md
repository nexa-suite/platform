# Changelog

All notable changes to this project are documented in this file.
The project uses Semantic Versioning.

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
