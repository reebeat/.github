// A small valid model for the checks' controls: every scope has an element in every sub-model, the goals are supported, and
// the canvas is full. A control mutates one element and expects exactly the finding that the mutation causes.
import { Array as Arr, Predicate, Result, String as Str } from "effect";
import type { Schema } from "effect";

import { buildModel } from "../src/model.ts";
import type { Model } from "../src/model.ts";
import { decodeModelFile } from "../src/schema.ts";
import { canvasBlocks, productScopes, scopes } from "../src/vocabulary.ts";
import type { Scope } from "../src/vocabulary.ts";

/** An element as it is written in a model file: plain data, before the schema decodes it. */
export type Raw = Readonly<Record<string, Schema.Json>>;

const common = (id: string) => ({
  id,
  source: ["log:7"],
  statement: `Statement of ${id}.`,
  status: "decided",
  title: `Title of ${id}`,
});

const goalOf = (scope: Scope): Raw => {
  const goal = { ...common(`goal-${scope}-g`), kind: "goal" };

  return scope === "org"
    ? { ...goal, canvas: [...canvasBlocks], tagline: "A tagline." }
    : goal;
};

const requirementsOf = (scope: Scope): readonly Raw[] =>
  Arr.some(productScopes, (product) => product === scope)
    ? [
        {
          ...common(`req-${scope}-q`),
          kind: "requirement",
          quality: "reproducibility",
          reqType: "non-functional",
          scenario: "A scenario.",
        },
      ]
    : [];

const elementsOf = (scope: Scope): readonly Raw[] => [
  goalOf(scope),
  {
    ...common(`rule-${scope}-r`),
    kind: "rule",
    links: { serves: [`goal-${scope}-g`] },
    ruleType: "constraint",
  },
  { ...common(`concept-${scope}-c`), kind: "concept" },
  {
    ...common(`process-${scope}-p`),
    kind: "process",
    links: { serves: [`goal-${scope}-g`] },
  },
  {
    ...common(`actor-${scope}-a`),
    actorType: "role",
    kind: "actor",
  },
  {
    ...common(`comp-${scope}-c`),
    kind: "component",
    links: { serves: [`goal-${scope}-g`] },
    tier: scope === "org" ? "library" : "product",
  },
  ...requirementsOf(scope),
];

interface RawFile {
  readonly elements: readonly Raw[];
  readonly scope: Scope;
}

export const fixtureFiles = (): readonly RawFile[] =>
  Arr.map(scopes, (scope) => ({ elements: elementsOf(scope), scope }));

/** Builds a model from raw files, decoding each so the fixture cannot drift from the schema. */
export const modelOf = (files: readonly RawFile[]): Model =>
  buildModel({
    files: Arr.map(files, (file) => ({
      elements: Result.getOrThrow(decodeModelFile({ elements: file.elements }))
        .elements,
      scope: file.scope,
    })),
    logLines: 10,
    sources: {
      decisionLog: "sources/operator-decisions-2026-10.md",
      pricingDecisions: [7],
      repos: {
        "foldkit-flow": Str.repeat(40)("a"),
        studio: Str.repeat(40)("c"),
        tsukuri: Str.repeat(40)("b"),
      },
    },
    tracker: { asOf: "2026-10-29", items: [] },
    triage: { advice: [] },
  });

type Patch = (element: Raw) => Raw | undefined;

/** The fixture with each listed element replaced by `patch(element)`; `undefined` from a patch removes the element. */
export const withChanges = (changes: Readonly<Record<string, Patch>>): Model =>
  modelOf(
    Arr.map(fixtureFiles(), (file) => ({
      elements: Arr.flatMap(file.elements, (element) => {
        const { id } = element;
        const patch = Predicate.isString(id) ? changes[id] : undefined;

        if (patch === undefined) {
          return [element];
        }

        const changed = patch(element);

        return changed === undefined ? [] : [changed];
      }),
      scope: file.scope,
    }))
  );

export const withChange = (id: string, patch: Patch): Model =>
  withChanges({ [id]: patch });
