# Platform release notes

Release notes are scoped to the Platform repository and distinguish the Angular shell from future internal workflows.

| Release | Summary |
|---|---|
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

## Historical material

| Draft | Status |
|---|---|
| [UNRELEASED HISTORICAL CANDIDATE: v0.6.0](./v0.6.0.md) | Consolidated into later published work; no tag or GitHub Release |

Current release is `0.21.0`. Company Owner, Sales, Warehouse and
Logistics/Dispatch remain separated by effective permissions, and operational
dashboards now load only the projections belonging to their primary role while
preserving successful API data during partial failures. The Sales dashboard
also makes supporting API failures explicit and retryable. BOM remains
OPEN/DEFERRED pending an accepted Product, Blueprint and API contract. This
does not claim full product migration or pixel-level parity with Vue.
