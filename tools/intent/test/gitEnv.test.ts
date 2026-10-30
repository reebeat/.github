// The tools and the tests of this package run git in a temporary repository. Git exports GIT_DIR, GIT_INDEX_FILE and the rest to
// a hook, and a child that inherits them works on the repository that started the hook. This test is that hook: a child process
// gets those variables, pointing at a "real" repository, and runs the tools on another one (test/underHook.ts). The real
// repository must come out as it went in.
import { assert, describe, it } from "@effect/vitest";
import { Array as Arr, Effect, String as Str } from "effect";
import { ChildProcess, ChildProcessSpawner } from "effect/process";

import { gitIn } from "../src/git.ts";
import { nodeServices } from "../src/platform.ts";
import { makeGitRepo } from "./gitRepo.ts";

const childScript = new URL("underHook.ts", import.meta.url).pathname;

describe("git in a hook environment", () => {
  it.effect("leaves the repository that started the hook untouched", () =>
    Effect.scoped(
      Effect.gen(function* underAHook() {
        const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;

        const real = yield* makeGitRepo("real", { "keep.txt": "real\n" });

        const realGit = (...args: readonly string[]) =>
          spawner.string(gitIn(real.dir, args));

        const state = Effect.all({
          bare: realGit("config", "--get", "core.bare"),
          head: realGit("rev-parse", "HEAD"),
          refs: realGit("for-each-ref"),
          status: realGit("status", "--porcelain"),
          tree: realGit("ls-files"),
        });

        const before = yield* state;

        const out = yield* spawner.string(
          ChildProcess.make("bun", [childScript], {
            env: {
              GIT_DIR: `${real.dir}/.git`,
              GIT_INDEX_FILE: `${real.dir}/.git/index`,
              GIT_WORK_TREE: real.dir,
            },
            extendEnv: true,
          })
        );

        const [childSha, changed] = Arr.fromIterable(
          Str.split(" ")(Str.trim(out))
        );

        assert.notStrictEqual(childSha, real.sha);
        assert.strictEqual(changed, "0");
        assert.deepStrictEqual(yield* state, before);
      })
    ).pipe(Effect.provide(nodeServices))
  );
});
