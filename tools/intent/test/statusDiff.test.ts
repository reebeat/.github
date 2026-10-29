import { assert, describe, it } from "@effect/vitest";
import { Array as Arr, Effect, FileSystem, Record as Rec } from "effect";

import { nodeServices } from "../src/platform.ts";
import {
  diffStatuses,
  statusDiffAgainst,
  statusesOfText,
} from "../src/statusDiff.ts";
import { makeGitRepo } from "./gitRepo.ts";

const file = (statuses: Readonly<Record<string, string>>): string =>
  `elements:\n${Arr.join(
    Arr.map(
      Rec.toEntries(statuses),
      ([id, status]) => `  - id: ${id}\n    status: ${status}\n`
    ),
    ""
  )}`;

describe("diffStatuses", () => {
  it("reports a changed status and lists added and removed elements", () => {
    const diff = diffStatuses(
      { "goal-a-a": "proposed", "goal-a-b": "open", "goal-a-c": "decided" },
      { "goal-a-a": "decided", "goal-a-b": "open", "goal-a-d": "proposed" }
    );

    assert.deepStrictEqual(diff.changed, ["goal-a-a: proposed -> decided"]);
    assert.deepStrictEqual(diff.added, ["goal-a-d"]);
    assert.deepStrictEqual(diff.removed, ["goal-a-c"]);
  });

  it("reports nothing when the statuses are equal", () => {
    const same = { "goal-a-a": "proposed" };

    assert.deepStrictEqual(diffStatuses(same, same), {
      added: [],
      addedDecided: [],
      changed: [],
      removed: [],
    });
  });

  it("names an element that is added as decided", () => {
    const diff = diffStatuses(
      { "goal-a-a": "proposed" },
      { "goal-a-a": "proposed", "goal-a-b": "decided", "goal-a-c": "open" }
    );

    assert.deepStrictEqual(diff.addedDecided, ["goal-a-b"]);
    assert.deepStrictEqual(diff.added, ["goal-a-b", "goal-a-c"]);
  });
});

describe("statusesOfText", () => {
  it("reads id and status of each element and ignores other fields", () => {
    assert.deepStrictEqual(
      statusesOfText(
        "elements:\n  - id: goal-a-a\n    status: open\n    title: x\n"
      ),
      { "goal-a-a": "open" }
    );
  });
});

describe("statusDiffAgainst", () => {
  const emptyScopes = {
    "model/foldkit-flow/goals.yaml": "elements: []\n",
    "model/reebeat/goals.yaml": "elements: []\n",
    "model/studio/goals.yaml": "elements: []\n",
  };

  it.effect("sees no change in a clean tree and a change after an edit", () =>
    Effect.scoped(
      Effect.gen(function* againstCommit() {
        const fs = yield* FileSystem.FileSystem;

        const { dir } = yield* makeGitRepo("model-repo", {
          ...emptyScopes,
          "model/org/goals.yaml": file({
            "goal-org-a": "proposed",
            "goal-org-b": "open",
          }),
        });

        const clean = yield* statusDiffAgainst(dir, "HEAD");

        assert.deepStrictEqual(clean.changed, []);

        yield* fs.writeFileString(
          `${dir}/model/org/goals.yaml`,
          file({ "goal-org-a": "decided", "goal-org-c": "proposed" })
        );

        const edited = yield* statusDiffAgainst(dir, "HEAD");

        assert.deepStrictEqual(edited.changed, [
          "goal-org-a: proposed -> decided",
        ]);
        assert.deepStrictEqual(edited.added, ["goal-org-c"]);
        assert.deepStrictEqual(edited.removed, ["goal-org-b"]);
      })
    ).pipe(Effect.provide(nodeServices))
  );
});
