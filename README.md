<div align="center">

<br />

# Nexa Platform

**Internal operational workspace for Nexa tenant teams.**

![Angular 22](https://img.shields.io/badge/Angular-22-DD0031?style=flat-square&logo=angular&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white) ![Angular Material](https://img.shields.io/badge/Angular%20Material-22-757575?style=flat-square&logo=materialdesign&logoColor=white) ![RxJS](https://img.shields.io/badge/RxJS-7.8-B7178C?style=flat-square&logo=reactivex&logoColor=white) ![Release](https://img.shields.io/github/v/release/nexa-suite/platform?display_name=tag&sort=semver&style=flat-square&label=release)

[Changelog](./CHANGELOG.md) · [Release notes](./docs/releases/) · [Contributing](./.github/CONTRIBUTING.md) · [Security](./.github/SECURITY.md)

</div>

---

## Overview

Angular secured surface for tenant administrators, company owners, business operations, sales, warehouse and dispatch teams. Platform presents operational workflows; API owns identity, tenant scope and business authority.

## Related repositories

The organization profile owns the full public ecosystem map. This repository links to adjacent Nexa surfaces without copying their release state.

- [Nexa API](https://github.com/nexa-suite/api) — business and integration backbone.
- [Nexa Buyer Portal](https://github.com/nexa-suite/portal) — buyer-facing experience.
- [Nexa Website](https://github.com/nexa-suite/website) — public product experience.
- [Nexa Mobile](https://github.com/nexa-suite/mobile) — documentation and native runway.

## Operational Areas

- Company administration and client accounts.
- Purchase Requests and Sales Orders.
- Catalog discovery and commercial workspaces.
- Warehouse and Logistics workflows.
- Role-specific route protection, loading, error and empty states.
- English and Spanish interface foundations.

This repository is not the buyer-facing product, security authority or persistence owner.

## Architecture

Standalone Angular application. The frontend follows the canonical 11-context set as API-aligned feature roots directly under [`src/app`](./src/app/README.md); the surface map is [`docs/architecture/bounded-context-map.md`](./docs/architecture/bounded-context-map.md). Shared presentation components, signals, route guards and API adapters stay separated by responsibility. Business rules and tenant authorization remain API contracts.

## Technology Stack

| Concern | Technology |
| --- | --- |
| Framework | Angular 22 |
| Language | TypeScript strict mode |
| Component system | Angular Material/CDK 22 |
| State and async | Signals and RxJS |
| Internationalization | ngx-translate 18 |
| Styling | SCSS |
| Package manager | npm |

## Getting Started

    npm ci
    npm start

Open http://localhost:4200.

## Validation

    npm run validate:catalog-assets
    npm run validate:bounded-contexts
    npm test
    npm run build

## Repository Structure

    src/app/<api-context>/                Canonical API-aligned BC feature roots
    src/app/core/                         Shell, routes and language service
    src/app/shared/presentation/         Reusable visual components
    src/app/shared/application/          Pure application utilities
    public/catalog-items/                Manifest-validated catalog media
    src/styles/                          Tokens, typography, Material and accessibility
    docs/                                 Architecture and releases

## Documentation

- [Release notes](./docs/releases/)
- [Release policy](./.github/RELEASE_POLICY.md)
- [Changelog](./CHANGELOG.md)


## Historical provenance

Earlier UPC repositories remain evidence only. They do not define current Nexa identity, implementation authority or TARGET architecture.

- [nexa-platform](https://github.com/upc-pre-202610-1asi0730-12242-king/nexa-platform) — predecessor backend and REST API layer.
- [nexa-webapp](https://github.com/upc-pre-202610-1asi0730-12242-king/nexa-webapp) — historical unified Vue application.
- [nexa-website](https://github.com/upc-pre-202610-1asi0730-12242-king/nexa-website) — previous public Website lineage.
- [nexa-ecosystem-report](https://github.com/upc-pre-202610-1asi0730-12242-king/nexa-ecosystem-report) — historical requirements and architecture evidence.


## Security

Do not report vulnerabilities through public issues. Follow the repository [Security Policy](./.github/SECURITY.md).

## Legal

Copyright © 2026 Nexa. All rights reserved. No open-source license is selected by this README.

<div align="center"><br />Nexa · Current product, explicit evidence boundaries</div>
