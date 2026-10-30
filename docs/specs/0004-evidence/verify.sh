#!/usr/bin/env bash
# Evidence for spec 0004. Run from the repository root: bash docs/specs/0004-evidence/verify.sh
set -eu
log=${OPERATOR_LOG:-/srv/share/projects/reebeat-intent-sources/operator-decisions-2026-10.md}
echo "== F1: the log copy is the operator's file"
cmp sources/operator-decisions-2026-10.md "$log" && echo "identical: $(wc -l < sources/operator-decisions-2026-10.md) lines, sha256 $(sha256sum sources/operator-decisions-2026-10.md | cut -c1-64)"
echo "== F2: statuses against origin/main"
bun tools/intent/src/cli.ts status-diff --ref origin/main --allow-added-decided
echo "== F4: statements that still say paused"
git grep -n -i 'paused' model || true
echo "== F5: the pins"
git diff origin/main -- model/sources.yaml | wc -l
