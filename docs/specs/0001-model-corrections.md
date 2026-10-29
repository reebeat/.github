# 0001 Model corrections: cut text, the Fountain decision, a new pin

Status: **spec** (frozen when its PR opens). Date: 2026-10-29. Decided by: the lead's assignment of 2026-10-29, which names three defects of the merged model (spec 0000) and one operator addition to the decision log.
Binding for: the PR that carries this file. Builds on [spec 0000](0000-intent-model.md).

## Goal

Make the merged model true again, and make the same faults impossible to repeat:

1. **Cut text.** Nine rationales in `model/reebeat/` stopped at the first ` #`: a plain YAML scalar ends there, so `rationale: Issue #15 reports it` decoded to "Issue", and `docs/confirm.md` showed "Issue" as the reason. A tenth, in `model/foldkit-flow/`, was cut the same way. The model must fail to load when text is cut like this, and a check must catch text that stops at a dangling word.
2. **The Fountain decision.** The operator added lines 67 to 69 to the decision log: Fountain is both an importer (a screenplay becomes a story) and an artifact renderer (a story becomes a screenplay), and it is not the persistent IR. The copy of the log in `sources/` is updated, and the elements that said "one Fountain file is the source" or "Fountain is only an artifact" say what the log says.
3. **A new pin.** The product repositories moved. `model/sources.yaml` pins their current mains; every citation follows; the elements that the move made stale are corrected (the triage files of the lead name them).
4. **A fresh tracker.**

No status of any element changes. A status moves only after the operator decides.

## Journey

```text
lead / operator
  1. read      docs/confirm.md   the rationales are whole sentences again
  2. check     bun run model:check            now also rejects cut values and dangling text
  3. compare   bun run status:diff            no element has another status than on main
  4. verify    bun run sources:verify         every file source resolves at the new pins
  5. gate      bun run ready                  as in spec 0000
```

## Constraints and values

- The operator's log is copied byte for byte from the lead's working directory (`cmp` shows no difference); that copy is the one allowed edit of `sources/`.
- A source line number stays true: file sources cite the commit pinned in `model/sources.yaml`. Citations whose cited lines are unchanged between the old and the new pin were renumbered by the diff of the two commits; every other citation was read again at the new pin.
- A new element is `proposed` (or `open` for a gap) and says in its rationale what the operator must confirm.
- Correctness by construction: the faults of item 1 are caught by the loader, not by a reviewer.

## What is built

| Part | Content |
| --- | --- |
| Cut-value guard | `tools/intent/src/yamlText.ts` finds every plain scalar that carries a trailing comment (the parser kept the text before ` #` and dropped the rest). `parseYaml` in `load.ts` fails with the line, the kept text and the lost text. This holds for every file the loader reads. |
| Dangling-text check | `TEXT-DANGLING` in `tools/intent/src/checks.ts`: a statement or rationale that ends at "issue", "pr", "spec" or "#". |
| Status diff | `bun run status:diff [--ref <ref>]` (`tools/intent/src/statusDiff.ts`) compares every element's status with its status at a git ref (default `main`) and exits 1 when an element that exists on both sides has another status. |
| The ten cut values | quoted. |
| The log | `sources/operator-decisions-2026-10.md` equals the operator's file (69 lines). |
| The pins | reebeat `82ee66f`, studio `d4fd75e` (unchanged), foldkit-flow `8124d5b`. |
| The corrections | see the PR body and the diff of `model/`. |
| The tracker | `model/tracker.yaml` refreshed. |

## Falsifiers

| # | Falsifier (must hold) | Gate | Negative control (must fail) |
| --- | --- | --- | --- |
| F1 | `bun run ready` exits 0 on a clean tree of the head | `ready` | F2 to F6 |
| F2 | A model file with a cut plain scalar does not load | loader (`yamlText.test.ts`) | `rationale: Issue #15 reports it.` fails with the line and the lost text; the quoted form and the folded form load whole |
| F3 | A rationale or statement that ends at a dangling word fails | `model:check` (`checks.test.ts`) | rationale `Issue` fails with `TEXT-DANGLING`; `Issue #14 reports it.` passes |
| F4 | A change of status against `main` fails | `status:diff` (`statusDiff.test.ts`) | change one status in a copy of the model: exit 1 and the element is named |
| F5 | The decision log in `sources/` equals the operator's file | `cmp` | edit one character of the copy: `cmp` exits 1 |
| F6 | Every file source resolves at the new pins | `sources:verify` | cite a line beyond the end of a file (spec 0000 F10) |

The raw output of the controls is in `docs/specs/0001-evidence/`.

## Scope and non-goals

- No status changes, no new decisions. The triage recommendations (consequential decisions D1 and so on) are for the operator; they are not applied.
- The corrections follow the STALE sections of the triage files only; the CONFIRM, CONFIG and CONSEQUENTIAL sections wait for the operator.
- No product repository is edited.

## Open questions for the operator

1. The triage files list what is ready to confirm and what needs a choice; this PR changes none of it.

## Revisions

Dated entries. A spec is revised only here; its text above is never edited silently after the PR opens.

- **2026-10-29, plan written** with the build.
