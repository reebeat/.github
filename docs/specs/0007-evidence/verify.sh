#!/usr/bin/env bash
# Evidence for spec 0007. Run from the repository root with the product repositories checked out under /srv/share/projects
# (directories reebeat, reebeat-studio, foldkit-flow): bash docs/specs/0007-evidence/verify.sh
set -eu
echo "== F2: the pins"
git diff "${REF:-origin/main}" -- model/sources.yaml | grep '^[+-] '
echo "== F1: sources:verify"
bun tools/intent/src/cli.ts verify-sources --base "${BASE:-/srv/share/projects}" 2>&1 | grep -v '^•\|^✓'
echo "== F3: statuses against ${REF:-origin/main} (REF=feat/0006-triage-ratification until that PR merges)"
bun tools/intent/src/cli.ts status-diff --ref "${REF:-origin/main}" --allow-added-decided 2>&1 | grep -v '^•\|^✓' | grep -E 'INFO|removed|added' | head -12
echo "== F4: rows"
grep -vc '^#' docs/specs/0007-evidence/changed-citations.tsv
