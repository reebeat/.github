// The checks that make the intent testable. Each returns findings; CI fails when any check returns one.
//
//   ID-DUPLICATE, ID-PREFIX               ids are unique and begin with the prefix of their kind
//   LINK-UNKNOWN-TYPE, LINK-DANGLING,
//   LINK-KIND, LINK-SELF                  every link names a known type, an existing element and a legal pair of kinds
//   SOURCE-SYNTAX, SOURCE-LOG-RANGE       every source parses and a decision-log line exists
//   REF-SYNTAX, TRACKER-MISSING           every ref parses and has a tracker entry
//   STATUS-DECIDED-NOT-OPERATOR           a "decided" element cites an operator decision
//   STATUS-NO-RATIONALE                   a proposed or open element says why
//   GOAL-UNSUPPORTED                      a goal has no supporting component, spec, issue or process
//   COMPONENT-NO-GOAL                     a component serves no goal
//   RULE-NO-GOAL                          a rule cites no goal
//   COVERAGE-SUBMODEL                     every scope has an element in every sub-model
//   PRODUCT-COMPONENT, ORG-TAGLINE        a product has one product component; the organisation has one tagline
//   QUALITY-MISSING                       every product states a quality goal
//   CANVAS-EMPTY                          every Business Model Canvas block has an element
//   GAP-STATUS, JTBD-PERSONA,
//   CONCEPT-RELATION                      smaller shape rules the schema cannot say
import { Array as Arr, Option, String as Str } from "effect";

import { itemsById, edgesOf, incoming, outgoing } from "./model.ts";
import type { Edge, Item, Model } from "./model.ts";
import {
  isOperatorDecision,
  parseRef,
  parseSource,
  trackerKey,
} from "./refs.ts";
import {
  canvasBlocks,
  kindInfo,
  linkTypeInfo,
  productScopes,
  scopes,
  subModels,
} from "./vocabulary.ts";

export interface Finding {
  readonly code: string;
  readonly id: string;
  readonly message: string;
}

const finding = (code: string, id: string, message: string): Finding => ({
  code,
  id,
  message,
});

const trackerKeys = (model: Model): ReadonlySet<string> =>
  new Set(Arr.map(model.tracker.items, (item) => item.ref));

/** One finding with the given code and message for each item that `violates` accepts. */
const itemFindings = (
  model: Model,
  code: string,
  message: string,
  violates: (item: Item) => boolean
): readonly Finding[] =>
  Arr.flatMap(model.items, (item) =>
    violates(item) ? [finding(code, item.id, message)] : []
  );

const checkIds = (model: Model): readonly Finding[] => {
  const seen = new Map<string, number>();

  return Arr.flatMap(model.items, (item) => {
    const count = (seen.get(item.id) ?? 0) + 1;

    seen.set(item.id, count);

    const prefix = `${kindInfo[item.kind].idPrefix}-`;

    return [
      ...(count > 1
        ? [finding("ID-DUPLICATE", item.id, `id used more than once`)]
        : []),
      ...(Str.startsWith(prefix)(item.id)
        ? []
        : [
            finding(
              "ID-PREFIX",
              item.id,
              `a ${item.kind} id begins with "${prefix}"`
            ),
          ]),
    ];
  });
};

const checkEdge = (
  edge: Edge,
  byId: ReadonlyMap<string, Item>
): readonly Finding[] => {
  const info = linkTypeInfo(edge.type);

  if (Option.isNone(info)) {
    return [
      finding(
        "LINK-UNKNOWN-TYPE",
        edge.from.id,
        `link type "${edge.type}" is not in the vocabulary`
      ),
    ];
  }

  if (edge.to === edge.from.id) {
    return [finding("LINK-SELF", edge.from.id, `${edge.type} links to itself`)];
  }

  const target = byId.get(edge.to);

  if (target === undefined) {
    return [
      finding(
        "LINK-DANGLING",
        edge.from.id,
        `${edge.type} -> ${edge.to}: no such element`
      ),
    ];
  }

  return info.value.from.includes(edge.from.kind) &&
    info.value.to.includes(target.kind)
    ? []
    : [
        finding(
          "LINK-KIND",
          edge.from.id,
          `${edge.type} may not join ${edge.from.kind} to ${target.kind} (${edge.to})`
        ),
      ];
};

const checkLinks = (model: Model): readonly Finding[] => {
  const byId = itemsById(model);

  return Arr.flatMap(edgesOf(model.items), (edge) => checkEdge(edge, byId));
};

const checkItemFields = (
  item: Item,
  byId: ReadonlyMap<string, Item>
): readonly Finding[] => {
  if (item.kind === "problem") {
    return item.gap !== undefined && item.status === "decided"
      ? [
          finding(
            "GAP-STATUS",
            item.id,
            `a gap is found by analysis, so it is proposed or open, not decided`
          ),
        ]
      : [];
  }

  if (item.kind === "goal") {
    return item.jtbd !== undefined &&
      byId.get(item.jtbd.persona)?.kind !== "actor"
      ? [
          finding(
            "JTBD-PERSONA",
            item.id,
            `jtbd persona ${item.jtbd.persona} is not an actor`
          ),
        ]
      : [];
  }

  if (item.kind === "concept") {
    return Arr.flatMap(item.relations ?? [], (relation) =>
      byId.get(relation.to)?.kind === "concept"
        ? []
        : [
            finding(
              "CONCEPT-RELATION",
              item.id,
              `${relation.type} -> ${relation.to} is not a concept`
            ),
          ]
    );
  }

  return [];
};

const checkFieldRules = (model: Model): readonly Finding[] => {
  const byId = itemsById(model);

  return Arr.flatMap(model.items, (item) => checkItemFields(item, byId));
};

const checkSources = (model: Model): readonly Finding[] => {
  const tracked = trackerKeys(model);

  return Arr.flatMap(model.items, (item) =>
    Arr.flatMap(item.source, (text): readonly Finding[] =>
      Option.match(parseSource(text), {
        onNone: () => [
          finding("SOURCE-SYNTAX", item.id, `source "${text}" does not parse`),
        ],
        onSome: (source) => {
          if (source.kind === "log" && source.to > model.logLines) {
            return [
              finding(
                "SOURCE-LOG-RANGE",
                item.id,
                `${text}: the decision log has ${model.logLines} lines`
              ),
            ];
          }

          return (source.kind === "issue" || source.kind === "pr") &&
            !tracked.has(trackerKey(source))
            ? [
                finding(
                  "TRACKER-MISSING",
                  item.id,
                  `source ${text} has no entry in model/tracker.yaml (run tracker:refresh)`
                ),
              ]
            : [];
        },
      })
    )
  );
};

const checkRefs = (model: Model): readonly Finding[] => {
  const tracked = trackerKeys(model);

  return Arr.flatMap(model.items, (item) =>
    Arr.flatMap(item.refs ?? [], (text): readonly Finding[] =>
      Option.match(parseRef(text), {
        onNone: () => [
          finding(
            "REF-SYNTAX",
            item.id,
            `ref "${text}" is not an issue, a pull request or a docs/specs file`
          ),
        ],
        onSome: (ref) =>
          "isSpec" in ref || tracked.has(trackerKey(ref))
            ? []
            : [
                finding(
                  "TRACKER-MISSING",
                  item.id,
                  `ref ${text} has no entry in model/tracker.yaml (run tracker:refresh)`
                ),
              ],
      })
    )
  );
};

const checkStatus = (model: Model): readonly Finding[] =>
  Arr.flatMap(model.items, (item) => {
    const operator = Arr.some(item.source, (text) =>
      Option.exists(parseSource(text), isOperatorDecision)
    );

    return [
      ...(item.status === "decided" && !operator
        ? [
            finding(
              "STATUS-DECIDED-NOT-OPERATOR",
              item.id,
              `decided, but no source is an operator decision (log:N or record:...)`
            ),
          ]
        : []),
      ...(item.status !== "decided" && item.rationale === undefined
        ? [
            finding(
              "STATUS-NO-RATIONALE",
              item.id,
              `${item.status} elements say why in a rationale`
            ),
          ]
        : []),
    ];
  });

const supportKinds = new Set([
  "component",
  "process",
  "requirement",
  "is-goal",
]);

const hasDirectSupport = (item: Item, edges: readonly Edge[]): boolean =>
  (item.refs ?? []).length > 0 ||
  Arr.some(
    [
      ...incoming(edges, item.id, "serves"),
      ...incoming(edges, item.id, "supports"),
    ],
    (edge) => supportKinds.has(edge.from.kind)
  );

/** A goal is supported directly, or when a goal that refines it is supported. */
const isSupported = (
  item: Item,
  edges: readonly Edge[],
  visiting: ReadonlySet<string>
): boolean => {
  if (hasDirectSupport(item, edges)) {
    return true;
  }

  const next = new Set(visiting).add(item.id);

  return Arr.some(incoming(edges, item.id, "subgoal-of"), (edge) =>
    next.has(edge.from.id) ? false : isSupported(edge.from, edges, next)
  );
};

const checkGoals = (model: Model): readonly Finding[] => {
  const edges = edgesOf(model.items);

  return itemFindings(
    model,
    "GOAL-UNSUPPORTED",
    `no component, process, requirement, spec, issue or pull request supports this goal`,
    (item) => item.kind === "goal" && !isSupported(item, edges, new Set())
  );
};

const goalLinkTypes = new Set(["serves", "supports"]);

const reachesGoal = (
  from: Item,
  edges: readonly Edge[],
  byId: ReadonlyMap<string, Item>
): boolean => {
  const toGoal = (edge: Edge): boolean =>
    goalLinkTypes.has(edge.type) && byId.get(edge.to)?.kind === "goal";

  return (
    Arr.some(outgoing(edges, from.id), toGoal) ||
    Arr.some(outgoing(edges, from.id, "realizes"), (realized) => {
      const target = byId.get(realized.to);

      return (
        target !== undefined && Arr.some(outgoing(edges, target.id), toGoal)
      );
    })
  );
};

const checkComponents = (model: Model): readonly Finding[] => {
  const edges = edgesOf(model.items);
  const byId = itemsById(model);

  return itemFindings(
    model,
    "COMPONENT-NO-GOAL",
    `serves no goal, directly or through a requirement or IS goal it realizes`,
    (item) =>
      item.kind === "component" &&
      item.rejected !== true &&
      !reachesGoal(item, edges, byId)
  );
};

const checkRules = (model: Model): readonly Finding[] => {
  const edges = edgesOf(model.items);
  const byId = itemsById(model);

  return itemFindings(
    model,
    "RULE-NO-GOAL",
    `cites no goal (links.serves)`,
    (item) =>
      item.kind === "rule" &&
      !Arr.some(
        outgoing(edges, item.id, "serves"),
        (edge) => byId.get(edge.to)?.kind === "goal"
      )
  );
};

const checkCoverage = (model: Model): readonly Finding[] =>
  Arr.flatMap(scopes, (scope) =>
    Arr.flatMap(subModels, (subModel) =>
      Arr.some(
        model.items,
        (item) =>
          item.scope === scope && kindInfo[item.kind].subModel === subModel
      )
        ? []
        : [
            finding(
              "COVERAGE-SUBMODEL",
              scope,
              `scope ${scope} has no element in the ${subModel} sub-model`
            ),
          ]
    )
  );

const checkProducts = (model: Model): readonly Finding[] => [
  ...Arr.flatMap(productScopes, (scope) => {
    const products = Arr.filter(
      model.items,
      (item) =>
        item.scope === scope &&
        item.kind === "component" &&
        item.tier === "product"
    );

    const qualities = Arr.filter(
      model.items,
      (item) =>
        item.scope === scope &&
        item.kind === "requirement" &&
        item.reqType === "non-functional" &&
        item.quality !== undefined
    );

    return [
      ...(products.length === 1
        ? []
        : [
            finding(
              "PRODUCT-COMPONENT",
              scope,
              `needs exactly one component with tier product, has ${products.length}`
            ),
          ]),
      ...(qualities.length > 0
        ? []
        : [
            finding(
              "QUALITY-MISSING",
              scope,
              `states no quality goal (a non-functional requirement with a quality)`
            ),
          ]),
    ];
  }),
  ...(Arr.filter(
    model.items,
    (item) =>
      item.kind === "goal" && item.scope === "org" && item.tagline !== undefined
  ).length === 1
    ? []
    : [
        finding(
          "ORG-TAGLINE",
          "org",
          `the organisation needs exactly one goal with a tagline`
        ),
      ]),
];

const checkCanvas = (model: Model): readonly Finding[] =>
  Arr.flatMap(canvasBlocks, (block) =>
    Arr.some(model.items, (item) => item.canvas?.includes(block) === true)
      ? []
      : [
          finding(
            "CANVAS-EMPTY",
            block,
            `no element is tagged with the canvas block ${block}`
          ),
        ]
  );

export const checkModel = (model: Model): readonly Finding[] => [
  ...checkIds(model),
  ...checkLinks(model),
  ...checkFieldRules(model),
  ...checkSources(model),
  ...checkRefs(model),
  ...checkStatus(model),
  ...checkGoals(model),
  ...checkComponents(model),
  ...checkRules(model),
  ...checkCoverage(model),
  ...checkProducts(model),
  ...checkCanvas(model),
];

export const formatFinding = (found: Finding): string =>
  `${found.code} ${found.id}: ${found.message}`;
