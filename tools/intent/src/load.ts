// Reads model/ and the decision log from a repository root and decodes them. The only place that touches the disk
// for the model; the checks and the renderers get the decoded Model.
import {
  Array as Arr,
  Effect,
  FileSystem,
  Order,
  Path,
  Result,
  Schema,
  String as Str,
} from "effect";
import { TaggedError as TaggedErrorClass } from "effect/Schema";
import { parse } from "yaml";

import { buildModel } from "./model.ts";
import { decodeModelFile, decodeSources, decodeTracker } from "./schema.ts";
import { scopes } from "./vocabulary.ts";
import { cutValues, describeCut } from "./yamlText.ts";

class ModelLoadError extends TaggedErrorClass<
  ModelLoadError,
  { readonly brand: unique symbol }
>()("ModelLoadError", { message: Schema.String, path: Schema.String }) {}

const fromResult = <A, E extends { readonly message: string }>(
  path: string,
  result: Result.Result<A, E>
) =>
  Result.match(result, {
    onFailure: (error) =>
      Effect.fail(
        new ModelLoadError({ message: `${path}: ${error.message}`, path })
      ),
    onSuccess: (value) => Effect.succeed(value),
  });

const decodeJson = Schema.decodeUnknownResult(Schema.Json);

/** Parses YAML text into plain data; the result is decoded by the schema of the file that holds it. */
export const parseYaml = (path: string, text: string) =>
  Effect.gen(function* parseYamlText() {
    const cuts = cutValues(text);

    if (Arr.isReadonlyArrayNonEmpty(cuts)) {
      return yield* new ModelLoadError({
        message: `${path}: ${Arr.join(Arr.map(cuts, describeCut), "; ")}`,
        path,
      });
    }

    const parsed = yield* Effect.try({
      catch: (error) =>
        new ModelLoadError({
          message: error instanceof Error ? error.message : "invalid YAML",
          path,
        }),
      try: () => decodeJson(parse(text)),
    });

    return yield* fromResult(path, parsed);
  });

const decisionLogPath = "sources/operator-decisions-2026-10.md";

/** Loads the whole model below `root`. */
export const loadModel = Effect.fn("loadModel")(function* loadModel(
  root: string
) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;

  const readYaml = Effect.fn("readYaml")(function* readYaml(file: string) {
    const full = path.join(root, file);

    const text = yield* fs
      .readFileString(full)
      .pipe(
        Effect.mapError(
          (error) => new ModelLoadError({ message: error.message, path: file })
        )
      );

    return yield* parseYaml(file, text);
  });

  const sources = yield* readYaml("model/sources.yaml").pipe(
    Effect.flatMap((raw) =>
      fromResult("model/sources.yaml", decodeSources(raw))
    )
  );

  const tracker = yield* readYaml("model/tracker.yaml").pipe(
    Effect.flatMap((raw) =>
      fromResult("model/tracker.yaml", decodeTracker(raw))
    )
  );

  const files = yield* Effect.forEach(scopes, (scope) =>
    Effect.gen(function* scopeFiles() {
      const names = yield* fs
        .readDirectory(path.join(root, "model", scope))
        .pipe(
          Effect.mapError(
            (error) =>
              new ModelLoadError({
                message: error.message,
                path: `model/${scope}`,
              })
          )
        );

      const yamlNames = Arr.sort(
        Arr.filter(names, Str.endsWith(".yaml")),
        Order.String
      );

      const decoded = yield* Effect.forEach(yamlNames, (name) =>
        readYaml(`model/${scope}/${name}`).pipe(
          Effect.flatMap((raw) =>
            fromResult(`model/${scope}/${name}`, decodeModelFile(raw))
          )
        )
      );

      return {
        elements: Arr.flatMap(decoded, (file) => file.elements),
        scope,
      };
    })
  );

  const log = yield* fs
    .readFileString(path.join(root, decisionLogPath))
    .pipe(
      Effect.mapError(
        (error) =>
          new ModelLoadError({ message: error.message, path: decisionLogPath })
      )
    );

  const logLines = Arr.length(Str.split(Str.trimEnd(log), "\n"));

  return buildModel({ files, logLines, sources, tracker });
});
