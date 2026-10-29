// The real model and the committed documents. These are the tests that turn the intent into a CI gate.
import { assert, describe, it } from "@effect/vitest";
import {
  Array as Arr,
  Effect,
  FileSystem,
  Order,
  Path,
  Record as Rec,
  String as Str,
} from "effect";

import { checkModel, formatFinding } from "../src/checks.ts";
import { driftOf, generateAll, writeGenerated } from "../src/generate.ts";
import { loadModel } from "../src/load.ts";
import { nodeServices } from "../src/platform.ts";

const root = new URL("../../..", import.meta.url).pathname;

const load = loadModel(root).pipe(Effect.provide(nodeServices));

describe("the model in model/", () => {
  it.effect("passes every check", () =>
    Effect.gen(function* passes() {
      const model = yield* load;

      assert.deepStrictEqual(Arr.map(checkModel(model), formatFinding), []);
    })
  );
});

describe("the generated documents", () => {
  it.effect("equal the committed files", () =>
    Effect.gen(function* equal() {
      const model = yield* load;

      const drift = yield* driftOf(root, generateAll(model)).pipe(
        Effect.provide(nodeServices)
      );

      assert.deepStrictEqual(drift, []);
    })
  );

  it.effect("are caught when a committed file is edited by hand", () =>
    Effect.scoped(
      Effect.gen(function* caught() {
        const fs = yield* FileSystem.FileSystem;
        const path = yield* Path.Path;
        const model = yield* load;
        const files = generateAll(model);
        const dir = yield* fs.makeTempDirectoryScoped();

        yield* writeGenerated(dir, files);

        assert.deepStrictEqual(yield* driftOf(dir, files), []);

        yield* fs.writeFileString(
          path.join(dir, "docs/goals.md"),
          "edited by hand\n"
        );

        assert.deepStrictEqual(yield* driftOf(dir, files), ["docs/goals.md"]);

        yield* fs.remove(path.join(dir, "docs/gaps.md"));

        assert.deepStrictEqual(
          Arr.sort(yield* driftOf(dir, files), Order.String),
          ["docs/gaps.md", "docs/goals.md"]
        );
      })
    ).pipe(Effect.provide(nodeServices))
  );

  it.effect("contain no unrendered value and every diagram has a type", () =>
    Effect.gen(function* clean() {
      const model = yield* load;

      for (const [file, text] of Rec.toEntries(generateAll(model))) {
        assert.notMatch(text, /undefined|\[object|NaN/u, file);

        for (const block of Arr.drop(Str.split("```mermaid\n")(text), 1)) {
          assert.match(block, /^(?:flowchart|classDiagram)/u, file);
        }
      }
    })
  );
});
