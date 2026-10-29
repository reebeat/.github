#!/usr/bin/env bash
# Spec 0002 falsifiers F2 and F3. Run from the repository root, inside `devenv shell`:
#   BASE=feat/0001-model-corrections bash docs/specs/0002-evidence/verify.sh
# BASE is the git ref whose statuses the model is compared with (the branch below this PR, or `main` once it merged).
# Exit 0 only when (F2) the elements whose status changed are exactly the elements of answers.tsv, all to `decided`, and
# (F3) each of them is decided and cites the log line of its decision, and no other element cites a log line 75 to 111.
set -u
base=${BASE:-main}
cli="bun tools/intent/src/cli.ts"
evidence=docs/specs/0002-evidence
code=0

changed=$($cli status-diff --ref "$base" 2>&1 | grep -oE '^[a-z]+-[a-z0-9-]+: [a-z]+ -> [a-z]+' | sort -u)
echo "== F2 status changes against $base: $(echo "$changed" | grep -c .)"
echo "$changed" | grep -v -- '-> decided$' && { echo "PROBLEM a status changed to something other than decided"; code=1; }
echo "$changed" | cut -d: -f1 | LC_ALL=C sort -u >"${TMPDIR:-/tmp}/changed-ids.txt"
tail -n +2 "$evidence/answers.tsv" | cut -f3 | LC_ALL=C sort -u >"${TMPDIR:-/tmp}/answered-ids.txt"
extra=$(LC_ALL=C comm -3 "${TMPDIR:-/tmp}/changed-ids.txt" "${TMPDIR:-/tmp}/answered-ids.txt")
if [ -n "$extra" ]; then
  echo "PROBLEM the changed set and the answered set differ (left: changed only, right: answered only):"
  echo "$extra"
  code=1
else
  echo "the changed set equals the answered set"
fi

echo "== F3 each answered element is decided and cites its log line"
cp "$evidence/verify-answers.ts.txt" tools/intent/verify-answers.tmp.ts
ANSWERS="$evidence/answers.tsv" bun tools/intent/verify-answers.tmp.ts || code=1
rm -f tools/intent/verify-answers.tmp.ts
echo "exit: $code"
exit "$code"
