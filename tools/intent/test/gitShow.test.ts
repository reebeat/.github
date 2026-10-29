// The source verifier must fail closed both ways: a present file is found, an absent path is reported absent, and a checkout
// that cannot answer is an error, never an absence.
import { assert, describe, it } from "@effect/vitest";
import { Effect, Exit, FileSystem, Option, Path, String as Str } from "effect";

import { nodeServices } from "../src/platform.ts";
import { gitShow } from "../src/verifySources.ts";
import { makeGitRepo } from "./gitRepo.ts";

const unknownSha = Str.repeat(40)("0");

/** A repository with one commit that holds `hello.txt`. */
const makeRepo = makeGitRepo("repo", { "hello.txt": "one\ntwo\n" });

describe("gitShow", () => {
  it.effect("returns the text of a path that exists", () =>
    Effect.scoped(
      Effect.gen(function* present() {
        const { dir, sha } = yield* makeRepo;
        const text = yield* gitShow(dir, sha, "hello.txt");

        assert.deepStrictEqual(text, Option.some("one\ntwo\n"));
      })
    ).pipe(Effect.provide(nodeServices))
  );

  it.effect("returns none for a path that does not exist at the commit", () =>
    Effect.scoped(
      Effect.gen(function* absent() {
        const { dir, sha } = yield* makeRepo;
        const text = yield* gitShow(dir, sha, "CONTRIBUTING.md");

        assert.isTrue(Option.isNone(text));
      })
    ).pipe(Effect.provide(nodeServices))
  );

  it.effect(
    "fails, and does not report an absence, when the commit is unknown",
    () =>
      Effect.scoped(
        Effect.gen(function* unknownCommit() {
          const { dir } = yield* makeRepo;

          const exit = yield* Effect.exit(
            gitShow(dir, unknownSha, "hello.txt")
          );

          assert.isTrue(Exit.isFailure(exit));
        })
      ).pipe(Effect.provide(nodeServices))
  );

  it.effect(
    "fails, and does not report an absence, when the checkout is missing",
    () =>
      Effect.scoped(
        Effect.gen(function* missingCheckout() {
          const fs = yield* FileSystem.FileSystem;
          const path = yield* Path.Path;
          const dir = yield* fs.makeTempDirectoryScoped();

          const exit = yield* Effect.exit(
            gitShow(path.join(dir, "nowhere"), unknownSha, "CONTRIBUTING.md")
          );

          assert.isTrue(Exit.isFailure(exit));
        })
      ).pipe(Effect.provide(nodeServices))
  );
});
