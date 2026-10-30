// The schema of the model files in model/. The decoded value is the only input of the checks and the generators.
import { Record as Rec, Schema } from "effect";

import {
  canvasBlocks,
  componentTiers,
  conceptRelationTypes,
  productScopes,
  qualityAttributes,
  statuses,
} from "./vocabulary.ts";

const Text = Schema.NonEmptyString;

const Id = Schema.String.check(
  Schema.isPattern(/^[a-z]+-[a-z0-9]+(?:-[a-z0-9]+)*$/u)
);

const Links = Schema.Record(Schema.String, Schema.NonEmptyArray(Id));

const baseFields = {
  canvas: Schema.optionalKey(
    Schema.NonEmptyArray(Schema.Literals(canvasBlocks))
  ),
  id: Id,
  links: Schema.optionalKey(Links),
  /** A free or paid mark that the operator decided: the element is `decided` and cites a line of `pricingDecisions`. */
  pricing: Schema.optionalKey(Schema.Literals(["free", "paid"])),
  /** A free or paid mark that is only proposed. Never on the same element as `pricing`. */
  proposedPricing: Schema.optionalKey(Schema.Literals(["free", "paid"])),
  rationale: Schema.optionalKey(Text),
  refs: Schema.optionalKey(Schema.NonEmptyArray(Text)),
  source: Schema.NonEmptyArray(Text),
  statement: Text,
  status: Schema.Literals(statuses),
  title: Text,
};

const Goal = Schema.Struct({
  ...baseFields,
  elevator: Schema.optionalKey(Text),
  intentLine: Schema.optionalKey(Text),
  jtbd: Schema.optionalKey(
    Schema.Struct({
      persona: Id,
      soThat: Text,
      want: Text,
      when: Text,
    })
  ),
  kind: Schema.Literal("goal"),
  tagline: Schema.optionalKey(Text),
  technicalLine: Schema.optionalKey(Text),
});

const Problem = Schema.Struct({
  ...baseFields,
  gap: Schema.optionalKey(
    Schema.Struct({
      fix: Text,
      repo: Schema.Literals([...productScopes, "org"]),
    })
  ),
  kind: Schema.Literal("problem"),
});

const Constraint = Schema.Struct({
  ...baseFields,
  constraintType: Schema.Literals([
    "legal",
    "technical",
    "organisational",
    "process",
  ]),
  kind: Schema.Literal("constraint"),
});

const Opportunity = Schema.Struct({
  ...baseFields,
  kind: Schema.Literal("opportunity"),
});

const Rule = Schema.Struct({
  ...baseFields,
  if: Schema.optionalKey(Text),
  kind: Schema.Literal("rule"),
  ruleType: Schema.Literals(["event-action", "constraint", "derivation"]),
  // The model files spell this key `then`; the key is built, not written, because it is a property name that lint reserves.
  ...Rec.singleton("then", Schema.optionalKey(Text)),
  when: Schema.optionalKey(Text),
});

const Concept = Schema.Struct({
  ...baseFields,
  attributes: Schema.optionalKey(Schema.NonEmptyArray(Text)),
  kind: Schema.Literal("concept"),
  relations: Schema.optionalKey(
    Schema.NonEmptyArray(
      Schema.Struct({
        label: Schema.optionalKey(Text),
        multiplicity: Schema.optionalKey(Text),
        to: Id,
        type: Schema.Literals(conceptRelationTypes),
      })
    )
  ),
});

const Process = Schema.Struct({
  ...baseFields,
  category: Schema.optionalKey(
    Schema.Literals(["primary", "supporting", "governance"])
  ),
  kind: Schema.Literal("process"),
});

const ExternalProcess = Schema.Struct({
  ...baseFields,
  kind: Schema.Literal("external-process"),
});

const Actor = Schema.Struct({
  ...baseFields,
  actorType: Schema.Literals(["individual", "org-unit", "role", "system"]),
  kind: Schema.Literal("actor"),
  persona: Schema.optionalKey(Schema.Boolean),
});

const Resource = Schema.Struct({
  ...baseFields,
  kind: Schema.Literal("resource"),
  resourceType: Schema.Literals([
    "software",
    "service",
    "document",
    "data",
    "financial",
    "external-tool",
    "model-asset",
  ]),
});

const IsGoal = Schema.Struct({
  ...baseFields,
  kind: Schema.Literal("is-goal"),
});

const Component = Schema.Struct({
  ...baseFields,
  kind: Schema.Literal("component"),
  licence: Schema.optionalKey(Text),
  package: Schema.optionalKey(Text),
  rejected: Schema.optionalKey(Schema.Boolean),
  repo: Schema.optionalKey(Schema.Literals(productScopes)),
  tagline: Schema.optionalKey(Text),
  tier: Schema.Literals(componentTiers),
  url: Schema.optionalKey(Text),
});

const Requirement = Schema.Struct({
  ...baseFields,
  kind: Schema.Literal("requirement"),
  quality: Schema.optionalKey(Schema.Literals(qualityAttributes)),
  reqType: Schema.Literals(["functional", "non-functional"]),
  scenario: Schema.optionalKey(Text),
});

const ElementSchema = Schema.Union([
  Goal,
  Problem,
  Constraint,
  Opportunity,
  Rule,
  Concept,
  Process,
  ExternalProcess,
  Actor,
  Resource,
  IsGoal,
  Component,
  Requirement,
]);

export type Element = typeof ElementSchema.Type;

const ModelFile = Schema.Struct({
  elements: Schema.Array(ElementSchema),
});

const Sha = Schema.String.check(Schema.isPattern(/^[0-9a-f]{40}$/u));

const SourcesSchema = Schema.Struct({
  decisionLog: Text,
  /** The lines of the decision log that decide a free or paid mark: only an element that cites one may carry `pricing`. */
  pricingDecisions: Schema.NonEmptyArray(Schema.Int),
  repos: Schema.Struct({
    "foldkit-flow": Sha,
    studio: Sha,
    tsukuri: Sha,
  }),
});

export type Sources = typeof SourcesSchema.Type;

const TrackerItem = Schema.Struct({
  ref: Text,
  state: Schema.Literals(["open", "merged", "closed"]),
  title: Text,
});

const TrackerSchema = Schema.Struct({
  asOf: Text,
  items: Schema.Array(TrackerItem),
});

export type Tracker = typeof TrackerSchema.Type;

/** Excess keys are errors: a misspelt field must not load as nothing. */
const strict = { onExcessProperty: "error" } as const;

export const decodeModelFile = Schema.decodeUnknownResult(ModelFile, strict);

export const decodeSources = Schema.decodeUnknownResult(SourcesSchema, strict);

export const decodeTracker = Schema.decodeUnknownResult(TrackerSchema, strict);

const TriageSchema = Schema.Struct({
  advice: Schema.Array(Schema.Struct({ advice: Text, id: Id })),
});

export type Triage = typeof TriageSchema.Type;

export const decodeTriage = Schema.decodeUnknownResult(TriageSchema, strict);
