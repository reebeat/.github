#!/usr/bin/env bash
# Reproduces the citation renumbering of spec 0001 as a dry run on the model of `main` (before the PR), and its raw output.
# Run from the repository root with the product repositories checked out: bash docs/specs/0001-evidence/remap.sh
set -eu
scratch=$(mktemp -d)
trap 'rm -rf "$scratch"' EXIT
git archive main model | tar -x -C "$scratch"
cp docs/specs/0001-evidence/remap.ts.txt "$scratch/remap.ts"
export MODEL_ROOT="$scratch/model"
echo "== reebeat 0bccf42 -> 82ee66f"
bun "$scratch/remap.ts" reebeat /srv/share/projects/reebeat 0bccf4294e0d3fe29111812738dc74cd29a30c38 82ee66f8806558460917b33ad9ad8d21c47a9a5b
echo "== foldkit-flow 5dd44a9 -> 8124d5b"
bun "$scratch/remap.ts" foldkit-flow /srv/share/projects/foldkit-flow 5dd44a9fe34f1adabca41d9757eefe410f03f60b 8124d5b08fe5e87c75c85b067c3079e2ce46a5a6
