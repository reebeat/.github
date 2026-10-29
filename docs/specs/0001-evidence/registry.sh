#!/usr/bin/env bash
# The npm registry facts that spec 0001 and model/foldkit-flow/goals.yaml state for 2026-10-29, as commands with their raw output.
# Run with network access: bash docs/specs/0001-evidence/registry.sh
# The registry changes over time: the output in registry.txt is what it answered when the PR was written.
# The commands run in a scratch directory, because this repository's devEngines (bun) makes `npm view` refuse to run here.
set -u
scratch=$(mktemp -d)
trap 'rm -rf "$scratch"' EXIT
cd "$scratch" || exit 1
run() {
  echo "== $*"
  "$@" 2>&1 | head -20
  echo "   exit: ${PIPESTATUS[0]}"
}
unpack() {
  mkdir -p "$1" && (cd "$1" && npm pack "$2" --silent >/dev/null 2>&1 && tar -xzf ./*.tgz)
}
run date -u +%FT%TZ
run npm view foldkit@0.170.0 version peerDependencies --json
run npm view @foldkit/vite-plugin@0.29.0 version peerDependencies --json
run npm view effect@4.1.0 version
run npm view @reebeat/core name version
unpack vite-plugin @foldkit/vite-plugin@0.29.0
echo "== @foldkit/vite-plugin@0.29.0 dist/index.js line 2"
sed -n 2p vite-plugin/package/dist/index.js
unpack effect effect@4.1.0
echo "== effect@4.1.0 package.json mentions the ./crypto export (count of matching lines)"
grep -c '"./crypto"' effect/package/package.json
