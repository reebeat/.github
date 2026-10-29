// Refreshes model/tracker.yaml: for every issue and pull request the model cites, its title and state from GitHub.
// The only network call of the tool; the checks and the generators read the snapshot, so CI needs no token.
import {
  Array as Arr,
  DateTime,
  Effect,
  FileSystem,
  Option,
  Order,
  Path,
  Schema,
  String as Str,
} from "effect";
import { ChildProcess, ChildProcessSpawner } from "effect/process";
import { stringify } from "yaml";

import { loadModel } from "./load.ts";
import { filterSome } from "./model.ts";
import { parseRef, parseSource, trackerKey } from "./refs.ts";
import type { Source } from "./refs.ts";
import { repoSlugs } from "./vocabulary.ts";

type Tracked = Extract<Source, { kind: "issue" | "pr" }>;

const GhItem = Schema.Struct({
  merged: Schema.optionalKey(Schema.Boolean),
  state: Schema.String,
  title: Schema.String,
});

const decodeGh = Schema.decodeUnknownEffect(Schema.fromJsonString(GhItem));

const tracked = (texts: readonly string[]): readonly Tracked[] =>
  filterSome(texts, (text) =>
    Option.filter(
      parseSource(text),
      (source): source is Tracked =>
        source.kind === "issue" || source.kind === "pr"
    )
  );

const trackerState = (
  item: typeof GhItem.Type
): "closed" | "merged" | "open" => {
  if (item.merged === true) {
    return "merged";
  }

  return item.state === "open" ? "open" : "closed";
};

const fetchItem = Effect.fn("fetchItem")(function* fetchItem(item: Tracked) {
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
  const endpoint = `repos/${repoSlugs[item.repo]}/${item.kind === "pr" ? "pulls" : "issues"}/${item.number}`;

  const body = yield* spawner.string(
    ChildProcess.make("gh", ["api", endpoint])
  );

  const decoded = yield* decodeGh(body);

  const state = trackerState(decoded);

  return { ref: trackerKey(item), state, title: decoded.title };
});

export const refreshTracker = Effect.fn("refreshTracker")(
  function* refreshTracker(root: string) {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const model = yield* loadModel(root);

    const texts = Arr.flatMap(model.items, (item) => [
      ...item.source,
      ...Arr.filter(item.refs ?? [], (ref) => Option.isSome(parseRef(ref))),
    ]);

    const unique = Arr.dedupeWith(
      tracked(texts),
      (a, b) => trackerKey(a) === trackerKey(b)
    );

    const items = yield* Effect.forEach(unique, fetchItem, { concurrency: 4 });

    const sorted = Arr.sort(
      items,
      Order.mapInput(Order.String, (item: { readonly ref: string }) => item.ref)
    );

    const now = yield* DateTime.now;
    const asOf = Str.slice(0, 10)(DateTime.formatIso(now));

    const header =
      "# A snapshot of the GitHub issues and pull requests the model cites. Written by `bun run tracker:refresh`; do not edit.\n";

    yield* fs.writeFileString(
      path.join(root, "model/tracker.yaml"),
      `${header}${stringify({ asOf, items: sorted })}`
    );

    return sorted.length;
  }
);
