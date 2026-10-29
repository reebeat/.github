#!/usr/bin/env bash
# Every figure that the PR body of spec 0002 quotes. Run from the repository root: bash docs/specs/0002-evidence/counts.sh
# The raw output of the run on the PR head is in counts.txt.
set -eu
cp docs/specs/0002-evidence/counts.ts.txt tools/intent/counts.tmp.ts
trap 'rm -f tools/intent/counts.tmp.ts' EXIT
bun tools/intent/counts.tmp.ts
