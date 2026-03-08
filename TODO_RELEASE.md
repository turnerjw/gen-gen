# TODO: Semantic Versioning + npm Publishing

## Goal
Establish reliable releases using Changesets with automated npm publishing.

## Constraints
- Semantic versioning driven by Changesets
- Publish to npm

## Work Breakdown
- [ ] Install and initialize Changesets.
- [ ] Add `.changeset/config.json` with release strategy.
- [ ] Add scripts:
  - `changeset`
  - `changeset version`
  - `changeset publish`
- [ ] Add CI check to require changeset entries for user-facing PRs.
- [ ] Add CI release workflow for main branch.
- [ ] Configure npm auth token and provenance in CI.
- [ ] Add pre-publish gates in CI:
  - typecheck
  - test
  - build
  - gen:example
- [ ] Confirm `package.json` exports/bin/files are correct for consumers.
- [ ] Add `RELEASING.md` with end-to-end release procedure.
- [ ] Decide first stable release target (`0.x` continuation vs `1.0.0`).
- [ ] Dry-run publish in CI (if possible) then publish real release.
- [ ] Verify npm package install and runtime in a clean fixture project.

## Deliverables
- Repeatable release workflow with Changesets.
- Published npm package with version/tag history.
