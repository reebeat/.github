// A plain YAML scalar is cut at " #". The loader compares the text of a model file with what the parser kept, so a cut
// value fails to load instead of shortening a rationale.
import { assert, describe, it } from "@effect/vitest";
import { Effect, Exit } from "effect";

import { parseYaml } from "../src/load.ts";
import { cutValues } from "../src/yamlText.ts";

const cutText =
  "elements:\n  - rationale: Issue #15 reports it and proposes a fix.\n";

describe("cutValues", () => {
  it("finds a plain scalar that a trailing comment cut", () => {
    const [cut] = cutValues(cutText);

    assert.strictEqual(cut?.kept, "Issue");
    assert.strictEqual(cut?.lost, "15 reports it and proposes a fix.");
    assert.strictEqual(cut?.line, 2);
  });

  it("finds a cut inside a flow list", () => {
    assert.lengthOf(cutValues("source: [log:7, a b #c]\n"), 1);
  });

  it("accepts the same text when it is quoted", () => {
    assert.deepStrictEqual(
      cutValues('elements:\n  - rationale: "Issue #15 reports it."\n'),
      []
    );
  });

  it("accepts the same text in a folded block", () => {
    assert.deepStrictEqual(
      cutValues("elements:\n  - rationale: >-\n      Issue #15 reports it.\n"),
      []
    );
  });

  it("accepts a comment on its own line", () => {
    assert.deepStrictEqual(
      cutValues("elements:\n  # ---- a section ----\n  - id: goal-a-b\n"),
      []
    );
  });

  it("accepts a hash without a space before it", () => {
    assert.deepStrictEqual(cutValues("source: [issue:reebeat#19]\n"), []);
  });
});

describe("parseYaml", () => {
  it.effect("fails on a cut value and names the line and the lost text", () =>
    Effect.gen(function* failsOnCut() {
      const exit = yield* Effect.exit(parseYaml("model/x/y.yaml", cutText));

      assert.isTrue(Exit.isFailure(exit));
      assert.include(String(exit), "line 2");
      assert.include(String(exit), "15 reports it");
    })
  );

  it.effect("loads the quoted text whole", () =>
    Effect.gen(function* loadsQuoted() {
      const data = yield* parseYaml(
        "model/x/y.yaml",
        'rationale: "Issue #15 reports it."\n'
      );

      assert.deepStrictEqual(data, { rationale: "Issue #15 reports it." });
    })
  );
});
