// The composition root: `bun tools/intent/src/cli.ts <command>`.
//   check [--scope <scope>]         run the model checks; exit 1 on any finding
//   generate [--check]              write the generated documents, or fail when they differ from the committed ones
//   tracker-refresh                 rewrite model/tracker.yaml from GitHub (needs `gh`)
//   verify-sources [--show]         check file sources against local checkouts (base directory: --base, default /srv/share/projects)
import { NodeRuntime } from "@effect/platform-node";
import { Array as Arr, Effect, Path, Record as Rec, Schema } from "effect";
import { TaggedError as TaggedErrorClass } from "effect/Schema";

import { checkModel, formatFinding } from "./checks.ts";
import {
  driftOf,
  generateAll,
  GeneratedDrift,
  writeGenerated,
} from "./generate.ts";
import { loadModel } from "./load.ts";
import { nodeServices } from "./platform.ts";
import { refreshTracker } from "./tracker.ts";
import { defaultRoots, verifySources } from "./verifySources.ts";

class CheckFailed extends TaggedErrorClass<
  CheckFailed,
  { readonly brand: unique symbol }
>()("CheckFailed", { message: Schema.String }) {}

const repoRoot = new URL("../../..", import.meta.url).pathname;

const args = process.argv.slice(2);

const flagValue = (name: string): string | undefined => {
  const index = args.indexOf(name);

  return index === -1 ? undefined : args[index + 1];
};

const check = Effect.gen(function* check() {
  const path = yield* Path.Path;
  const model = yield* loadModel(path.resolve(repoRoot));
  const onlyScope = flagValue("--scope");

  const scopeOf = new Map(
    Arr.map(model.items, (item) => [item.id, item.scope] as const)
  );

  const findings = Arr.filter(
    checkModel(model),
    (found) =>
      onlyScope === undefined ||
      found.id === onlyScope ||
      scopeOf.get(found.id) === onlyScope
  );

  if (Arr.isReadonlyArrayNonEmpty(findings)) {
    return yield* new CheckFailed({
      message: `${findings.length} finding(s)\n${Arr.join(Arr.map(findings, formatFinding), "\n")}`,
    });
  }

  return yield* Effect.log(
    `Model clean: ${model.items.length} elements, ${model.tracker.items.length} tracked items.`
  );
});

const generate = Effect.gen(function* generate() {
  const path = yield* Path.Path;
  const root = path.resolve(repoRoot);
  const model = yield* loadModel(root);
  const files = generateAll(model);

  if (args.includes("--check")) {
    const drift = yield* driftOf(root, files);

    return Arr.isReadonlyArrayNonEmpty(drift)
      ? yield* new GeneratedDrift({
          message: `generated files differ from the committed ones (run \`bun run generate\`):\n${Arr.join(drift, "\n")}`,
        })
      : yield* Effect.log(
          `Generated files match: ${Arr.length(Rec.keys(files))} files.`
        );
  }

  const written = yield* writeGenerated(root, files);

  return yield* Effect.log(`Wrote ${written} files.`);
});

const verify = Effect.gen(function* verify() {
  const path = yield* Path.Path;
  const model = yield* loadModel(path.resolve(repoRoot));

  const problems = yield* verifySources(
    model,
    defaultRoots(flagValue("--base") ?? "/srv/share/projects"),
    args.includes("--show")
  );

  return Arr.isReadonlyArrayNonEmpty(problems)
    ? yield* new CheckFailed({
        message: `${problems.length} source problem(s)\n${Arr.join(
          Arr.map(problems, (problem) => `${problem.id}: ${problem.message}`),
          "\n"
        )}`,
      })
    : yield* Effect.log("Every file source resolves.");
});

const trackerRefresh = Effect.gen(function* trackerRefreshCommand() {
  const path = yield* Path.Path;
  const count = yield* refreshTracker(path.resolve(repoRoot));

  return yield* Effect.log(`Tracker refreshed: ${count} items.`);
});

const [command = ""] = args;

const program = Effect.gen(function* main() {
  switch (command) {
    case "check": {
      return yield* check;
    }

    case "generate": {
      return yield* generate;
    }

    case "tracker-refresh": {
      return yield* trackerRefresh;
    }

    case "verify-sources": {
      return yield* verify;
    }

    default: {
      return yield* Effect.die(`unknown command ${command}`);
    }
  }
});

NodeRuntime.runMain(program.pipe(Effect.provide(nodeServices)));
