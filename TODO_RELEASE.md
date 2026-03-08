# TODO: Semantic Versioning + npm Publishing

## Goal
Establish reliable releases using Changesets with automated npm publishing.

## Constraints
- Semantic versioning driven by Changesets
- Publish to npm

## Work Breakdown
- [x] Install and initialize Changesets.
- [x] Add `.changeset/config.json` with release strategy.
- [x] Add scripts:
  - `changeset`
  - `changeset version`
  - `changeset publish`
- [x] Add CI check to require changeset entries for user-facing PRs.
- [x] Add CI release workflow for main branch.
- [x] Configure npm auth token and provenance in CI.
- [x] Add pre-publish gates in CI:
  - typecheck
  - test
  - build
  - gen:example
- [x] Confirm `package.json` exports/bin/files are correct for consumers.
- [x] Add `RELEASING.md` with end-to-end release procedure.
- [x] Decide first stable release target (`0.x` continuation vs `1.0.0`).
- [ ] Dry-run publish in CI (if possible) then publish real release.
- [ ] Verify npm package install and runtime in a clean fixture project.

## Deliverables
- Repeatable release workflow with Changesets.
- Published npm package with version/tag history.
