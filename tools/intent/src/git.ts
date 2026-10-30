// One way to run git in a directory. The command line names the directory (`-C <dir>`); the environment must not name another
// one. Git exports GIT_DIR, GIT_INDEX_FILE and the rest to every hook it runs, and a child that inherits them works on the
// repository that started the hook, not on `<dir>`: the tests of this package, run by the pre-push hook of a linked worktree,
// once ran `git init` and `git commit` in the real repository (20 fixture commits on a branch, `core.bare = true`).
// The list is `git rev-parse --local-env-vars`.
import { Array as Arr, Record as Rec } from "effect";
import { ChildProcess } from "effect/process";

const repositoryVariables = [
  "GIT_ALTERNATE_OBJECT_DIRECTORIES",
  "GIT_COMMON_DIR",
  "GIT_CONFIG",
  "GIT_CONFIG_COUNT",
  "GIT_CONFIG_PARAMETERS",
  "GIT_DIR",
  "GIT_GRAFT_FILE",
  "GIT_IMPLICIT_WORK_TREE",
  "GIT_INDEX_FILE",
  "GIT_NO_REPLACE_OBJECTS",
  "GIT_OBJECT_DIRECTORY",
  "GIT_PREFIX",
  "GIT_REPLACE_REF_BASE",
  "GIT_SHALLOW_FILE",
  "GIT_WORK_TREE",
] as const;

/** `undefined` removes a variable from the child's environment when `extendEnv` is on. */
const withoutRepositoryVariables: Record<string, undefined> = Rec.fromEntries(
  Arr.map(repositoryVariables, (name) => [name, undefined] as const)
);

export const gitIn = (directory: string, args: readonly string[]) =>
  ChildProcess.make("git", ["-C", directory, ...args], {
    env: withoutRepositoryVariables,
    extendEnv: true,
  });
