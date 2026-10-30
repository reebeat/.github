# 0006 The operator's bulk confirmation: 342 elements become `decided`

Status: **spec** (frozen when its PR opens). Date: 2026-10-30. Decided by: the operator, decision log line 118 (2026-10-30): "The standard and config triage groups are confirmed in bulk and the 34 records-only elements are ratified."
Process: [spec 0000](0000-intent-model.md). This PR is stacked on spec 0004 (the log copy with line 118); merge 0004 first.

## Goal

Make the model say what line 118 decided, and nothing more.

1. **The STANDARD and CONFIG groups of the triage are confirmed.** `model/triage.yaml` held the lead's advice on exactly those elements: 342 (org 29, tsukuri 140, studio 106, foldkit-flow 67; `standard` = "Recommended: confirm", `config` = "Recommended default: ..."). Each becomes `decided`, cites `log:118` (added to its sources) and loses its waiting `rationale`, as spec 0002 did for the answered elements. 303 were `proposed` and 39 `open`. Its advice entry is deleted (the check `TRIAGE-DECIDED` fails on a decided element that still has advice), so `model/triage.yaml` ends with `advice: []`.
2. **The records-only elements are ratified.** 34 elements were `decided` on a repository record only (a `record:` source, no `log:` line). Each gains `log:118` as a source and nothing else changes: its statement, other sources and status stay. The triage had recommended rewording four of them and reverting two; the operator's line says "ratified", so they are ratified as they stand (a reviewer may find that a statement is looser than the record: that is for a later change, not hidden here).
3. **What stays waiting.** 43 `proposed` and 7 `open` elements are in no confirmed group (the triage's STALE and CONSEQUENTIAL classes whose decision has not been given). They are listed in `docs/specs/0006-evidence/`.

No other field of any element changes. `model/sources.yaml` is untouched.

## Journey

```text
operator / lead
  1. read     docs/confirm.md          only the 50 elements that still wait remain
  2. compare  the evidence script      exactly the 342 advised elements moved to decided; exactly the 34 gained log:118; no other field moved
  3. gate     bun run ready            model:check (no TRIAGE-DECIDED, no STATUS-DECIDED-NOT-OPERATOR), generate:check, the rest
```

## Constraints and values

- **Status is earned.** Every moved element cites line 118, which is the operator's decision.
- **One group, one line.** The bulk confirmation does not ratify a statement the triage marked stale: those 50 stay as they are.
- **The triage's own words are the scope.** The ids are those of `model/triage.yaml` at the base commit, nothing chosen again.

## Falsifiers

| # | Falsifier | Gate | Fails when |
| --- | --- | --- | --- |
| F1 | Exactly the 342 advised elements changed status, all to `decided` (303 from `proposed`, 39 from `open`) | `docs/specs/0006-evidence/verify.ts.txt` (output `verify.txt`: `moved`) and `bun run status:diff --ref <base>` (`342 status changes, 0 added, 0 removed`) | another element moves, or one advised element does not |
| F2 | Each moved element's source is the old source plus `log:118`, and no rationale remains; the 34 records-only elements gained `log:118` and nothing else | the same script (`problems: 0`, `recordsOnlyRatified: 34`) | any other field changed |
| F3 | The model passes its checks; `triage.yaml` has no entry | `bun run model:check`, `bun run generate:check` | a decided element still has advice; a dangling id |
| F4 | The statuses left are 609 decided, 43 proposed, 7 open | `verify.txt` (`statusesAfter`), `docs/specs/0006-evidence/remaining.txt` (the 50 ids) | the census differs |

## What is built

`ratify.ts` of the local tool `rename-prep/` (not a repository) applied the edit as data; the result is `model/**/*.yaml`, `model/triage.yaml`, the regenerated `profile/` and `docs/`, `docs/specs/0006-evidence/` and this spec.

## Revisions

(none yet)
