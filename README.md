<div align="center">

<img src="./docs/assets/nexa.svg" alt="Nexa" width="220" />

# Nexa Platform

**Internal operational workspace for Nexa tenant teams.**

[![Angular 22](https://img.shields.io/badge/Angular-22-DD0031?style=flat-square&logo=angular&logoColor=white)](https://angular.dev/) [![TypeScript strict](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Angular Material 22](https://img.shields.io/badge/Angular%20Material-22-757575?style=flat-square&logo=materialdesign&logoColor=white)](https://material.angular.dev/) [![Release](https://img.shields.io/github/v/release/nexa-suite/platform?style=flat-square&label=release)](https://github.com/nexa-suite/platform/releases)

[Changelog](./CHANGELOG.md) · [Release notes](./docs/releases/) · [Contributing](./.github/CONTRIBUTING.md) · [Security](./.github/SECURITY.md)

</div>

---

## Overview

Angular secured surface for tenant administrators, company owners, business operations, sales, warehouse and dispatch teams. Platform presents operational workflows; API owns identity, tenant scope and business authority.

## Operational areas

- Company administration and client accounts.
- Purchase Requests and Sales Orders.
- Catalog discovery and commercial workspaces.
- Warehouse and Logistics workflows.
- Role-specific route protection, loading, error and empty states.
- English and Spanish interface foundations.

This repository is not the buyer-facing product, security authority or persistence owner.

## Nexa Product Ecosystem

<table>
<tr><td><a href="https://github.com/nexa-suite/website"><strong>Nexa Website</strong></a><br />Public product discovery.<br /><img src="https://img.shields.io/github/v/release/nexa-suite/website?style=flat-square&label=release" alt="Website release" /></td><td><strong>Nexa Platform</strong><br />This repository. Internal operational workspace.<br /><img src="https://img.shields.io/github/v/release/nexa-suite/platform?style=flat-square&label=release" alt="Platform release" /></td></tr>
<tr><td><a href="https://github.com/nexa-suite/portal"><strong>Nexa Buyer Portal</strong></a><br />Buyer-facing business experience.<br /><img src="https://img.shields.io/github/v/release/nexa-suite/portal?style=flat-square&label=release" alt="Portal release" /></td><td><a href="https://github.com/nexa-suite/api"><strong>Nexa API</strong></a><br />Business and integration authority.<br /><img src="https://img.shields.io/github/v/release/nexa-suite/api?style=flat-square&label=release" alt="API release" /></td></tr>
<tr><td colspan="2"><a href="https://github.com/nexa-suite/mobile"><strong>Nexa Mobile</strong></a><br />Architecture runway for future native clients.<br /><img src="https://img.shields.io/github/v/release/nexa-suite/mobile?style=flat-square&label=release" alt="Mobile release" /></td></tr>
</table>

## Architecture

Standalone Angular application. Shared presentation components, signals, route guards and API adapters stay separated by responsibility. Business rules and tenant authorization remain API contracts.

## Technology

Angular 22, TypeScript strict mode, Angular Material/CDK 22, Signals, RxJS, ngx-translate, SCSS and npm.

## Getting started

    npm ci
    npm start

Open http://localhost:4200.

## Validation

    npm run validate:catalog-assets
    npm test
    npm run build

## Repository structure

    src/app/core/                         Shell, routes and language service
    src/app/shared/presentation/         Reusable visual components
    src/app/shared/application/          Pure application utilities
    public/catalog-items/                Manifest-validated catalog media
    src/styles/                           Tokens, typography, Material and accessibility
    docs/                                 Architecture and releases

## Documentation

- [Release notes](./docs/releases/)
- [Release policy](./.github/RELEASE_POLICY.md)
- [Changelog](./CHANGELOG.md)

## Security

Do not report vulnerabilities through public issues. Follow the [Security Policy](./.github/SECURITY.md).

## Legal

Copyright © 2026 Nexa. All rights reserved. No open-source license is selected by this README.

<div align="center"><br />Nexa · Operations with a clear line to business authority</div>
