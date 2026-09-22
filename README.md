<div align="center">

<br />

<img src="./docs/assets/nexa.svg" alt="Nexa" width="240" />

# Nexa Platform

**Internal operational workspace for Nexa tenant teams.**

![Angular](https://img.shields.io/badge/Angular-22.1.7-DD0031?style=flat-square&logo=angular&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-6.0.3-3178C6?style=flat-square&logo=typescript&logoColor=white) ![Angular Material/CDK](https://img.shields.io/badge/Angular%20Material%2FCDK-22.1.7-757575?style=flat-square&logo=materialdesign&logoColor=white) ![RxJS](https://img.shields.io/badge/RxJS-7.8.2-B7178C?style=flat-square&logo=reactivex&logoColor=white) ![Latest Git tag](https://img.shields.io/github/v/tag/nexa-suite/platform?sort=semver&style=flat-square&label=latest%20Git%20tag)

[Application](./src/app) · [Architecture](./docs/architecture/bounded-context-map.md) · [Releases](./docs/releases/) · [Contributing](./.github/CONTRIBUTING.md) · [Security](./.github/SECURITY.md)

</div>

---

## Overview

Nexa Platform is the internal Angular workspace for tenant administrators,
company owners, business operations, sales, warehouse and dispatch teams. It
presents operational workflows; Nexa API owns identity, tenant scope,
authorization and business authority.

## Nexa Product Ecosystem

<table>
<tr>
<td width="50%" valign="top">

### [Nexa Mobile Report](https://github.com/nexa-suite/mobile-report)

Academic report and delivery evidence for Nexa Mobile.

![Markdown](https://img.shields.io/badge/Markdown-academic%20evidence-000000?style=flat-square&logo=markdown&logoColor=white)

</td>
<td width="50%" valign="top">

### [Nexa Mobile](https://github.com/nexa-suite/mobile)

Partial Operations Android/Kotlin/Jetpack Compose implementation evidence is
integrated in the current Mobile baseline, not a completed Mobile V1. Buyer
Mobile remains an accepted Flutter/Dart target.

![Operations Android](https://img.shields.io/badge/Operations%20Mobile-partial%20evidence-3DDC84?style=flat-square&logo=android&logoColor=white) ![Buyer target](https://img.shields.io/badge/Buyer%20Mobile-TARGET%20Flutter%2FDart-64748B?style=flat-square)

</td>
</tr>
<tr>
<td width="50%" valign="top">

### [Nexa API](https://github.com/nexa-suite/api)

Authoritative business and integration backbone for Nexa Suite.

![Java](https://img.shields.io/badge/Java-25-ED8B00?style=flat-square&logo=openjdk&logoColor=white) ![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1-6DB33F?style=flat-square&logo=springboot&logoColor=white)

</td>
<td width="50%" valign="top">

### [Nexa Website](https://github.com/nexa-suite/website)

Public product experience and acquisition entry point.

![HTML5](https://img.shields.io/badge/HTML5-static-E34F26?style=flat-square&logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-responsive-1572B6?style=flat-square&logo=css3&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-vanilla-F7DF1E?style=flat-square&logo=javascript&logoColor=black)

</td>
</tr>
<tr>
<td width="50%" valign="top">

### [Nexa Buyer Portal](https://github.com/nexa-suite/portal)

Buyer-facing Web experience for B2B purchasing and delivery visibility.

![Angular](https://img.shields.io/badge/Angular-22-DD0031?style=flat-square&logo=angular&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)

</td>
<td width="50%" valign="top">

### [Nexa Platform](https://github.com/nexa-suite/platform)

This repository: internal operational workspace.

![Angular](https://img.shields.io/badge/Angular-22-DD0031?style=flat-square&logo=angular&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)

</td>
</tr>
</table>

## Operational Areas

- Company administration and customer accounts.
- Purchase Requests and Sales Orders.
- Catalog discovery and commercial workspaces.
- Warehouse and Logistics workflows.
- Role-aware route protection, loading, empty, error and conflict states.
- English and Spanish interface foundations.

Platform is not the buyer-facing product, security authority or persistence
owner.

## Architecture Boundary

The standalone Angular application follows API-aligned feature roots under
[`src/app`](./src/app). The surface map is
[`docs/architecture/bounded-context-map.md`](./docs/architecture/bounded-context-map.md).
Shared presentation, signals, route guards and API adapters remain separated
by responsibility. Business rules and tenant authorization remain API
contracts.

## Technology Stack

| Concern | Current evidence |
| --- | --- |
| Framework | Angular 22.1.7 (locked) |
| Language | TypeScript 6.0.3 (locked), strict configuration |
| Component system | Angular Material/CDK 22.1.7 (locked) |
| State and async | Angular Signals and RxJS 7.8.2 (locked) |
| Internationalization | `@ngx-translate/core` 18.0.0 |
| Styling | SCSS |
| Package manager | npm |

## Getting Started

```bash
npm ci
npm start
```

Open `http://localhost:4200`.

## Validation

```bash
npm run validate:catalog-assets
npm run validate:design-foundations
npm run validate:bounded-contexts
npm test
npm run build
git diff --check
```

## Repository Structure

```text
src/app/<api-context>/       API-aligned feature roots
src/app/core/                Shell, routes and language service
src/app/shared/              Reusable presentation and application utilities
public/catalog-items/        Manifest-validated catalog media
src/styles/                  Tokens, typography, Material and accessibility
docs/                         Architecture and releases
```

## Ownership & Boundaries

- Platform owns operational presentation, navigation and recovery states.
- API owns authentication, authorization, tenant scope, business decisions and
  durable state.
- Angular feature roots do not create independent Domain or persistence
  authority.
- Accessibility and responsive behavior are part of client-quality evidence.

## Documentation

- [Architecture](./docs/architecture/bounded-context-map.md)
- [Release notes](./docs/releases/)
- [Release policy](./.github/RELEASE_POLICY.md)
- [Changelog](./CHANGELOG.md)

## Nexa Engineering & Documentation

<table>
<tr>
<td width="50%" valign="top">

### [Nexa Blueprint](https://github.com/nexa-suite/blueprint)

Canonical Product, Domain, Architecture, data, security and accepted
engineering decision source.

![Markdown](https://img.shields.io/badge/Markdown-canonical%20documentation-000000?style=flat-square&logo=markdown&logoColor=white)

</td>
<td width="50%" valign="top">

### [Nexa Web Report](https://github.com/nexa-suite/web-report)

Academic report and evidence repository for the Nexa Web course.

![Docs as Code](https://img.shields.io/badge/Docs%20as%20Code-academic%20evidence-64748B?style=flat-square)

</td>
</tr>
<tr>
<td width="50%" valign="top">

### [Nexa Complementary](https://github.com/nexa-suite/complementary)

Supporting references, reproducible engineering resources and shared tooling.

![Support tooling](https://img.shields.io/badge/Support%20tooling-reference-64748B?style=flat-square)

</td>
<td width="50%" valign="top">

### [Nexa Design Lab](https://github.com/nexa-suite/design-lab)

UX/UI, interaction, design-system, prototype and current design-evidence
workspace.

![Angular](https://img.shields.io/badge/Angular-22-DD0031?style=flat-square&logo=angular&logoColor=white)

</td>
</tr>
</table>

## Security

Follow the repository [Security Policy](./.github/SECURITY.md) for reporting
vulnerabilities.

## Legal

Copyright © 2026 Nexa. All rights reserved. No open-source license is claimed
by this README.

<div align="center"><br />Nexa · Internal operations, server authority</div>
