// One page per 4EM sub-model: a diagram and a table per scope. Pure functions: Model in, Markdown out.
import {
  Array as Arr,
  Match,
  Option,
  Record as Rec,
  String as Str,
} from "effect";

import {
  edgesOf,
  filterSome,
  itemsById,
  ofKind,
  subModelOf,
} from "../model.ts";
import type { Edge, Item, Model } from "../model.ts";
import { kindInfo, scopes, subModelTitles } from "../vocabulary.ts";
import type { Kind, Scope, SubModel } from "../vocabulary.ts";
import {
  anchor,
  byStatus,
  generatedNotice,
  inSubModel,
  itemsOfScope,
  label,
  linkSummary,
  mermaid,
  nodeId,
  oneLine,
  scopeTitles,
  sourceLinks,
  statusClassDefs,
  statusCounts,
  table,
} from "./format.ts";

const noteRationale = (item: Item): string =>
  item.rationale === undefined
    ? ""
    : ` *Why ${item.status}:* ${oneLine(item.rationale)}`;

const present = <A>(
  value: A | undefined,
  render: (present: A) => string
): string => (value === undefined ? "" : render(value));

const sentence = (parts: readonly string[]): string =>
  Arr.join(
    Arr.filter(parts, (part) => part !== ""),
    " "
  );

const detail: (item: Item) => string = Match.type<Item>().pipe(
  Match.discriminatorsExhaustive("kind")({
    actor: (item) =>
      `Type: ${item.actorType}.${item.persona === true ? " Persona." : ""}`,
    component: (item) =>
      sentence([
        `Tier: ${item.tier}.`,
        item.rejected === true ? "**Rejected alternative.**" : "",
        present(item.package, (where) => `Where: \`${where}\`.`),
        present(item.licence, (licence) => `Licence: ${licence}.`),
      ]),
    concept: (item) =>
      present(
        item.attributes,
        (attributes) => `Attributes: ${Arr.join(attributes, "; ")}.`
      ),
    constraint: (item) => `Type: ${item.constraintType}.`,
    "external-process": () => "",
    goal: (item) =>
      present(
        item.jtbd,
        (job) =>
          `Job: when ${oneLine(job.when)}, I want ${oneLine(job.want)}, so that ${oneLine(job.soThat)}.`
      ),
    "is-goal": () => "",
    opportunity: () => "",
    problem: (item) =>
      present(
        item.gap,
        (gap) => `**Gap in ${gap.repo}.** Fix: ${oneLine(gap.fix)}`
      ),
    process: (item) =>
      present(item.category, (category) => `Category: ${category}.`),
    requirement: (item) =>
      sentence([
        present(item.quality, (quality) => `Quality: ${quality}.`),
        present(item.scenario, (scenario) => `Scenario: ${oneLine(scenario)}`),
      ]),
    resource: (item) => `Type: ${item.resourceType}.`,
    rule: (item) =>
      sentence([
        present(item.when, (when) => `**When** ${oneLine(when)}`),
        present(item.if, (condition) => `**If** ${oneLine(condition)}`),
        present(item.then, (outcome) => `**Then** ${oneLine(outcome)}`),
      ]),
  })
);

/** The standard element table of every sub-model page. */
const elementTable = (
  model: Model,
  items: readonly Item[],
  prefix: string
): string => {
  const byId = itemsById(model);

  return table(
    ["Element", "Statement", "Status", "Links", "Sources"],
    Arr.map(byStatus(items), (item) => [
      `${anchor(item)}<code>${item.id}</code><br/>${kindInfo[item.kind].label}`,
      `**${item.title}.** ${oneLine(item.statement)}${
        detail(item) === "" ? "" : ` ${detail(item)}`
      }${noteRationale(item)}`,
      item.status,
      linkSummary(item, byId, prefix),
      sourceLinks(model, item, prefix),
    ])
  );
};

/** The Mermaid node syntax that marks the kind of an element around its label. */
const nodeLabel = (item: Item, text: string): string => {
  const quoted = `"${label(text)}"`;

  return Match.value(item).pipe(
    Match.discriminatorsExhaustive("kind")({
      actor: () => `([${quoted}])`,
      component: () => `[${quoted}]`,
      concept: () => `[${quoted}]`,
      constraint: () => `[/${quoted}/]`,
      "external-process": () => `[[${quoted}]]`,
      goal: () => `(${quoted})`,
      "is-goal": () => `[${quoted}]`,
      opportunity: () => `([${quoted}])`,
      problem: () => `{{${quoted}}}`,
      process: () => `[${quoted}]`,
      requirement: () => `[${quoted}]`,
      resource: () => `[(${quoted})]`,
      rule: () => `>${quoted}]`,
    })
  );
};

const node = (item: Item, outside: boolean): string =>
  `${nodeId(item.id)}${nodeLabel(item, item.title)}:::${outside ? "outside" : item.status}`;

const arrows = {
  conflicts: "<-.->",
  hinders: "-.->",
  motivates: "==>",
  next: "-->",
  triggers: "-.->",
} as const satisfies Readonly<Record<string, string>>;

const edgeLine = (edge: Edge): string => {
  const arrow = Option.getOrElse(
    Rec.get<string, string>(arrows, edge.type),
    () => "-->"
  );

  return `${nodeId(edge.from.id)} ${arrow}|${edge.type}| ${nodeId(edge.to)}`;
};

/**
 * A flowchart of `items` and the edges among them accepted by `keep`; any other end of an edge appears once, as an
 * outside node.
 */
const flowchart = (
  model: Model,
  items: readonly Item[],
  keep: (edge: Edge, target: Item) => boolean,
  direction: string
): string => {
  const byId = itemsById(model);
  const inside = new Set(Arr.map(items, (item) => item.id));

  const edges = Arr.filter(edgesOf(items), (edge) => {
    const target = byId.get(edge.to);

    return target !== undefined && keep(edge, target);
  });

  const outsideItems = Arr.dedupeWith(
    filterSome(edges, (edge) => {
      const target = byId.get(edge.to);

      return target === undefined || inside.has(target.id)
        ? Option.none()
        : Option.some(target);
    }),
    (a, b) => a.id === b.id
  );

  return mermaid(
    Arr.join(
      [
        `flowchart ${direction}`,
        `    ${statusClassDefs}`,
        ...Arr.map(items, (item) => `    ${node(item, false)}`),
        ...Arr.map(outsideItems, (item) => `    ${node(item, true)}`),
        ...Arr.map(edges, (edge) => `    ${edgeLine(edge)}`),
      ],
      "\n"
    )
  );
};

const goalsModelKinds: ReadonlySet<Kind> = new Set<Kind>([
  "goal",
  "problem",
  "constraint",
  "opportunity",
]);

export const goalsDiagram = (model: Model, items: readonly Item[]): string =>
  flowchart(
    model,
    items,
    (edge, target) =>
      goalsModelKinds.has(edge.from.kind) && goalsModelKinds.has(target.kind),
    "BT"
  );

const rulesDiagram = (model: Model, items: readonly Item[]): string =>
  flowchart(
    model,
    items,
    (edge) => edge.type === "serves" || edge.type === "triggers",
    "LR"
  );

export const processesDiagram = (
  model: Model,
  items: readonly Item[]
): string =>
  flowchart(
    model,
    items,
    (edge, target) =>
      (edge.type === "next" || edge.type === "part-of") &&
      (target.kind === "process" || target.kind === "external-process"),
    "LR"
  );

const actorsDiagram = (model: Model, items: readonly Item[]): string =>
  flowchart(
    model,
    items,
    (edge) =>
      ["performs", "uses", "responsible-for", "part-of"].includes(edge.type),
    "LR"
  );

const technicalStructure = (model: Model, items: readonly Item[]): string =>
  flowchart(
    model,
    items,
    (edge, target) =>
      (["depends-on", "part-of", "realizes", "constrains"].includes(
        edge.type
      ) &&
        subModelOf(target) === "technical") ||
      (edge.type === "depends-on" && target.kind === "resource"),
    "LR"
  );

const technicalTrace = (model: Model, items: readonly Item[]): string =>
  flowchart(
    model,
    items,
    (edge, target) =>
      (edge.type === "serves" || edge.type === "supports") &&
      target.kind === "goal",
    "LR"
  );

const parseMultiplicity = (
  text: string | undefined
): readonly [string, string] => {
  if (text === undefined) {
    return ["", ""];
  }

  const [from, to] = Str.split(" to ")(text);

  return to === undefined ? ["", from ?? ""] : [from ?? "", to];
};

type Relation = NonNullable<
  Extract<Item, { readonly kind: "concept" }>["relations"]
>[number];

const conceptClass = (item: Item): string => {
  const attributes = Arr.map(
    item.kind === "concept" ? (item.attributes ?? []) : [],
    (attribute) => `        ${Str.replaceAll(/[{}<>:]/gu, "")(attribute)}`
  );

  return Arr.join(
    [
      `    class ${nodeId(item.id)}["${label(item.title)}"]`,
      ...(attributes.length === 0
        ? []
        : [
            `    ${nodeId(item.id)} : ${Arr.join(Arr.map(attributes, Str.trim), `\n    ${nodeId(item.id)} : `)}`,
          ]),
    ],
    "\n"
  );
};

const relationLine = (concept: Item, relation: Relation): string => {
  const [from, to] = parseMultiplicity(relation.multiplicity);

  const text =
    relation.label === undefined
      ? ""
      : ` : ${Str.replaceAll(":", "")(relation.label)}`;

  const left = from === "" ? "" : ` "${from}"`;
  const right = to === "" ? "" : ` "${to}"`;
  const a = nodeId(concept.id);
  const b = nodeId(relation.to);

  return Match.value(relation.type).pipe(
    Match.when("isa", () => `    ${b} <|-- ${a}${text}`),
    Match.when("part-of", () => `    ${b}${right} *-- ${left}${a}${text}`),
    Match.when("relates", () => `    ${a}${left} --> ${right}${b}${text}`),
    Match.exhaustive
  );
};

const conceptsDiagram = (model: Model, items: readonly Item[]): string => {
  const byId = itemsById(model);
  const inside = new Set(Arr.map(items, (item) => item.id));
  const concepts = ofKind(items, "concept");

  const relationLines = Arr.flatMap(concepts, (item) =>
    Arr.flatMap(item.relations ?? [], (relation) =>
      byId.has(relation.to) ? [relationLine(item, relation)] : []
    )
  );

  const outside = Arr.dedupeWith(
    filterSome(
      Arr.flatMap(concepts, (item) => item.relations ?? []),
      (relation) =>
        Option.filter(
          Option.fromNullishOr(byId.get(relation.to)),
          (target) => !inside.has(target.id)
        )
    ),
    (a, b) => a.id === b.id
  );

  return mermaid(
    Arr.join(
      [
        "classDiagram",
        ...Arr.map(items, conceptClass),
        ...Arr.map(
          outside,
          (item) => `    class ${nodeId(item.id)}["${label(item.title)}"]`
        ),
        ...relationLines,
      ],
      "\n"
    )
  );
};

interface PageSpec {
  readonly file: string;
  readonly intro: string;
  readonly subModel: SubModel;
  readonly diagrams: readonly ((
    model: Model,
    items: readonly Item[]
  ) => string)[];
}

const pageSpecs: readonly PageSpec[] = [
  {
    diagrams: [goalsDiagram],
    file: "goals.md",
    intro:
      "The Goals Model says why: what the products must achieve, what stands in the way and what could help. Goals are rounded boxes, problems are hexagons, constraints are slanted boxes and opportunities are stadiums. An arrow `subgoal-of` points to the parent goal; dashed arrows show what hinders. Dashed grey boxes are elements of another scope.",
    subModel: "goals",
  },
  {
    diagrams: [rulesDiagram],
    file: "business-rules.md",
    intro:
      "The Business Rules Model says which policies and invariants govern the work. Each rule cites the goal it serves (`serves`) and may trigger a process.",
    subModel: "rules",
  },
  {
    diagrams: [conceptsDiagram],
    file: "concepts.md",
    intro:
      "The Concepts Model fixes the vocabulary: concepts, their attributes and their relations (`isa`, part-of, and plain relations with a label and a multiplicity).",
    subModel: "concepts",
  },
  {
    diagrams: [processesDiagram],
    file: "business-processes.md",
    intro:
      "The Business Process Model says what is done and in which order. `next` arrows follow the flow; a process inside a larger process is `part-of` it. Stadium boxes are processes outside the project.",
    subModel: "processes",
  },
  {
    diagrams: [actorsDiagram],
    file: "actors-and-resources.md",
    intro:
      "The Actors and Resources Model says who does the work and what they use. Personas are the roles the products serve; each has its jobs to be done in the Goals Model.",
    subModel: "actors",
  },
  {
    diagrams: [technicalStructure, technicalTrace],
    file: "technical-components.md",
    intro:
      "The Technical Components and Requirements Model says how: the components, the requirements they realize and the goals they serve. The first diagram of each scope shows structure; the second traces each component, requirement and IS goal to the goals it serves.",
    subModel: "technical",
  },
];

const scopeSection = (model: Model, spec: PageSpec, scope: Scope): string => {
  const items = Arr.filter(
    itemsOfScope(inSubModel(model.items, spec.subModel), scope),
    () => true
  );

  if (items.length === 0) {
    return "";
  }

  const counts = statusCounts(items);
  const diagramItems = items;

  return Arr.join(
    [
      `## ${scopeTitles[scope]}`,
      "",
      `${items.length} elements: ${counts.decided} decided, ${counts.proposed} proposed, ${counts.open} open.`,
      "",
      ...Arr.flatMap(spec.diagrams, (diagram) => [
        diagram(model, diagramItems),
        "",
      ]),
      elementTable(model, items, ""),
      "",
    ],
    "\n"
  );
};

const rejectedSection = (model: Model): string => {
  const rejected = Arr.filter(
    model.items,
    (item) => item.kind === "component" && item.rejected === true
  );

  return rejected.length === 0
    ? ""
    : Arr.join(
        [
          "## Rejected alternatives",
          "",
          "Components that were considered and rejected. They serve no goal; the problems that hinder them say why.",
          "",
          table(
            ["Alternative", "Why rejected", "Status", "Sources"],
            Arr.map(rejected, (item) => [
              `${anchor(item)}${item.title}`,
              Arr.join(
                Arr.map(
                  Arr.filter(
                    edgesOf(model.items),
                    (edge) => edge.type === "hinders" && edge.to === item.id
                  ),
                  (edge) => oneLine(edge.from.statement)
                ),
                " "
              ),
              item.status,
              sourceLinks(model, item, ""),
            ])
          ),
          "",
        ],
        "\n"
      );
};

const personaSection = (model: Model): string => {
  const jobs = Arr.filter(
    model.items,
    (item) => item.kind === "goal" && item.jtbd !== undefined
  );

  return jobs.length === 0
    ? ""
    : Arr.join(
        [
          "## Jobs to be done",
          "",
          "Each persona and the job they hire the products for (jobs-to-be-done form).",
          "",
          table(
            ["Persona", "When", "I want", "So that", "Status"],
            Arr.map(jobs, (item) =>
              item.kind === "goal" && item.jtbd !== undefined
                ? [
                    item.jtbd.persona,
                    oneLine(item.jtbd.when),
                    oneLine(item.jtbd.want),
                    oneLine(item.jtbd.soThat),
                    item.status,
                  ]
                : []
            )
          ),
          "",
        ],
        "\n"
      );
};

const qualitySection = (model: Model): string => {
  const qualities = Arr.filter(
    model.items,
    (item) => item.kind === "requirement" && item.quality !== undefined
  );

  return qualities.length === 0
    ? ""
    : Arr.join(
        [
          "## Quality goals",
          "",
          "The non-functional requirements with a stated quality and scenario (arc42 section 10, quality scenarios).",
          "",
          table(
            ["Scope", "Quality", "Requirement", "Scenario", "Status"],
            Arr.map(qualities, (item) =>
              item.kind === "requirement"
                ? [
                    item.scope,
                    item.quality ?? "",
                    `${item.title}. ${oneLine(item.statement)}`,
                    item.scenario === undefined ? "" : oneLine(item.scenario),
                    item.status,
                  ]
                : []
            )
          ),
          "",
        ],
        "\n"
      );
};

const renderSubModelPage = (model: Model, spec: PageSpec): string =>
  Arr.join(
    [
      generatedNotice,
      "",
      `# ${subModelTitles[spec.subModel]}`,
      "",
      spec.intro,
      "",
      "Method: 4EM (Sandkuhl, Stirna, Persson and Wißotzki, *Enterprise Modeling: Tackling Business Challenges with the 4EM Method*, Springer 2014). Every element cites its source; `decided` means a source shows that the operator decided it.",
      "",
      ...Arr.map(scopes, (scope) => scopeSection(model, spec, scope)),
      spec.subModel === "actors" ? personaSection(model) : "",
      spec.subModel === "technical" ? rejectedSection(model) : "",
      spec.subModel === "technical" ? qualitySection(model) : "",
    ],
    "\n"
  );

export const subModelPageFiles = (
  model: Model
): Readonly<Record<string, string>> =>
  Rec.fromEntries(
    Arr.map(pageSpecs, (spec) => [
      `docs/${spec.file}`,
      renderSubModelPage(model, spec),
    ])
  );
