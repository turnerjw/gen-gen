# Releasing `gen-gen`

This project uses [Changesets](https://github.com/changesets/changesets) for semantic versioning and npm publishing.

## Versioning Decision

Current target stays on `0.x` until API/runtime ergonomics stabilize.

- Current version: `0.1.0`
- Next planned release line: `0.2.x`
- `1.0.0` will be cut after explicit API-stability signoff.

## Prerequisites

- npm package owner access for `gen-gen`
- `NPM_TOKEN` configured in GitHub repository secrets
- merge permissions to `main`

## Authoring Changes

1. Make user-facing code changes.
2. Add a changeset:
   - `bun run changeset`
3. Commit the generated file in `.changeset/*.md`.

For docs/internal-only updates, a changeset is not required.

## CI Gates

On PRs to `main`, CI runs:

- `bun run typecheck`
- `bun test`
- `bun run build`
- `bun run gen:example`
- `changeset status` check (for user-facing package changes)

## Release Flow

1. Merge PRs with changesets into `main`.
2. `Release` workflow runs on `main` push.
3. Changesets action does one of:
   - opens/updates a version PR (`chore: version packages`) when unreleased changesets exist
   - publishes to npm when the version PR commit is on `main`
4. Published package is released with npm provenance enabled.

## Local Commands

- Create changeset: `bun run changeset`
- Apply version bumps: `bun run "changeset version"`
- Publish (manual fallback): `bun run "changeset publish" -- --access public --provenance`

## Verification Checklist After Publish

1. Confirm package + version on npm.
2. Validate install in a clean fixture:
   - `npm i -D gen-gen typescript @faker-js/faker`
   - `npx gen-gen --input data-gen.ts`
3. Smoke-test runtime and generated output.
