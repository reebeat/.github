// The generated documents as a map of path to text, and the two things the CLI does with it: write it, or compare it with
// the committed files (the drift check).
import {
  Array as Arr,
  Effect,
  FileSystem,
  Path,
  Record as Rec,
  Schema,
  String as Str,
} from "effect";
import { TaggedError as TaggedErrorClass } from "effect/Schema";

import type { Model } from "./model.ts";
import {
  renderGaps,
  renderBusinessModel,
  renderRoadmap,
} from "./render/business.ts";
import { productFiles } from "./render/product.ts";
import { renderIndex, renderProfile } from "./render/profile.ts";
import { subModelPageFiles } from "./render/subModels.ts";
import { productScopes } from "./vocabulary.ts";

/** One blank line at most between blocks, one newline at the end. */
const normalize = (text: string): string =>
  `${Str.trim(Str.replaceAll(/\n{3,}/gu, "\n\n")(text))}\n`;

const longLink =
  /\]\((?<url>(?:https:\/\/github\.com|(?:\.\.\/)+sources)\/[^)\s]+)\)/gu;

/** Replaces each distinct long link target by a numbered reference, defined once at the end of the page. */
const compactLinks = (text: string): string => {
  const urls = Arr.dedupe(
    Arr.map(
      Arr.fromIterable(Str.matchAll(longLink)(text)),
      (found) => found.groups?.url ?? ""
    )
  );

  return urls.length === 0
    ? text
    : `${Arr.reduce(urls, text, (replaced, url, index) =>
        Str.replaceAll(`](${url})`, `][${index + 1}]`)(replaced)
      )}\n\n${Arr.join(
        Arr.map(urls, (url, index) => `[${index + 1}]: ${url}`),
        "\n"
      )}`;
};

export const generateAll = (model: Model): Readonly<Record<string, string>> =>
  Rec.map(
    {
      "docs/README.md": renderIndex(model),
      "docs/business-model.md": renderBusinessModel(model),
      "docs/gaps.md": renderGaps(model),
      "docs/roadmap.md": renderRoadmap(model),
      "profile/README.md": renderProfile(model),
      ...subModelPageFiles(model),
      ...productFiles(model, productScopes),
    },
    (text, file) =>
      normalize(Str.startsWith("docs/")(file) ? compactLinks(text) : text)
  );

export class GeneratedDrift extends TaggedErrorClass<
  GeneratedDrift,
  { readonly brand: unique symbol }
>()("GeneratedDrift", { message: Schema.String }) {}

export const writeGenerated = Effect.fn("writeGenerated")(
  function* writeGenerated(
    root: string,
    files: Readonly<Record<string, string>>
  ) {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;

    yield* Effect.forEach(Rec.toEntries(files), ([file, text]) =>
      Effect.gen(function* write() {
        const target = path.join(root, file);

        yield* fs.makeDirectory(path.dirname(target), { recursive: true });
        yield* fs.writeFileString(target, text);
      })
    );

    return Rec.size(files);
  }
);

/** The paths whose committed text differs from the generated text, or that are missing. */
export const driftOf = Effect.fn("driftOf")(function* driftOf(
  root: string,
  files: Readonly<Record<string, string>>
) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;

  const checked = yield* Effect.forEach(Rec.toEntries(files), ([file, text]) =>
    fs.readFileString(path.join(root, file)).pipe(
      Effect.map((committed) => (committed === text ? [] : [file])),
      Effect.orElseSucceed(() => [file])
    )
  );

  return Arr.flatten(checked);
});
