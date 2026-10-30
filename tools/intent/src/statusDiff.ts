// Compares the status of every element of the model at a git ref with the working tree. A change of status is a decision
// (the operator decides, then the status moves), so a PR that says "no status changed" can prove it: `status-diff <ref>`
// exits 1 when an element that exists on both sides has another status. Added and removed elements are reported.
import {
  Array as Arr,
  Effect,
  FileSystem,
  Path,
  Record as Rec,
  Result,
  Schema,
  String as Str,
} from "effect";
import { ChildProcessSpawner } from "effect/process";
import { parse } from "yaml";

import { gitIn } from "./git.ts";
import { scopes } from "./vocabulary.ts";

const StatusFile = Schema.Struct({
  elements: Schema.Array(
    Schema.Struct({ id: Schema.String, status: Schema.String })
  ),
});

const decodeStatusFile = Schema.decodeUnknownResult(StatusFile);

/** The id to status map of one model file's text; a file that does not decode has no elements. */
export const statusesOfText = (
  text: string
): Readonly<Record<string, string>> =>
  Result.match(decodeStatusFile(parse(text)), {
    onFailure: () => ({}),
    onSuccess: (file) =>
      Rec.fromEntries(
        Arr.map(file.elements, (element) => [element.id, element.status])
      ),
  });

export interface StatusDiff {
  readonly added: readonly string[];
  /** Added elements that arrive as `decided`: a decision cannot be created by adding an element. */
  readonly addedDecided: readonly string[];
  readonly changed: readonly string[];
  readonly removed: readonly string[];
}

export const diffStatuses = (
  before: Readonly<Record<string, string>>,
  after: Readonly<Record<string, string>>
): StatusDiff => {
  const added = Arr.filter(Rec.keys(after), (id) => !(id in before));

  return {
    added,
    addedDecided: Arr.filter(added, (id) => after[id] === "decided"),
    changed: Arr.map(
      Arr.filter(
        Rec.keys(after),
        (id) => id in before && before[id] !== after[id]
      ),
      (id) => `${id}: ${before[id] ?? ""} -> ${after[id] ?? ""}`
    ),
    removed: Arr.filter(Rec.keys(before), (id) => !(id in after)),
  };
};

const modelFile = new RegExp(
  `^model/(${Arr.join(scopes, "|")})/[^/]+\\.yaml$`,
  "u"
);

const statusesAtRef = Effect.fn("statusesAtRef")(function* statusesAtRef(
  root: string,
  ref: string
) {
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;

  const git = (...args: readonly string[]) => spawner.string(gitIn(root, args));

  const listing = yield* git(
    "ls-tree",
    "-r",
    "--name-only",
    ref,
    "--",
    "model"
  );

  const files = Arr.filter(Str.split(listing, "\n"), (name) =>
    modelFile.test(name)
  );

  const texts = yield* Effect.forEach(files, (name) =>
    git("show", `${ref}:${name}`)
  );

  return Rec.fromEntries(
    Arr.flatMap(texts, (text) => Rec.toEntries(statusesOfText(text)))
  );
});

const statusesNow = Effect.fn("statusesNow")(function* statusesNow(
  root: string
) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;

  const perScope = yield* Effect.forEach(scopes, (scope) =>
    Effect.gen(function* scopeStatuses() {
      const dir = path.join(root, "model", scope);

      const names = Arr.filter(
        yield* fs.readDirectory(dir),
        Str.endsWith(".yaml")
      );

      const texts = yield* Effect.forEach(names, (name) =>
        fs.readFileString(path.join(dir, name))
      );

      return Arr.flatMap(texts, (text) => Rec.toEntries(statusesOfText(text)));
    })
  );

  return Rec.fromEntries(Arr.flatten(perScope));
});

export const statusDiffAgainst = Effect.fn("statusDiffAgainst")(
  function* statusDiffAgainst(root: string, ref: string) {
    const before = yield* statusesAtRef(root, ref);
    const after = yield* statusesNow(root);

    return diffStatuses(before, after);
  }
);
