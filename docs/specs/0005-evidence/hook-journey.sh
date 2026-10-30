#!/usr/bin/env bash
# Evidence for spec 0005, F2. Run from a LINKED worktree of this repository, on the branch to push, after `git fetch`.
#   bash docs/specs/0005-evidence/hook-journey.sh [<branch>]
# The push runs the repository's real pre-push hook (`bun run test`) with git's own hook environment. The main clone's refs, HEAD,
# core.bare and status are recorded before and after. Pushes `<branch>` to `origin` (fast-forward only: no force).
set -eu
branch=${1:-$(git rev-parse --abbrev-ref HEAD)}
main=$(cd "$(git rev-parse --git-common-dir)/.." && pwd)
[ "$(git rev-parse --absolute-git-dir)" != "$(git -C "$main" rev-parse --absolute-git-dir)" ] || { echo "run this from a linked worktree"; exit 2; }
snap() { git -C "$main" for-each-ref --format='%(refname) %(objectname)' refs/heads; echo "HEAD $(git -C "$main" rev-parse HEAD)"; echo "core.bare $(git -C "$main" config --get core.bare)"; echo "status $(git -C "$main" status --porcelain | wc -l)"; }
snap > /tmp/hook-journey.before
echo "worktree $(pwd) pushes $branch; main clone $main"
git push origin "refs/heads/$branch:refs/heads/$branch"
snap > /tmp/hook-journey.after
# local branches only: the push itself adds a remote-tracking ref, which is no change of the clone's work
if diff /tmp/hook-journey.before /tmp/hook-journey.after; then echo "main clone unchanged by the push (refs, HEAD, core.bare, status)"; else echo "MAIN CLONE CHANGED"; exit 1; fi
