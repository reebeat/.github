#!/usr/bin/env bash
# The negative controls of spec 0001 (F2 to F5), run on a scratch copy of the working tree. Each control makes one deliberate
# defect, runs the gate and prints the command, its exit code and the first finding; the copy is restored after each control.
# Run from the repository root, inside `devenv shell`: bash docs/specs/0001-evidence/controls.sh
# The raw output of the run on the PR head is in controls.txt.
set -u
root=$(pwd)
# The operator's log has grown since spec 0001 (it is replaced by a byte-for-byte copy when lines are added), so the control pins the
# SHA-256 of the 69-line log that spec 0001 copied on 2026-10-29 instead of comparing with the live file.
logsha=75560c44dc88f84371f2d35102c53bb6622e34e52836ce3af42b57320d6abb81
logcopy_is_pinned() {
  if [ "$(sha256sum sources/operator-decisions-2026-10.md | cut -d' ' -f1)" = "$logsha" ]; then
    echo "pinned log: the copy matches"
  else
    echo "pinned log: the copy differs"
    return 1
  fi
}
scratch=$(mktemp -d)
trap 'rm -rf "$scratch"' EXIT
for entry in model tools sources package.json tsconfig.json vite.config.ts; do cp -r "$entry" "$scratch/"; done
rm -rf "$scratch/tools/intent/node_modules"
ln -s "$root/node_modules" "$scratch/node_modules"
ln -s "$root/tools/intent/node_modules" "$scratch/tools/intent/node_modules"
cd "$scratch" || exit 1

cli="bun tools/intent/src/cli.ts"

control() {
  local name=$1
  shift
  local out code
  out=$("$@" 2>&1)
  code=$?
  echo "== $name"
  echo "   command: $*"
  echo "   exit:    $code"
  echo "   first finding: $(echo "$out" | grep -E 'is cut at|TEXT-DANGLING|status change|differ|Model clean|resolves|against main|against HEAD|pinned log' | head -1 | cut -c1-260)"
}

restore() {
  cp "$root/$1" "$1"
}

control "baseline: the model passes" $cli check
control "F5 baseline: the log copy equals the log of 2026-10-29" logcopy_is_pinned

# F2: a plain scalar with " #" is cut by the YAML parser; the loader refuses it.
sed -i '0,/^    rationale: "Issue #14 reports it,/s//    rationale: Issue #14 reports it,/' model/reebeat/goals.yaml
control "F2 plain rationale with ' #' (cut by the parser)" $cli check
restore model/reebeat/goals.yaml

# F3: a rationale that stops at the word Issue.
sed -i '0,/^    rationale: "Issue #14 reports it,.*$/s//    rationale: "Issue"/' model/reebeat/goals.yaml
control "F3 rationale that ends at the word Issue" $cli check
restore model/reebeat/goals.yaml

# F4: a status moves without a decision. The scratch copy gets its own git history, so `main` is the copy as it is now.
git init -q .
git add model
git -c user.name=control -c user.email=control@example.invalid commit -q -m base
control "F4 baseline: no status differs from the base" $cli status-diff --ref HEAD
sed -i '0,/^    status: proposed$/s//    status: decided/' model/org/goals.yaml
control "F4 one status moved from proposed to decided" $cli status-diff --ref HEAD
restore model/org/goals.yaml
printf '  - id: goal-org-added-as-decided\n    status: decided\n' >>model/org/goals.yaml
control "F4 one element added as decided" $cli status-diff --ref HEAD
control "F4 the same, with --allow-added-decided" $cli status-diff --ref HEAD --allow-added-decided
restore model/org/goals.yaml

# F5: the log copy differs from the log of 2026-10-29 by one character.
sed -i '0,/Declarative/s//Declaratife/' sources/operator-decisions-2026-10.md
control "F5 log copy edited by one character" logcopy_is_pinned
restore sources/operator-decisions-2026-10.md

control "after restore: the model passes again" $cli check
