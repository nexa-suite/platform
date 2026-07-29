# Contributing to Nexa Platform

## Welcome

Nexa Platform is the Angular workspace for internal operations. Contributions should preserve clear boundaries between internal workflows and buyer self-service.

## Before contributing

Read the root README, applicable release notes and [SECURITY.md](./SECURITY.md). Do not add credentials, generated artifacts or undocumented contracts.

## Architecture boundaries

- Keep presentation, application, domain and infrastructure concerns separated.
- Frontend domain models require an approved vertical and explicit API contract.
- Do not make Platform the security authority.
- Do not introduce buyer-only ownership, Warehouse rules or API entities into shared UI.
- Keep shared components context-independent.

## Development workflow

```bash
npm ci
npm start
npm run validate:catalog-assets
npm test
npm run build
```

## Branch strategy

```text
feature/*
    ↓
develop
    ↓
release/vX.Y.Z
    ↓
main
    ↓
annotated tag
    ↓
GitHub Release
    ↓
back-merge to develop
```

## Commit convention

Use `type(scope): description`. Allowed types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `build`, `perf`, `security`. Avoid messages such as `update files`, `changes`, `misc`, `final version`, `works` or `fix stuff`.

## Testing requirements

Run asset validation, unit tests and production build before opening a pull request. Add focused tests for changed behavior.

## Documentation requirements

Update README, changelog or release notes when scope, commands, architecture or release behavior changes.

## Security requirements

Never add secrets or security rules that belong to API. Report vulnerabilities through [SECURITY.md](./SECURITY.md), never through public issues.

## Pull request checklist

- [ ] One primary concern per change.
- [ ] No generated artifacts or duplicate Finder copies.
- [ ] No secrets.
- [ ] Tests and build pass.
- [ ] DDD boundaries remain intact.
- [ ] Documentation updated.
- [ ] API contract, tenant and security impact reviewed.
- [ ] Screenshots attached when visual behavior changes.

## Release process

Follow [RELEASE_POLICY.md](./RELEASE_POLICY.md). Releases require clean evidence, an annotated tag, a published GitHub Release and a back-merge.
