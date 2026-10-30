// Run by gitEnv.test.ts in a child process whose environment is a hook's: it builds a fixture repository and compares statuses in
// it, with the tools of this package. Prints the fixture's commit. The real repository named by GIT_DIR must stay as it is.
import { NodeRuntime } from "@effect/platform-node";
import { Console, Effect } from "effect";

import { nodeServices } from "../src/platform.ts";
import { statusDiffAgainst } from "../src/statusDiff.ts";
import { makeGitRepo } from "./gitRepo.ts";

const program = Effect.gen(function* underHook() {
  const { dir, sha } = yield* makeGitRepo("other", {
    "model/foldkit-flow/goals.yaml": "elements: []\n",
    "model/org/goals.yaml": "elements: []\n",
    "model/studio/goals.yaml": "elements: []\n",
    "model/tsukuri/goals.yaml": "elements: []\n",
  });

  const diff = yield* statusDiffAgainst(dir, "HEAD");

  yield* Console.log(`${sha} ${diff.changed.length}`);
}).pipe(Effect.scoped);

NodeRuntime.runMain(program.pipe(Effect.provide(nodeServices)));
