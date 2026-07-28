<div align="center">

<img src="./docs/assets/nexa.svg" alt="Nexa Logo" width="250"/>

# Nexa Platform

Internal operations workspace for Nexa Suite's cold-chain organization.

[![Angular 22](https://img.shields.io/badge/Angular-22-DD0031?logo=angular&logoColor=white)](https://angular.dev/) [![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Angular Material](https://img.shields.io/badge/Angular%20Material-22-757575?logo=materialdesign&logoColor=white)](https://material.angular.dev/)

[Changelog](./CHANGELOG.md) · [v0.2.0 release notes](./docs/releases/v0.2.0.md) · [GitHub Releases](https://github.com/nexa-suite/platform/releases)

[Platform](https://github.com/nexa-suite/platform) · [Portal](https://github.com/nexa-suite/portal) · [API](https://github.com/nexa-suite/api)

</div>

---

## Overview

Nexa Platform is the independent Angular application for internal sales, warehouse, logistics and administration workflows.

## Role in the Nexa Ecosystem

Platform is the internal operations surface and remains separate from the buyer-facing Portal. Both consume the API only through approved contracts.

## Repository Map

| Repository | Responsibility | Technology |
|---|---|---|
| **Platform** — This repository | Internal operations | Angular |
| [Portal](https://github.com/nexa-suite/portal) | Buyer-facing B2B experience | Angular |
| [API](https://github.com/nexa-suite/api) | Business and integration API | Spring Boot |

## Scope

- Durable internal shell with `/overview` routing.
- Reusable visual foundations, EN/ES language infrastructure and pure utilities.
- Canonical catalog asset subset under `public/catalog-items/`.
- No catalog JSON, catalog REST, authentication, persistence or business use cases.

## Architecture

Presentation depends on Application. Application depends on Domain. Infrastructure remains outside Domain. Shared components are context-independent and visual.

## Bounded Contexts

Shared, IAM, Tenant Management, Catalog Management, Sales, Warehouse, Logistics and Invoicing remain represented as independent layers for future approved slices.

## Tech Stack

Angular 22, TypeScript strict mode, Angular Material/CDK 22, Signals, RxJS, ngx-translate 18, SCSS and npm.

## Getting Started

```bash
npm ci
npm start
```

Open [http://localhost:4200](http://localhost:4200).

## Available Commands

```bash
npm run validate:catalog-assets
npm test
npm run build
```

## Project Structure

```text
src/app/core/                         # Shell, routes and language service
src/app/shared/presentation/components # Reusable visual components
src/app/shared/application/utilities   # Pure address, date and number utilities
public/catalog-items/                  # Manifest-validated canonical media subset
src/styles/                            # Tokens, typography, motion, Material and a11y
docs/releases/                        # Versioned release notes
```

## Current Status

v0.2.0 provides the durable Platform shell, `/overview` route, shared visual foundations, normalized tokens, EN/ES switching, pure utilities, and 50 canonical catalog assets. It does not claim business capability or production integration.

## Out of Scope

Authentication, API integration, catalog pages, orders, requests, persistence, deployment and complete Vue parity.

## Roadmap

Future vertical slices require explicit contracts, identity, tenant rules and runtime/browser evidence.
