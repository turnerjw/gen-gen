# TODO: Codex Skill for Using gen-gen

## Goal
Create a Codex skill that helps users adopt and operate `gen-gen` effectively.

## Scope
- Bootstrap `data-gen.ts` quickly
- Recommend overrides vs strategy vs presets
- Diagnose warnings/errors
- Generate actionable setup changes

## Work Breakdown
- [ ] Create skill directory and `SKILL.md`.
- [ ] Define activation cues (when this skill should trigger).
- [ ] Define required input checklist for users (project path, desired mode, toolchain).
- [ ] Add startup workflow:
  - detect TS setup
  - locate or create `data-gen.ts`
  - propose command(s)
- [ ] Add decision rubric:
  - when to use `FakerOverrides`
  - when to use `fakerStrategy`
  - when to use `typeMappingPresets`
- [ ] Add troubleshooting rubric for common warnings:
  - unmatched include/exclude
  - unused faker overrides
  - skipped generic types
  - skipped scalar root types
- [ ] Add templates/snippets:
  - starter `data-gen.ts`
  - strategy module file
  - overrides object
- [ ] Add examples mapping to current `/example/*` structure.
- [ ] Add verification checklist (typecheck/test/build/gen:example).
- [ ] Test skill against at least two sample repos.
- [ ] Add version compatibility notes (which gen-gen versions are supported).

## Deliverables
- Reusable Codex skill that can onboard and troubleshoot gen-gen usage.
- Documented prompts/playbooks with tested outcomes.
