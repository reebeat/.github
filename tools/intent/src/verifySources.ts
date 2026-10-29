// Checks every file-based source against a local checkout at the pinned commit: the file exists, the cited lines exist, a
// `record:` line says "decided" or "operator", an `absent:` file is really absent. With `show`, prints the cited text for
// a human or a reviewer agent to judge. Not part of CI (CI has no checkouts); run it where the repositories are.
import { Array as Arr, Effect, Option, Schema, String as Str } from "effect";
import { ChildProcess, ChildProcessSpawner } from "effect/process";
import { TaggedError as TaggedErrorClass } from "effect/Schema";

import { filterSome } from "./model.ts";
import type { Model } from "./model.ts";
import { parseSource } from "./refs.ts";
import type { Source } from "./refs.ts";
import type { RepoKey } from "./vocabulary.ts";

type Located = Extract<Source, { kind: "file" | "record" | "absent" }>;

class CheckoutUnusable extends TaggedErrorClass<
  CheckoutUnusable,
  { readonly brand: unique symbol }
>()("CheckoutUnusable", { message: Schema.String }) {}

/**
 * The text of `path` at `sha` in the checkout, or `None` when the commit exists and the path does not. A checkout that
 * is missing, or that lacks the commit, fails: an absence is never inferred from a failed command.
 */
export const gitShow = Effect.fn("gitShow")(function* gitShow(
  checkout: string,
  sha: string,
  path: string
) {
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;

  const git = (...args: readonly string[]) =>
    spawner.exitCode(ChildProcess.make("git", ["-C", checkout, ...args]));

  const hasCommit = yield* git("cat-file", "-e", `${sha}^{commit}`);

  if (hasCommit !== 0) {
    return yield* new CheckoutUnusable({
      message: `${checkout} does not hold commit ${sha} (git exit ${hasCommit})`,
    });
  }

  const hasPath = yield* git("cat-file", "-e", `${sha}:${path}`);

  return hasPath === 0
    ? Option.some(
        yield* spawner.string(
          ChildProcess.make("git", ["-C", checkout, "show", `${sha}:${path}`])
        )
      )
    : Option.none<string>();
});

const decidedWords = /decided|operator/iu;

/** A header or heading shows the operator accepted a whole document, not a single decision. */
const wholeDocumentLine = /^\s*(?:#|Status:|\*\*Decided by|Decided by:)/u;

const verifyOne = Effect.fn("verifyOne")(function* verifyOne(
  id: string,
  source: Located,
  roots: Readonly<Record<RepoKey, string>>,
  model: Model,
  show: boolean
) {
  const content = yield* gitShow(
    roots[source.repo],
    model.sources.repos[source.repo],
    source.path
  );

  if (source.kind === "absent") {
    return Option.isSome(content)
      ? [
          {
            id,
            message: `${source.repo}:${source.path} exists but is cited as absent`,
          },
        ]
      : [];
  }

  if (Option.isNone(content)) {
    return [
      {
        id,
        message: `${source.repo}:${source.path} does not exist at the pinned commit`,
      },
    ];
  }

  const lines = Str.split(Str.replace(/\n$/u, "")(content.value), "\n");

  if (source.to > lines.length) {
    return [
      {
        id,
        message: `${source.repo}:${source.path}:${source.from}-${source.to} is beyond the ${lines.length} lines of the file`,
      },
    ];
  }

  const fullText = Arr.join(
    Arr.take(Arr.drop(lines, source.from - 1), source.to - source.from + 1),
    "\n"
  );

  if (Str.isEmpty(Str.trim(fullText))) {
    return [
      {
        id,
        message: `${source.repo}:${source.path}:${source.from}-${source.to} cites only blank lines`,
      },
    ];
  }

  const cited = Arr.join(
    Arr.map(Str.split(fullText, "\n"), (line) => Str.slice(0, 200)(line)),
    "\n"
  );

  if (show) {
    yield* Effect.log(
      `${id} <- ${source.repo}:${source.path}:${source.from}-${source.to}\n${cited}`
    );
  }

  if (source.kind !== "record") {
    return [];
  }

  if (wholeDocumentLine.test(fullText)) {
    return [
      {
        id,
        message: `record source ${source.repo}:${source.path}:${source.from} is a header or heading; cite the line that states the decision`,
      },
    ];
  }

  return decidedWords.test(fullText)
    ? []
    : [
        {
          id,
          message: `record source ${source.repo}:${source.path}:${source.from} does not say "decided" or "operator"`,
        },
      ];
});

export const verifySources = Effect.fn("verifySources")(function* verifySources(
  model: Model,
  roots: Readonly<Record<RepoKey, string>>,
  show: boolean
) {
  const located = Arr.flatMap(model.items, (item) =>
    filterSome(item.source, (text) =>
      Option.flatMap(parseSource(text), (source) =>
        source.kind === "file" ||
        source.kind === "record" ||
        source.kind === "absent"
          ? Option.some([item.id, source] as const)
          : Option.none()
      )
    )
  );

  const problems = yield* Effect.forEach(
    located,
    ([id, source]) => verifyOne(id, source, roots, model, show),
    { concurrency: 8 }
  );

  return Arr.flatten(problems);
});

export const defaultRoots = (
  base: string
): Readonly<Record<RepoKey, string>> => ({
  "foldkit-flow": `${base}/foldkit-flow`,
  reebeat: `${base}/reebeat`,
  studio: `${base}/reebeat-studio`,
});
