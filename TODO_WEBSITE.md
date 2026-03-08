# TODO: Website Landing Page

## Goal
Build a static marketing site for `gen-gen` using TanStack Router + shadcn/ui.

## Stack Constraints
- Static site output
- TanStack Router
- shadcn/ui
- Tailwind CSS

## Work Breakdown
- [x] Initialize website app (Vite + TanStack Router).
- [ ] Configure static build/deploy target.
- [x] Install and configure Tailwind + shadcn/ui.
- [x] Create app shell (header/nav/footer).
- [x] Build landing route with hero + CTA.
- [x] Add feature grid (helpers, deep merge, overrides, strategy, presets, watch diagnostics).
- [x] Add “How it works” section (1. import types 2. run generator 3. override in tests).
- [x] Add quickstart snippets (CLI, API, Vite plugin).
- [x] Add examples preview cards linking to docs pages.
- [x] Add social proof/positioning section (“why this for tests”).
- [x] Add responsive layout polish for mobile/tablet/desktop.
- [x] Add accessibility pass (keyboard nav, landmarks, contrast).
- [x] Add SEO metadata (title, description, OG tags).
- [x] Add OG/social image asset.
- [ ] Validate static build artifacts and local preview.

## Type Playground (Interactive)

### Goal
Allow users to paste/write a TypeScript type and instantly see generated factory code.

### MVP Scope
- [x] Add `/playground` route.
- [x] Add two editors:
  - input: TypeScript type definitions
  - output: generated code (read-only)
- [x] Add “Generate” button and optional auto-generate toggle.
- [x] Support simple in-file types (no external imports required).
- [x] Provide starter sample in input editor.
- [x] Add copy-to-clipboard for generated output.
- [x] Handle parse/generation errors with inline diagnostics.
- [x] Keep this feature static-site compatible (no required backend for MVP).

### V2 Scope
- [ ] Add support for multiple related type declarations in one input.
- [ ] Add options panel matching core flags (deep merge, presets, etc.).
- [ ] Add shareable URL state (encode input/options).
- [ ] Add “open in repo” guidance for moving playground output into real projects.

## Deliverables
- [x] Working static landing page app.
- [x] Production build output.
- [x] Clear CTA links to docs, GitHub, npm.
