<div align="center">

<img src="./docs/assets/nexa.svg" alt="Nexa Logo" width="250"/>

# Nexa Platform

Internal operations workspace for Sales, Warehouse, Logistics, Company Ownership and Administration.

[![Angular 22](https://img.shields.io/badge/Angular-22-DD0031?style=flat-square&logo=angular&logoColor=white)](https://angular.dev/) [![TypeScript strict](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Angular Material 22](https://img.shields.io/badge/Angular%20Material-22-757575?style=flat-square&logo=materialdesign&logoColor=white)](https://material.angular.dev/) [![Release v0.2.1](https://img.shields.io/badge/release-v0.2.1-2563EB?style=flat-square)](https://github.com/nexa-suite/platform/releases/tag/v0.2.1)

[Changelog](./CHANGELOG.md) · [Release notes](./docs/releases/) · [Contributing](./.github/CONTRIBUTING.md) · [Security](./.github/SECURITY.md)

**Current repository:** Platform · **Current release:** `v0.2.1`

[Website](https://github.com/nexa-suite/website) · [Platform](https://github.com/nexa-suite/platform) · [Portal](https://github.com/nexa-suite/portal) · [API](https://github.com/nexa-suite/api) · [Mobile](https://github.com/nexa-suite/mobile)

</div>

---

## What is implemented

`v0.2.1` is a repository experience and governance release. The current application is an Angular 22 shell with the `/overview` route, reusable presentation components, EN/ES language support, catalog asset validation and focused tests.

Platform is the internal experience, not the buyer-facing product and not the security authority. Business workflows, API integration, authentication, authorization, tenant management, persistence and production deployment are not implemented in this release.

## Product boundaries

```mermaid
flowchart LR
    Website["Website<br/>Static public site<br/>v0.1.0"]
    Platform["Platform<br/>Angular shell /overview<br/>v0.2.1"]
    Portal["Buyer Portal<br/>Angular shell /home<br/>v0.2.1"]
    API["API<br/>Spring Boot foundation<br/>v0.3.0"]

    Website -. "product navigation" .-> Platform
    Website -. "product navigation" .-> Portal
    Platform -. "future approved HTTP contract" .-> API
    Portal -. "future approved HTTP contract" .-> API
```

The dotted links are boundaries for future approved contracts, not evidence of current API integration. Mobile is not implemented and is intentionally absent from the runtime map. PostgreSQL, AI, IoT and cloud services are not implemented in this release.

![Nexa Suite repository map](./docs/assets/repository-map/nexa-suite-map.svg)

## Repository map

| Repository | Current release | Responsibility | Evidence status |
|---|---:|---|---|
| [Website](https://github.com/nexa-suite/website) | `v0.1.0` | Static public product discovery | Released static site |
| **Platform** | **`v0.2.1`** | Internal operations shell | Angular `/overview` shell |
| [Portal](https://github.com/nexa-suite/portal) | `v0.2.1` | Buyer self-service shell | Angular `/home` shell |
| [API](https://github.com/nexa-suite/api) | `v0.3.0` | Business and integration authority | Catalog domain foundation |
| [Mobile](https://github.com/nexa-suite/mobile) | `v0.1.0` | Future native clients | Documentation-only |

## Bounded contexts

| Area | Current maturity |
|---|---|
| IAM | Foundation shell / implementation planned |
| Tenant Management | Foundation shell / implementation planned |
| Catalog Management | Foundation shell / API foundation exists |
| Sales | Planned |
| Warehouse | Planned |
| Logistics | Planned |
| Invoicing | Planned |

## Architecture

Presentation depends on Application. Application depends on Domain. Infrastructure remains outside Domain. Frontend models and API adapters require an approved vertical slice and an explicit contract; the Platform shell does not own backend business rules.

## Tech stack

Angular 22, TypeScript strict mode, Angular Material/CDK 22, Signals, RxJS, `ngx-translate` 18, SCSS and npm 11.17.0 as declared by `package.json`.

## Getting started

```bash
npm ci
npm start
```

Open [http://localhost:4200](http://localhost:4200) and navigate to `/overview`.

## Available commands

```bash
npm run validate:catalog-assets
npm test
npm run build
```

## Project structure

```text
src/app/core/                                      # Shell, routes and language service
src/app/shared/presentation/components/            # Reusable visual components
src/app/shared/application/utilities/              # Pure address, date and number utilities
public/catalog-items/                              # Manifest-validated canonical media subset
src/styles/                                        # Tokens, typography, motion, Material and a11y
docs/assets/repository-map/                         # Local architecture map
docs/releases/                                      # Versioned release notes
```

## Documentation

- [Release notes index](./docs/releases/)
- [Release policy](./.github/RELEASE_POLICY.md)

## Roadmap boundary

Future vertical slices require explicit contracts, identity, tenant rules and runtime/browser evidence. Planned database, AI, IoT, cloud and mobile capabilities must not be described as Platform implementation until those gates pass.
