# Provenance

The development lifecycle is copied from [`reebeat/studio`](https://github.com/reebeat/studio) at commit `d4fd75eaca83b9e8a98f073d5b1d957da5d6b8b8` (`main`, 2026-10-29), which copied it from [`reebeat/reebeat`](https://github.com/reebeat/reebeat) at `f7c348877585f54b6bf00651608726dd7e5044d3` and adapted it from [`phibkro/vektorprogrammet-reimagined`](https://github.com/phibkro/vektorprogrammet-reimagined) at `797e9e41d96194b9479ff224ac1c40bbc0545888` (the donor). The headers that name the donor were kept. The operator confirmed on 2026-10-29 that the donor's code is his work (see reebeat's `docs/design/third-party.md`).

**Identical** means the file's git blob hash equals the source's, checked with `git hash-object <file>` against `git rev-parse d4fd75e:<file>` in a studio checkout.

| File | Source (studio `d4fd75e`) | Deviation |
| --- | --- | --- |
| `.vite-hooks/pre-commit`, `commit-msg`, `pre-push` | same paths | identical |
| `commitlint.config.ts`, `devenv.yaml`, `devenv.lock`, `devenv.nix`, `.gitignore` | same paths | identical (checked with `git hash-object`) |
| `.jscpd.json`, `.gitleaks.toml`, `tsconfig.json` | same paths | `.jscpd.json`: the `tools/oxlint/anti-slop` ignore entry removed; `.gitleaks.toml`: the title names this repository; `tsconfig.json`: `include` lists this repository's files |
| `knip.json` | same path | rewritten: the `tools/oxlint/anti-slop` ignore, the `apps/editor` and `tools/quality` workspaces are replaced by the `tools/intent` workspace; `gitleaks` stays in `ignoreBinaries`; `vite` and `@effect/language-service` are in `ignoreDependencies` (vite is a peer of the test runner and is not imported) |
| `.agents/skills/review-pr/merge.sh`, `record-round.sh` | same paths | identical |
| `.agents/skills/review-pr/SKILL.md`, `reviewers.md` | same paths | rewritten for this repository: no browser, no Foldkit, no verify skill; reviewers sample the model's sources |
| `.agents/skills/pr-create/SKILL.md` | same path | the `verify-studio` parts removed; the description names this repository |
| `.github/workflows/checks.yml` | same path | no exception-registry or build step; steps for the model check and the drift check |
| `vite.config.ts` | same path | no Foldkit plugin, no vendored anti-slop Effect rules, no exception-registry diagnostics; Effect roles are this repository's |
| `package.json` | same path | name, workspaces, scripts and catalog are this repository's |
| `AGENTS.md`, `STATE.md`, `CLAUDE.md` | studio's | rewritten; the gate table and the lifecycle text are adapted |

Not copied: `tools/quality/*` (the exception registry, the family check, the feature map, the headroom gate: this repository has no suppression, no verify skill and no browser), `tools/oxlint/anti-slop`, `apps/`, the `verify-studio` skill.

## Original

`tools/intent/`, `model/`, `docs/specs/0000-intent-model.md` and the generated documents are written for this repository. `sources/operator-decisions-2026-10.md` is the operator's decision log, copied unchanged from the lead's working directory.

## Method and practice cited, not copied

4EM (Sandkuhl, Stirna, Persson and Wißotzki, *Enterprise Modeling: Tackling Business Challenges with the 4EM Method*, Springer 2014); the product vision board (Roman Pichler); the Business Model Canvas (Osterwalder and Pigneur, *Business Model Generation*, 2010); jobs to be done; arc42 (sections 1 and 10). No coursework, case material or personal data is copied into this repository.
