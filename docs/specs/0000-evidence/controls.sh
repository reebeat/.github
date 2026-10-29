#!/usr/bin/env bash
# The negative controls of spec 0000 (F2 to F7, F10), run on a scratch copy of the working tree. Each control makes one
# deliberate defect, runs the gate and prints the command, its exit code and the first finding line; the scratch copy is
# restored after each control. Run from the repository root, inside `devenv shell`: bash docs/specs/0000-evidence/controls.sh
# The raw output of the run on the PR head is in controls.txt.
set -u
root=$(pwd)
scratch=$(mktemp -d)
trap 'rm -rf "$scratch"' EXIT
for entry in model tools docs profile sources package.json tsconfig.json vite.config.ts; do cp -r "$entry" "$scratch/"; done
rm -rf "$scratch/tools/intent/node_modules"
ln -s "$root/node_modules" "$scratch/node_modules"
ln -s "$root/tools/intent/node_modules" "$scratch/tools/intent/node_modules"
cd "$scratch" || exit 1

cli="bun tools/intent/src/cli.ts"

# control <name> <command...>: runs the gate, prints exit code and the first line that names a finding.
control() {
  local name=$1
  shift
  local out code
  out=$("$@" 2>&1)
  code=$?
  echo "== $name"
  echo "   command: $*"
  echo "   exit:    $code"
  echo "   first finding: $(echo "$out" | grep -E '^[A-Z]+(-[A-Z]+)+ |GeneratedDrift|beyond|at \["elements"\]|Model clean|Generated files match|resolves|leaks found' | head -1 | cut -c1-230)"
}

restore() {
  cp "$root/$1" "$1"
}

control "baseline: the model passes" $cli check
control "baseline: the generated files match" $cli generate --check

cat >>model/org/goals.yaml <<'YAML'

  - id: goal-org-control-lonely
    kind: goal
    title: Lonely control goal
    statement: A goal that nothing supports.
    status: decided
    source: [log:7]
YAML
control "F2 goal with no support" $cli check
restore model/org/goals.yaml

cat >>model/org/technical.yaml <<'YAML'

  - id: comp-org-control-orphan
    kind: component
    tier: library
    title: Orphan control component
    statement: A component that serves nothing.
    status: decided
    source: [log:7]
YAML
control "F3 component that serves no goal" $cli check
restore model/org/technical.yaml

cat >>model/org/rules.yaml <<'YAML'

  - id: rule-org-control-loose
    kind: rule
    ruleType: constraint
    title: Loose control rule
    statement: A rule that cites no goal.
    status: decided
    source: [log:7]
YAML
control "F4 rule that cites no goal" $cli check
restore model/org/rules.yaml

cat >>model/org/concepts.yaml <<'YAML'

  - id: concept-org-control-sourceless
    kind: concept
    title: Sourceless control concept
    statement: A concept with no source.
    status: decided
YAML
control "F5 element with no source" $cli check
restore model/org/concepts.yaml

cat >>model/org/concepts.yaml <<'YAML'

  - id: concept-org-control-decided
    kind: concept
    title: Decided control concept
    statement: A decided concept whose only source is a repository line.
    status: decided
    source: [reebeat:README.md:3]
YAML
control "F6 decided element whose source is not an operator decision" $cli check
restore model/org/concepts.yaml

echo "edited by hand" >>docs/goals.md
control "F7 generated page edited by hand" $cli generate --check
restore docs/goals.md

sed -i '0,/reebeat:README.md:12/s//reebeat:README.md:9999/' model/reebeat/goals.yaml
control "F10 source line beyond the end of the file" $cli verify-sources
restore model/reebeat/goals.yaml

control "after restore: the model passes again" $cli check

# F12: gitleaks refuses a staged secret. The fake key is assembled at run time so that no literal key is committed.
secret_repo=$(mktemp -d)
git -C "$secret_repo" init -q
printf 'aws_access_key_id = %s\n' "AKIA""QYLPMN5HHHFPZAM7" >"$secret_repo/leak.txt"
git -C "$secret_repo" add leak.txt
control "F12 staged fake secret" bash -c "cd '$secret_repo' && gitleaks git --staged --redact --no-banner --config '$root/.gitleaks.toml' 2>&1 | grep -E 'leaks found'; exit \${PIPESTATUS[0]}"
rm -rf "$secret_repo"
