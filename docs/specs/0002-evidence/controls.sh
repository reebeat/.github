#!/usr/bin/env bash
# The negative controls of spec 0002, run on a scratch copy of the working tree. Each control makes one deliberate defect, runs the
# gate and prints the command, its exit code and the first finding; the copy is restored after each control.
# Run from the repository root, inside `devenv shell`, with BASE set to the ref the model is compared with:
#   BASE=feat/0001-model-corrections bash docs/specs/0002-evidence/controls.sh
# The raw output of the run on the PR head is in controls.txt.
set -u
root=$(pwd)
base=${BASE:-main}
# The operator's log grows; the control pins the SHA-256 of the 113-line log that this spec copied on 2026-10-29.
logsha=2c39d49315918297b99215fa6ddf181842a1793ce4a1ea4f2a75f9609f65a496
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
for entry in model tools sources docs/specs/0002-evidence package.json tsconfig.json vite.config.ts; do
  mkdir -p "$scratch/$(dirname "$entry")"
  cp -r "$entry" "$scratch/$entry"
done
rm -rf "$scratch/tools/intent/node_modules"
ln -s "$root/node_modules" "$scratch/node_modules"
ln -s "$root/tools/intent/node_modules" "$scratch/tools/intent/node_modules"
cd "$scratch" || exit 1

# The scratch copy gets its own git history. Its base commit holds the model of $base, so verify.sh compares with that.
git init -q .
(cd "$root" && git archive "$base" model) | tar -x -C "$scratch"
git add model
git -c user.name=control -c user.email=control@example.invalid commit -q -m base
rm -rf model
cp -r "$root/model" model

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
  echo "   first finding: $({ echo "$out" | grep -E 'TRIAGE-|PROBLEM'; echo "$out" | grep -E 'Model clean|pinned log|the changed set equals'; } | head -1 | cut -c1-260)"
}

restore() {
  cp "$root/$1" "$1"
}

control "baseline: the model passes (it holds decided problems that keep a gap)" $cli check
control "baseline: F2 and F3 pass" env BASE=HEAD bash docs/specs/0002-evidence/verify.sh
control "baseline: the log copy is the log of 2026-10-29" logcopy_is_pinned

# T1: advice for an element that is decided.
printf '  - id: constraint-org-working-name\n    advice: "Recommended: confirm"\n' >>model/triage.yaml
control "T1 triage advice for a decided element" $cli check
restore model/triage.yaml

# T2: advice for an element that does not exist.
printf '  - id: goal-org-nowhere\n    advice: "Recommended: confirm"\n' >>model/triage.yaml
control "T2 triage advice for an unknown id" $cli check
restore model/triage.yaml

# F2: one more status moves than the operator answered.
sed -i '0,/^    status: proposed$/s//    status: decided/' model/org/actors.yaml
control "F2 one status moves that no answer covers" env BASE=HEAD bash docs/specs/0002-evidence/verify.sh
restore model/org/actors.yaml

# F3: an answered element cites another log line (99 for 100): the model stays valid but the answer is not cited.
sed -i 's/log:100\b/log:99/' model/studio/goals.yaml model/studio/rules.yaml
control "F3 an answered element cites another log line" env BASE=HEAD bash docs/specs/0002-evidence/verify.sh
for f in goals rules; do restore "model/studio/$f.yaml"; done

# F4: the log copy differs by one character.
sed -i '0,/Declarative/s//Declaratife/' sources/operator-decisions-2026-10.md
control "F4 log copy edited by one character" logcopy_is_pinned
restore sources/operator-decisions-2026-10.md

control "after restore: the model passes again" $cli check
