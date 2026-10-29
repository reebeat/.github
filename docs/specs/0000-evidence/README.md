# Evidence for spec 0000

Raw output that the PR body of spec 0000 cites, kept in the repository so that a reader can check it. This directory is hand-written evidence, not a generated page: the drift test does not cover it.

## The negative controls

`controls.sh` makes one deliberate defect per falsifier on a scratch copy of the working tree, runs the gate, and prints the command, its exit code and the first finding. `controls.txt` is its raw output on the PR head.

```sh
devenv shell -- bash docs/specs/0000-evidence/controls.sh
```

| Falsifier | Observed in `controls.txt` |
| --- | --- |
| F2 goal with no support | `exit: 1`, `GOAL-UNSUPPORTED goal-org-control-lonely` |
| F3 component that serves no goal | `exit: 1`, `COMPONENT-NO-GOAL comp-org-control-orphan` |
| F4 rule that cites no goal | `exit: 1`, `RULE-NO-GOAL rule-org-control-loose` |
| F5 element with no source | `exit: 1`, decode error at `["elements"][9]["source"]` |
| F6 decided, source not an operator decision | `exit: 1`, `STATUS-DECIDED-NOT-OPERATOR concept-org-control-decided` |
| F7 generated page edited by hand | `exit: 1`, `GeneratedDrift: generated files differ from the committed ones` |
| F10 source line beyond the end of a file | `exit: 1`, `reebeat:README.md:9999-9999 is beyond the 49 lines of the file` |
| F12 staged fake secret | `exit: 1`, `leaks found: 1` |

The two baselines (`check`, `generate --check`) and the run after the restore exit 0. The unit controls (49 tests, `bun run test`) cover the rest of the checks: links, ids, coverage, products, canvas, tracker, and the verifier (`verifySources.test.ts`: a header line, a plain line, a missing file, a file cited as absent, the last line of a file, the line one past it, a blank range, an unknown commit and a missing checkout).

## The source reviews

Before the PR opened, read-only agents that did not write the model judged every element against its sources. Their reports are copied here unchanged.

| Round | Reviewer report | Findings (lines that start with `- `) |
| --- | --- | ---: |
| 1 | [`SrcReviewOrgPlusFlow`](review-round-1/SrcReviewOrgPlusFlow.md): organisation and foldkit-flow | 50 |
| 1 | [`SrcReviewReebeatA`](review-round-1/SrcReviewReebeatA.md): reebeat goals, rules, concepts | 30 |
| 1 | [`SrcReviewReebeatB`](review-round-1/SrcReviewReebeatB.md): reebeat processes, actors, technical | 87 |
| 1 | [`SrcReviewStudio`](review-round-1/SrcReviewStudio.md): studio | 54 |
| 2 | [`Src2Org`](review-round-2/Src2Org.md) | 12 |
| 2 | [`Src2Flow`](review-round-2/Src2Flow.md) | 49 |
| 2 | [`Src2StudioA`](review-round-2/Src2StudioA.md) | 14 |
| 2 | [`Src2StudioB`](review-round-2/Src2StudioB.md) | 54 |
| 2 | [`Src2ReebeatA`](review-round-2/Src2ReebeatA.md) | 6 |
| 2 | [`Src2ReebeatB`](review-round-2/Src2ReebeatB.md) | 8 |

Round 1: 221 finding lines in 4 reports. Round 2: 143 finding lines in 6 reports. Recount:

```sh
for f in docs/specs/0000-evidence/review-round-*/*.md; do echo "$(grep -c '^- ' "$f") $f"; done
```

What the findings were: in round 1, almost all said that an element was `decided` while its only source was a spec header ("Status: plan", "Decided by: the operator's assignment") or a description of what the repository does; in round 2, mostly statements written too strongly for their source, statements about the pinned commit that a later merge had made stale, and rationales that did not say what the operator must confirm. The authors fixed or answered each finding (the elements that relied on a header became `proposed`; `sources:verify` rejects a `record:` on a header; decided statements were cut back to the wording of the line).

A fixed finding is not proof that the rest is right. The reviewers are agents; each sampled the elements of its files and said so where it could not check a pinned commit. Each report names the commands it ran. The independent review rounds of the `review-pr` skill are recorded on the pull request.

## Other raw output

- `bun run ready` on the head: run by the author and by the reviewer; CI shows the same gates.
- `bun tools/intent/src/cli.ts verify-sources`: prints `Every file source resolves.` on the head (it needs checkouts of the product repositories at the pinned commits, so it is not in CI).
- Mermaid: every diagram of `docs/` parsed and rendered with `@mermaid-js/mermaid-cli` in a scratch directory (not a gate; GitHub's own renderer was not run).
