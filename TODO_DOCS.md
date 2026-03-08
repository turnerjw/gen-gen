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
- [ ] Choose docs content approach (MDX/content files/components).
- [ ] Implement docs route layout with sidebar and next/prev nav.
- [ ] Create Getting Started page (install, first `data-gen.ts`, run command).
- [ ] Create CLI docs page with all flags and examples.
- [ ] Create API docs for `generateDataFile` options and result.
- [ ] Create Vite plugin docs with full config options.
- [ ] Document `FakerOverrides` precedence and matching order.
- [ ] Document `fakerStrategy` (API/plugin/CLI module).
- [ ] Document `typeMappingPresets` (`common`, `commerce`).
- [ ] Document helper ergonomics including array item helpers.
- [ ] Document union behavior and edge cases.
- [ ] Document watch diagnostics and warnings behavior.
- [ ] Create troubleshooting page from real warning/error messages.
- [ ] Add copy-paste examples synced with `/example` folders.
- [ ] Add docs search/filter UX (lightweight static client-side).
- [ ] Add “Edit on GitHub” links.
- [ ] Add docs QA checklist to verify snippets remain valid.

## Playground Docs

- [ ] Add “Playground” docs page linked from nav/docs sidebar.
- [ ] Document supported input scope for MVP (single-file type declarations, no external imports).
- [ ] Document known limitations and how to move generated code into project files.
- [ ] Add 3 starter playground examples (basic object, union, generic concrete type).
- [ ] Document error messages users may encounter in playground parsing/generation.

## Deliverables
- Complete docs site section linked from landing page.
- Verified snippets that match current CLI/API/plugin behavior.
