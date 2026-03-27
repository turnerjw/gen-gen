---
title: Docs QA Checklist
summary: Use this checklist before release to keep docs examples valid and aligned with current CLI/API/plugin behavior.
keywords: [qa, checklist, validation]
---

1. Run `bun run build` in repo root and ensure package compile passes.
2. Run `bun run gen:example` and confirm all example generators still compile and generate.
3. Run `bun run web:typecheck` and `bun run web:build` to validate website routes and content compile.
4. Verify CLI docs flags match `printHelp()` output in `src/cli-core.ts`.
5. Verify API docs option names match `GenerateOptions` and `GenerateResult` in `src/generator.ts`.
6. Verify plugin docs options match `GenGenPluginOptions` in `src/vite-plugin.ts`.
7. Spot-check warning/error text in troubleshooting against actual runtime strings.
8. Confirm each docs page has a working "Edit on GitHub" link.
