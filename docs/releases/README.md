# Platform release notes

Release notes are scoped to the Platform repository and distinguish the Angular shell from future internal workflows.

| Release | Summary |
|---|---|
| [v0.26.0](./v0.26.0.md) | Production API-only adapter composition |
| [v0.25.0](./v0.25.0.md) | API-backed operational analytics evidence and API-only runtime |
| [v0.24.0](./v0.24.0.md) | Operational role personas and readable inventory lots |
| [v0.22.0](./v0.22.0.md) | Design Lab visual parity and API-backed operational surfaces |
| [v0.21.0](./v0.21.0.md) | Sales dashboard API-source recovery and retryable partial states |
| [v0.20.0](./v0.20.0.md) | Role-separated API projections and explicit partial-source recovery |
| [v0.19.0](./v0.19.0.md) | API-backed role continuity and explicit partial-data states |
| [v0.16.0](./v0.16.0.md) | Live Company Owner projections and permission-aware role surfaces |
| [v0.15.0](./v0.15.0.md) | IAM, catalog-backed manual Sales flow and route preview |
| [v0.14.0](./v0.14.0.md) | Runtime mock slices for generic and ICISA tenants |
| [v0.13.0](./v0.13.0.md) | Canonical bounded-context layering and Angular composition |
| [v0.12.0](./v0.12.0.md) | Visual and interaction convergence baseline |
| [v0.11.0](./v0.11.0.md) | PRE-V1 Architecture & Governance Foundation operations baseline |
| [v0.10.0](./v0.10.0.md) | Functional convergence continuation operations baseline |
| [v0.7.1](./v0.7.1.md) | Operations workspace stabilization |
| [v0.7.0](./v0.7.0.md) | Consolidated Warehouse and Logistics operations workspace |
| [v0.5.0](./v0.5.0.md) | Platform access, Company Administration and commercial operations |
| [v0.3.0](./v0.3.0.md) | Docker runtime, repository foundation and browser smoke |
| [v0.2.1](./v0.2.1.md) | Repository experience and governance update |
| [v0.2.0](./v0.2.0.md) | Responsive shell, shared UI foundations and catalog assets |
| [v0.1.0](./v0.1.0.md) | Initial Angular repository baseline |

## Curated presentation sequence

The following five labels are a presentation index over the verified SemVer
history. They are not new tags, releases, or replacement versions; the
canonical SemVer provenance remains authoritative.

| Presentation label | Canonical tag | Verified milestone |
|---|---|---|
| Nexa Platform — Release 1 | `v0.1.0` | Initial Angular repository baseline |
| Nexa Platform — Release 2 | `v0.3.0` | Docker runtime, catalog assets, and browser smoke |
| Nexa Platform — Release 3 | `v0.7.0` | Consolidated Warehouse and Logistics operations workspace |
| Nexa Platform — Release 4 | `v0.12.0` | Design Lab visual and interaction convergence baseline |
| Nexa Platform — Release 5 | `v0.26.0` | API-only production composition and consolidated milestone |

The remaining retained releases (`v0.2.0`, `v0.2.1`, `v0.5.0`, `v0.7.1`,
`v0.10.0`, `v0.11.0`, and `v0.13.0`) remain valid intermediate evidence. They
are intentionally not presented as additional top-level milestones.

## Release-lineage classification

| Version | Classification | Original target | Reachable from retained `v0.26.0` | Meaning |
|---|---|---|---|---|
| `v0.4.0` | INTERNAL_PREPARATION_ONLY | — | — | Preparation commits only; no public tag or GitHub Release. |
| `v0.6.0` | INTERNAL_PREPARATION_ONLY | — | — | Feature/preparation evidence only; no public tag or GitHub Release. |
| `v0.8.0` | NEVER_PUBLISHED | — | — | No public tag, GitHub Release or release evidence found. |
| `v0.9.0` | NEVER_PUBLISHED | — | — | No public tag, GitHub Release or release evidence found. |
| `v0.14.0` | INTERNAL_PREPARATION_ONLY | — | — | Release document and implementation evidence exist; no public tag or GitHub Release. |
| `v0.15.0` | RETIRED_DURING_AUTHORIZED_CONSOLIDATION | `1891235bca7be13dfc10683c009f1d73fef3e02e` | YES | Former public snapshot; ref retired into retained `v0.26.0`. |
| `v0.16.0` | RETIRED_DURING_AUTHORIZED_CONSOLIDATION | `836556209f302c390b4bcb45ed9f9528acd5cfcf` | YES | Former public snapshot; ref retired into retained `v0.26.0`. |
| `v0.17.0` | RETIRED_DURING_AUTHORIZED_CONSOLIDATION | `196025e5ae43f971d45ac5d1e71c73222ceb7d65` | YES | Former public snapshot; ref retired into retained `v0.26.0`. |
| `v0.18.0` | RETIRED_DURING_AUTHORIZED_CONSOLIDATION | `3651cc58e18f0dcec011e89fbeb7bdb41ea7b719` | YES | Former public snapshot; ref retired into retained `v0.26.0`. |
| `v0.19.0` | RETIRED_DURING_AUTHORIZED_CONSOLIDATION | `8ba1213593fc02500b9bc2013af6406f86273c06` | YES | Former public snapshot; ref retired into retained `v0.26.0`. |
| `v0.20.0` | RETIRED_DURING_AUTHORIZED_CONSOLIDATION | `65a85779b7b5d7975532b2027c2c44f7112d2109` | YES | Former public snapshot; ref retired into retained `v0.26.0`. |
| `v0.21.0` | RETIRED_DURING_AUTHORIZED_CONSOLIDATION | `e516f88683725383f1c06dbfa546c2913edb41cc` | YES | Former public snapshot; ref retired into retained `v0.26.0`. |
| `v0.22.0` | RETIRED_DURING_AUTHORIZED_CONSOLIDATION | `1d7548281517d11b5110b008f16bf5c401029443` | YES | Former public snapshot; ref retired into retained `v0.26.0`. |
| `v0.23.0` | RETIRED_DURING_AUTHORIZED_CONSOLIDATION | `95f3fcbbb86c5b6de3190523ead3c46fb71e9682` | YES | Former public snapshot; ref retired into retained `v0.26.0`. |
| `v0.24.0` | RETIRED_DURING_AUTHORIZED_CONSOLIDATION | `c124a97f2565666b7041d43f8ab203000d0e73b5` | YES | Former public snapshot; ref retired into retained `v0.26.0`. |
| `v0.25.0` | RETIRED_DURING_AUTHORIZED_CONSOLIDATION | `a9a4b673e80020a74c8ab63b3dafa1e1a48d013d` | YES | Former public snapshot; ref retired into retained `v0.26.0`. |

`v0.26.0` is the retained `PUBLISHED` consolidated milestone. Its version
number remains intentionally unchanged; no missing number is restored.

## Historical material

| Draft | Status |
|---|---|
| [UNRELEASED HISTORICAL CANDIDATE: v0.6.0](./v0.6.0.md) | Consolidated into later published work; no tag or GitHub Release |

Current release is `0.26.0`. Platform visual/interaction parity work covers the
API-backed B2B client, catalog, warehouse, lots, reservations, movements,
profile, business documents and operational analytics surfaces. This release
removes fixture adapters from the production provider graph while keeping them
isolated to tests. Company Owner, Sales, Warehouse and Logistics/Dispatch remain
separated by effective permissions. BOM remains OPEN/DEFERRED pending an
accepted Product, Blueprint and API contract. This is a stable incremental
release, not a claim of full product migration or 100% pixel parity with Vue.
