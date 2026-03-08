# Changesets

Run `bun run changeset` to create a changeset file for user-facing changes.

Release automation on `main` will consume pending changesets, open a version PR,
and publish to npm when that PR is merged.
