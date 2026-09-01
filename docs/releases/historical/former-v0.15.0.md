# HISTORICAL RELEASE RECORD — FORMER PUBLIC LABEL v0.15.0 — NOT A CURRENT RELEASE

Release record for IAM, organization onboarding and manual Sales
workflow hardening over the canonical bounded contexts.

## Included

- BC-01 workspace preview, recognized-workspace gating, explicit two-factor
  challenge handling and the existing password-recovery boundary.
- Platform organization registration aligned to the Vue reference's six
  canonical steps: Company, Operation, Location, Administrator, Workspace and
  Review.
- BC-04 manual Sales order flow with client, catalog lines, quantity controls,
  catalog subtotal preview, delivery selection, server route snapshot and
  Sales Order creation.
- Shared catalog cart behavior: the manual-order Items step consumes products
  selected in the operational Catalog, preserves the draft context and routes
  an empty cart back to Catalog instead of rendering a second product selector.
- BC-04 Google Maps direction adapter behind a domain port; no provider SDK or
  API key is required for the external route link or the embedded route map.
- Mock Sales navigation is narrowed to the capabilities granted by the local
  Sales fixture; warehouse and administration sections are not exposed.
- Deterministic ICISA/generic mock credentials and challenge codes for local
  browser verification.
- Design provenance synchronized to Nexa Design Lab `v1.0.2` (`main`, commit
  `04e2e4e`), with the consumer token checks bound to that source.

## Explicit boundary

No API, Blueprint or Vue source changed. Platform registration validates and
reviews the complete onboarding information from the canonical reference, but
the current direct API contract persists only its supported organization,
operation, location, administrator, workspace, plan and terms fields. The
remaining rich fields stay frontend-only until that contract is expanded.

API mode remains the default. Mock sessions are in-memory. Two-factor UI is a
real frontend boundary, but API mode currently reports backend capability
unavailability because no second-factor endpoint exists in the current API
contract. Password recovery calls the existing API request/reset endpoints;
email delivery is backend-owned and was not fabricated here.
Detailed Web acceptance criteria remain a governance gap: Blueprint marks the
Web catalog acceptance criteria as pending. This release claims audited
pre-design Flow parity for the implemented Platform slices, not 100% of the
pending Web catalog.

## Validation

- `npm test`: 161 tests passed across 80 files.
- `npm run validate:bounded-contexts`: PASS.
- `npm run validate:catalog-assets`: PASS.
- `npm run validate:design-foundations`: PASS with `sourceChecked: true`.
- `npm run build`: PASS; initial bundle `866.17 kB`, with no budget warning.
- `npm audit --omit=dev`: zero vulnerabilities.
- Browser: ICISA workspace preview, 2FA, six-step registration, catalog-backed
  manual order through route review and embedded Google Maps completed without
  console errors.

## Release status

Published through the `release/v0.15.0` GitFlow line with an annotated
`v0.15.0` tag and GitHub Release. The release contains no generated screenshot
artifacts; local visual evidence remains outside Git.
