// The vocabulary of the intent model, as data. Every check, renderer and schema reads these tables; nothing repeats them.
// Method: 4EM (Sandkuhl, Stirna, Persson, Wißotzki, "Enterprise Modeling: Tackling Business Challenges with the 4EM
// Method", Springer 2014): six sub-models linked by inter-model links.
import type { Option } from "effect";
import { Record as Rec } from "effect";

export const subModels = [
  "goals",
  "rules",
  "concepts",
  "processes",
  "actors",
  "technical",
] as const;

export type SubModel = (typeof subModels)[number];

export const subModelTitles: Readonly<Record<SubModel, string>> = {
  actors: "Actors and Resources Model",
  concepts: "Concepts Model",
  goals: "Goals Model",
  processes: "Business Process Model",
  rules: "Business Rules Model",
  technical: "Technical Components and Requirements Model",
};

export const kinds = [
  "goal",
  "problem",
  "constraint",
  "opportunity",
  "rule",
  "concept",
  "process",
  "external-process",
  "actor",
  "resource",
  "is-goal",
  "component",
  "requirement",
] as const;

export type Kind = (typeof kinds)[number];

interface KindInfo {
  readonly idPrefix: string;
  readonly label: string;
  readonly subModel: SubModel;
}

export const kindInfo: Readonly<Record<Kind, KindInfo>> = {
  actor: { idPrefix: "actor", label: "Actor", subModel: "actors" },
  component: {
    idPrefix: "comp",
    label: "Technical component",
    subModel: "technical",
  },
  concept: { idPrefix: "concept", label: "Concept", subModel: "concepts" },
  constraint: {
    idPrefix: "constraint",
    label: "Constraint",
    subModel: "goals",
  },
  "external-process": {
    idPrefix: "extproc",
    label: "External process",
    subModel: "processes",
  },
  goal: { idPrefix: "goal", label: "Goal", subModel: "goals" },
  "is-goal": {
    idPrefix: "isgoal",
    label: "Information system goal",
    subModel: "technical",
  },
  opportunity: {
    idPrefix: "opportunity",
    label: "Opportunity",
    subModel: "goals",
  },
  problem: { idPrefix: "problem", label: "Problem", subModel: "goals" },
  process: { idPrefix: "process", label: "Process", subModel: "processes" },
  requirement: {
    idPrefix: "req",
    label: "Requirement",
    subModel: "technical",
  },
  resource: { idPrefix: "resource", label: "Resource", subModel: "actors" },
  rule: { idPrefix: "rule", label: "Business rule", subModel: "rules" },
};

export const statuses = ["decided", "proposed", "open"] as const;

/** The scopes of the model: the organisation, then one per product. */
export const scopes = ["org", "reebeat", "studio", "foldkit-flow"] as const;

export type Scope = (typeof scopes)[number];

export const productScopes = ["reebeat", "studio", "foldkit-flow"] as const;

/** The repositories a source may cite, and their GitHub slugs. */
export const repoSlugs = {
  "foldkit-flow": "reebeat/foldkit-flow",
  reebeat: "reebeat/reebeat",
  studio: "reebeat/studio",
} as const;

export type RepoKey = keyof typeof repoSlugs;

export const repoKeys = Rec.keys(repoSlugs);

interface LinkInfo {
  readonly from: readonly Kind[];
  readonly meaning: string;
  readonly to: readonly Kind[];
}

/** The inter-model and intra-model links, with the kinds each may join. A link outside this table does not load. */
const linkTable = {
  conflicts: {
    from: ["goal"],
    meaning: "the two goals cannot both be met in full",
    to: ["goal"],
  },
  constrains: {
    from: ["constraint", "rule"],
    meaning: "limits how the target may be done or built",
    to: ["process", "component", "requirement", "resource"],
  },
  "depends-on": {
    from: ["component"],
    meaning: "the component needs the other to build or run",
    to: ["component", "resource"],
  },
  hinders: {
    from: ["problem", "constraint"],
    meaning: "makes the target harder or impossible",
    to: ["goal", "process", "component", "requirement", "is-goal", "resource"],
  },
  motivates: {
    from: ["problem", "opportunity", "goal"],
    meaning: "gives a reason for the target to exist",
    to: ["goal", "rule", "process", "requirement", "is-goal"],
  },
  next: {
    from: ["process", "external-process"],
    meaning: "the target follows in the flow",
    to: ["process", "external-process"],
  },
  "part-of": {
    from: ["process", "component", "actor"],
    meaning: "the element is a part of the target",
    to: ["process", "component", "actor"],
  },
  performs: {
    from: ["actor"],
    meaning: "the actor carries out the process",
    to: ["process", "external-process"],
  },
  produces: {
    from: ["process"],
    meaning: "the process creates the target",
    to: ["concept", "resource"],
  },
  realizes: {
    from: ["component"],
    meaning: "the component implements the requirement or IS goal",
    to: ["requirement", "is-goal"],
  },
  requires: {
    from: ["goal", "requirement", "process"],
    meaning: "the element cannot be met or done without the target",
    to: [
      "goal",
      "constraint",
      "requirement",
      "component",
      "resource",
      "concept",
      "process",
    ],
  },
  "responsible-for": {
    from: ["actor"],
    meaning: "the actor answers for the target",
    to: ["goal", "process", "rule", "component", "resource"],
  },
  serves: {
    from: [
      "rule",
      "process",
      "component",
      "requirement",
      "is-goal",
      "actor",
      "resource",
    ],
    meaning: "the element exists to achieve the goal",
    to: ["goal"],
  },
  "subgoal-of": {
    from: ["goal"],
    meaning: "the goal refines the target goal",
    to: ["goal"],
  },
  supports: {
    from: ["goal", "opportunity", "is-goal"],
    meaning: "meeting the source helps meet the target goal",
    to: ["goal"],
  },
  triggers: {
    from: ["rule"],
    meaning: "the rule starts or governs the process",
    to: ["process", "external-process"],
  },
  uses: {
    from: ["process", "actor"],
    meaning: "the element reads or relies on the target",
    to: ["concept", "resource", "component"],
  },
} as const satisfies Readonly<Record<string, LinkInfo>>;

/** The kinds a link type may join, or `None` when the type is not in the vocabulary. */
export const linkTypeInfo = (name: string): Option.Option<LinkInfo> =>
  Rec.get<string, LinkInfo>(linkTable, name);

export const conceptRelationTypes = ["isa", "part-of", "relates"] as const;

export const componentTiers = [
  "product",
  "app",
  "program",
  "library",
  "service",
  "integration",
  "tool",
  "artifact",
  "process-asset",
  "layer",
  "external",
] as const;

export const qualityAttributes = [
  "accessibility",
  "reproducibility",
  "performance",
  "correctness",
  "maintainability",
  "extensibility",
  "security",
  "licensing",
  "usability",
  "portability",
  "reliability",
] as const;

/** Business Model Canvas blocks (Osterwalder and Pigneur, Business Model Generation, 2010). */
export const canvasBlocks = [
  "key-partners",
  "key-activities",
  "key-resources",
  "value-propositions",
  "customer-relationships",
  "channels",
  "customer-segments",
  "cost-structure",
  "revenue-streams",
] as const;

export type CanvasBlock = (typeof canvasBlocks)[number];

export const canvasTitles: Readonly<Record<CanvasBlock, string>> = {
  channels: "Channels",
  "cost-structure": "Cost structure",
  "customer-relationships": "Customer relationships",
  "customer-segments": "Customer segments",
  "key-activities": "Key activities",
  "key-partners": "Key partners",
  "key-resources": "Key resources",
  "revenue-streams": "Revenue streams",
  "value-propositions": "Value propositions",
};
