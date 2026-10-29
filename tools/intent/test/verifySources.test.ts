// `bun run sources:verify` against a throwaway repository: each kind of file source passes when it is true and fails when it is
// not, so the verifier cannot pass a source it did not read.
import { assert, describe, it } from "@effect/vitest";
import { Array as Arr, Effect } from "effect";

import type { Model } from "../src/model.ts";
import { nodeServices } from "../src/platform.ts";
import { defaultRoots, verifySources } from "../src/verifySources.ts";
import { withChange } from "./fixture.ts";
import { makeGitRepo } from "./gitRepo.ts";

const document =
  "Status: plan\nDecided 2026-10-29: the operator chose A.\nJust a description.\n";

const makeRepo = makeGitRepo("reebeat", { "doc.md": document });

/** The messages that verifying the single source `source` reports against the throwaway repository. */
const problemsFor = (source: string) =>
  Effect.scoped(
    Effect.gen(function* problems() {
      const { base, sha } = yield* makeRepo;

      const fixture = withChange("goal-org-g", (element) => ({
        ...element,
        source: [source],
      }));

      const model: Model = {
        ...fixture,
        sources: {
          ...fixture.sources,
          repos: { ...fixture.sources.repos, reebeat: sha },
        },
      };

      const roots = {
        ...defaultRoots(base),
        reebeat: `${base}/reebeat`,
      };

      const found = yield* verifySources(model, roots, false);

      return Arr.map(found, (problem) => problem.message);
    })
  ).pipe(Effect.provide(nodeServices));

describe("verifySources", () => {
  it.effect("accepts a record line that states the decision", () =>
    Effect.gen(function* accepted() {
      assert.deepStrictEqual(yield* problemsFor("record:reebeat:doc.md:2"), []);
    })
  );

  it.effect("rejects a record line that is only a status header", () =>
    Effect.gen(function* header() {
      const found = yield* problemsFor("record:reebeat:doc.md:1");

      assert.lengthOf(found, 1);
      assert.include(found[0], "header or heading");
    })
  );

  it.effect("rejects a record line that does not say it was decided", () =>
    Effect.gen(function* plain() {
      const found = yield* problemsFor("record:reebeat:doc.md:3");

      assert.lengthOf(found, 1);
      assert.include(found[0], "does not say");
    })
  );

  it.effect("rejects lines beyond the end of the file", () =>
    Effect.gen(function* beyond() {
      const found = yield* problemsFor("reebeat:doc.md:2-9");

      assert.lengthOf(found, 1);
      assert.include(found[0], "beyond");
    })
  );

  it.effect("rejects a file that does not exist at the pinned commit", () =>
    Effect.gen(function* missing() {
      const found = yield* problemsFor("reebeat:nowhere.md:1");

      assert.lengthOf(found, 1);
      assert.include(found[0], "does not exist");
    })
  );

  it.effect(
    "accepts an absent file that is absent and rejects one that exists",
    () =>
      Effect.gen(function* absent() {
        assert.deepStrictEqual(
          yield* problemsFor("absent:reebeat:SECURITY.md"),
          []
        );

        const found = yield* problemsFor("absent:reebeat:doc.md");

        assert.lengthOf(found, 1);
        assert.include(found[0], "cited as absent");
      })
  );
});
