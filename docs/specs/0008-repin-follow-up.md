# 0008 Spec 0007 follow-up: what the re-pin evidence says, and what each re-read note shows

Status: **spec** (frozen when its PR opens). Date: 2026-10-30. Decided by: the lead's request after the merge of spec 0007's PR (#8), whose last commit (`69c96c8`) reached a branch that had already merged.
Process: [spec 0000](0000-intent-model.md). Verify skill: none (data and documents only).

## Goal

1. **The committed evidence of spec 0007 holds no Python.** `docs/specs/0007-evidence/tools/repin-fallback.py.txt` is deleted. The TypeScript mapped-diff script stays (`repin.ts.txt`). The spec says exactly what is reproducible from this repository and what was a manual pass, and its Revisions carry one dated entry (the body is not edited) with the counts, each with its source: the table (74 rows = 7 rows of 6 deleted elements, 15 rows of 11 corrected elements, 52 rows of 50 kept elements) and the model diff (7 elements deleted, 12 changed).
2. **A re-read note says what changed.** Each of the 50 `recheck` notes in `model/triage.yaml` now gives the old and the new citation and the old and the new cited text, about 120 characters from just before the first word that differs (the whole range, the old text after the rename mapping), or says that the words are the same and only their position changed. `docs/confirm.md` shows them.

No element, status or source changes.

## Journey

```text
reviewer
  1. read     docs/confirm.md, section "Citations to re-read"     each row shows the old and the new text
  2. count    awk -F'\t' '!/^#/{a[$7]++} END{for(k in a)print k,a[k]}' docs/specs/0007-evidence/changed-citations.tsv
  3. gate     bun run ready
```

## Falsifiers

| # | Falsifier | Gate | Fails when |
| --- | --- | --- | --- |
| F1 | No Python in the committed evidence | `git ls-files docs/specs/0007-evidence | grep py` prints nothing | a `.py` or `.py.txt` file returns |
| F2 | The statuses and the element set are unchanged | `bun run status:diff --ref origin/main` (`0 status changes, 0 added, 0 removed`) | any element moves |
| F3 | Every note names what changed | `grep -c 'cited text changed,' model/triage.yaml` is 50, and none of them reads `SIMILAR` | an entry keeps the old note shape |
| F4 | The model passes its checks | `bun run model:check`, `bun run generate:check`, `bun run ready` | any check fails |

## Revisions

(none yet)
