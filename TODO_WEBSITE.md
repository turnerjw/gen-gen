# TODO: Website Landing Page

## Goal
Build a static marketing site for `gen-gen` using TanStack Router + shadcn/ui.

## Stack Constraints
- Static site output
- TanStack Router
- shadcn/ui
- Tailwind CSS

## Work Breakdown
- [ ] Initialize website app (Vite + TanStack Router).
- [ ] Configure static build/deploy target.
- [ ] Install and configure Tailwind + shadcn/ui.
- [ ] Create app shell (header/nav/footer).
- [ ] Build landing route with hero + CTA.
- [ ] Add feature grid (helpers, deep merge, overrides, strategy, presets, watch diagnostics).
- [ ] Add “How it works” section (1. import types 2. run generator 3. override in tests).
- [ ] Add quickstart snippets (CLI, API, Vite plugin).
- [ ] Add examples preview cards linking to docs pages.
- [ ] Add social proof/positioning section (“why this for tests”).
- [ ] Add responsive layout polish for mobile/tablet/desktop.
- [ ] Add accessibility pass (keyboard nav, landmarks, contrast).
- [ ] Add SEO metadata (title, description, OG tags).
- [ ] Add OG/social image asset.
- [ ] Validate static build artifacts and local preview.

## Type Playground (Interactive)

### Goal
Allow users to paste/write a TypeScript type and instantly see generated factory code.

### MVP Scope
- [ ] Add `/playground` route.
- [ ] Add two editors:
  - input: TypeScript type definitions
  - output: generated code (read-only)
- [ ] Add “Generate” button and optional auto-generate toggle.
- [ ] Support simple in-file types (no external imports required).
- [ ] Provide starter sample in input editor.
- [ ] Add copy-to-clipboard for generated output.
- [ ] Handle parse/generation errors with inline diagnostics.
- [ ] Keep this feature static-site compatible (no required backend for MVP).

### V2 Scope
- [ ] Add support for multiple related type declarations in one input.
- [ ] Add options panel matching core flags (deep merge, presets, etc.).
- [ ] Add shareable URL state (encode input/options).
- [ ] Add “open in repo” guidance for moving playground output into real projects.

## Deliverables
- Working static landing page app.
- Production build output.
- Clear CTA links to docs, GitHub, npm.
