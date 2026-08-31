# Platform release notes

Release notes are scoped to the Platform repository and distinguish the Angular shell from future internal workflows.

| Release | Summary |
|---|---|
| [v0.26.0](./v0.26.0.md) | Production API-only adapter composition |
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
| [UNRELEASED HISTORICAL CANDIDATE: v0.14.0](./v0.14.0.md) | Implementation evidence only; no tag or GitHub Release |
| Historical snapshots: v0.15.0-v0.25.0 | Consolidated into v0.26.0; commits remain reachable, refs are not retained |

Unindexed files under `docs/releases/` preserve historical evidence only; they do
not define the retained public release set.

Current retained release is `0.26.0`. Platform visual/interaction parity work covers the
API-backed B2B client, catalog, warehouse, lots, reservations, movements,
profile, business documents and operational analytics surfaces. This release
removes fixture adapters from the production provider graph while keeping them
isolated to tests. Company Owner, Sales, Warehouse and Logistics/Dispatch remain
separated by effective permissions. BOM remains OPEN/DEFERRED pending an
accepted Product, Blueprint and API contract. This is a stable incremental
release, not a claim of full product migration or 100% pixel parity with Vue.
