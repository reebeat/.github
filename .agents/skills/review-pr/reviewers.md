<!-- Provenance: adapted from tsukuri-labs/studio @ d4fd75eaca83b9e8a98f073d5b1d957da5d6b8b8 (.agents/skills/review-pr/reviewers.md). Deviations:
     the verify-studio and Foldkit checks are replaced by checks of the model's sources. See PROVENANCE.md. -->

# Reviewer briefs

Read by each reviewer of a round (see `SKILL.md`). You report; you do not edit, push or comment on the PR. Say which of (a) the plan, (b) the implementation, (c) their agreement you judged.

**Every number in a report has its script, its raw output and its command.** A count, a size, a timing or a pass rate that you cannot trace to a command that you ran (or that the PR names), whose raw output is in a file or in the report, is a finding of medium or above, whoever wrote it. Your own report meets the rule too: quote the command and its first relevant output line for each claim.

## Verification reviewer

1. In your detached worktree run `devenv shell -- bun install --frozen-lockfile`, then `devenv shell -- bun run ready`. It must exit 0 on the head; record the head sha and the output summary.
2. Check the PR body's falsifier table against the branch: for each falsifier, find the gate that holds it and its negative control (`tools/intent/test/`), and re-run the control where it is cheap (a scratch change in the worktree, undone afterwards). A control that was not shown, or that does not fail as the table says, is a finding.
3. Read CI's result on the head (`gh pr checks <n>`): `checks` must be green.
4. **Check the model against its sources.** Run `bun run sources:verify` where the product repositories are checked out (it needs local clones at the commits of `model/sources.yaml`); every file source must resolve. Then sample at least 20 elements across all scopes: open the cited lines (`--show` prints them) and judge whether they support the statement. Count and report every element whose source does not support it (medium), whose status is stronger than its source (high: a `decided` element needs the operator's own decision), or that copies private or course material (critical).
5. Regenerate (`bun run generate`) and confirm `git status` shows no change: the drift test holds only if the committed documents equal the generated ones.

## Conformance reviewer

1. **The plan** (a): the spec states the right problem; the journey can be experienced from the PR body; each falsifier has a gate and a control that can fail; Revisions explain each change made while building.
2. **The agreement** (c): list anything built that the spec does not name and anything the spec names that is not built. Undeclared scope, a falsifier with no test, or a silent change to the plan is medium or above.
3. **The model's honesty**: nothing is `decided` without an operator decision as source; each `proposed` or `open` element has a rationale that says what the operator must confirm; licences, blockers and unmeasured demand are named, not hidden; the gap report lists a fix for every gap and edits no product repository.
4. **Repository rules** in `AGENTS.md`: one source per fact (generated documents are never hand-edited); a file copied from another repository carries its provenance, and `PROVENANCE.md` is accurate (a copied script is byte for byte when it says so, checked with `git hash-object`).
5. **Public repository**: no secret, personal data or course-private material in the model, the sources, the generated documents or the PR. The 4EM method is cited from the book, never from coursework.
6. **Independence and evidence**: the PR body's figures meet the evidence rule above; the round you are part of will name an `Author` that is not among the reviewers.

## Severity

| Severity | Meaning | Examples |
| --- | --- | --- |
| critical | a leaked secret or personal data, course material in a public repository, or a broken `main` once merged | a coursework case in the model; a key in a fixture |
| high | a spec falsifier is not met, a status claims more than its source, or a check that always passes | a negative control that does not fail; a `decided` element whose source is an agent's proposal |
| medium | a rule of `AGENTS.md` broken, evidence that does not match the branch, a number without its script, raw output and command, any (c) finding, a source that does not support its element | a generated page edited by hand; undeclared scope; a Revisions entry missing |
| low | clarity or maintainability with no behavioural effect | a misleading name or comment |
| nit | taste | none |

Each finding: severity, `file:line` or element id, what is wrong in one sentence, and the evidence (command and output).
