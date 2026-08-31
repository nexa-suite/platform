# Release Policy

## Versioning

Nexa repositories version independently using Semantic Versioning. While a repository remains pre-1.0, minor versions may contain approved evolution and patch versions contain compatible fixes or documentation changes. A version applies only to the repository that publishes it.

Every release requires an annotated and SSH-signed Git tag, CHANGELOG entry, versioned release notes and a GitHub Release. Published tags are immutable during normal release operations; an explicitly authorized SCM history migration may consolidate redundant release refs only when retained target commits, evidence and the release audit are preserved.

## Consolidation rule

Publish a version only for a coherent, consumable milestone. Do not create a
release for every merged PR or small same-day implementation slice. When a
compressed historical wave is consolidated, retain the final consumable
version number because it matches the repository package state, document the
superseded snapshots in the CHANGELOG, and keep all underlying commits
reachable. Version gaps identify unpublished or consolidated internal
iterations; future releases increment from the retained public line.

## Tag signing

Release tags MUST be annotated, signed with the maintainer's registered SSH key, verified locally with `git verify-tag <version>` and shown as `Verified` by GitHub before publication. Configure `tag.gpgSign=true` and `gpg.ssh.allowedSignersFile=.github/release-allowed-signers`; the committed allowlist contains only the public signer identity. The private key remains outside the repository.

## GitFlow

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

## Release cadence

A merged PR is not automatically a release. Accumulate feature and fix PRs on
`develop` while the coherent release scope is being assembled. Create a
release branch only at a real release boundary, then validate and publish one
consumable milestone. Use release candidates only when final validation needs a
candidate freeze. Do not publish calendar-driven versions or one stable
release per implementation PR.

## Release checklist

- [ ] Scope approved.
- [ ] Working tree clean.
- [ ] Tests green.
- [ ] Build green.
- [ ] Runtime evidence captured when applicable.
- [ ] Browser evidence captured when applicable.
- [ ] Security review completed.
- [ ] CHANGELOG updated.
- [ ] Release notes reviewed.
- [ ] Version updated.
- [ ] Release branch created.
- [ ] `main` merged with `--no-ff`.
- [ ] Annotated SSH-signed tag created.
- [ ] `git verify-tag <version>` passed locally and GitHub shows `Verified`.
- [ ] GitHub Release published.
- [ ] `develop` back-merged.

## Rollback and deprecations

Rollback is conceptual and depends on the consuming deployment process; it must not reuse a published tag. Breaking changes require a new compatible release line, migration notes and explicit contract impact. Deprecations require a reason, replacement guidance and a removal trigger.
