# TODO: Website Documentation

## Goal
Ship complete, versioned docs for MVP features on the static website.

## Documentation IA
- Getting Started
- CLI Reference
- API Reference
- Vite Plugin Reference
- Faker Overrides and Strategies
- Presets
- Advanced Behavior (deep merge, ignore tags, policies)
- Examples
- Troubleshooting
- Release Notes / Changelog

## Work Breakdown
- [x] Choose docs content approach (MDX/content files/components).
- [x] Implement docs route layout with sidebar and next/prev nav.
- [x] Create Getting Started page (install, first `data-gen.ts`, run command).
- [x] Create CLI docs page with all flags and examples.
- [x] Create API docs for `generateDataFile` options and result.
- [x] Create Vite plugin docs with full config options.
- [x] Document `FakerOverrides` precedence and matching order.
- [x] Document `fakerStrategy` (API/plugin/CLI module).
- [x] Document `typeMappingPresets` (`common`, `commerce`).
- [x] Document helper ergonomics including array item helpers.
- [x] Document union behavior and edge cases.
- [x] Document watch diagnostics and warnings behavior.
- [x] Create troubleshooting page from real warning/error messages.
- [x] Add copy-paste examples synced with `/example` folders.
- [x] Add docs search/filter UX (lightweight static client-side).
- [x] Add “Edit on GitHub” links.
- [x] Add docs QA checklist to verify snippets remain valid.

## Playground Docs

- [x] Add “Playground” docs page linked from nav/docs sidebar.
- [x] Document supported input scope for MVP (single-file type declarations, no external imports).
- [x] Document known limitations and how to move generated code into project files.
- [x] Add 3 starter playground examples (basic object, union, generic concrete type).
- [x] Document error messages users may encounter in playground parsing/generation.

## Deliverables
- [x] Complete docs site section linked from landing page.
- [x] Verified snippets that match current CLI/API/plugin behavior.
