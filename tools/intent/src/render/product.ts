// docs/products/<product>.md: a product vision board (Pichler), the arc42 goal and quality sections, and the product's slice
// of every 4EM sub-model. Pure functions: Model in, Markdown out.
import { Array as Arr, Option, Record as Rec, String as Str } from "effect";

import { filterSome, itemsById, ofKind } from "../model.ts";
import type { Item, Model } from "../model.ts";
import { kindInfo, subModelTitles } from "../vocabulary.ts";
import type { Scope } from "../vocabulary.ts";
import {
  generatedNotice,
  inSubModel,
  itemsOfScope,
  oneLine,
  scopeTitles,
  sourceLinks,
  statusCounts,
  subModelPages,
  table,
  titleLink,
} from "./format.ts";
import { goalsDiagram, processesDiagram } from "./subModels.ts";

const prefix = "../";

const bullets = (items: readonly string[]): string =>
  items.length === 0
    ? "_None stated yet._"
    : Arr.join(
        Arr.map(items, (text) => `- ${text}`),
        "\n"
      );

const productComponent = (items: readonly Item[]): Option.Option<Item> =>
  Arr.findFirst(
    items,
    (item) => item.kind === "component" && item.tier === "product"
  );

const servedGoals = (model: Model, item: Item): readonly Item[] => {
  const byId = itemsById(model);

  return filterSome(
    [...(item.links?.serves ?? []), ...(item.links?.supports ?? [])],
    (id) => Option.fromNullishOr(byId.get(id))
  );
};

const mark = (item: Item): string =>
  `${titleLink(item, prefix)} (${item.status})`;

const visionBoard = (
  model: Model,
  scope: Scope,
  items: readonly Item[]
): string => {
  const product = productComponent(items);

  const vision = Option.match(product, {
    onNone: () => Arr.empty<Item>(),
    onSome: (item) => servedGoals(model, item),
  });

  const jobs = Arr.filter(
    items,
    (item) => item.kind === "goal" && item.jtbd !== undefined
  );

  const byId = itemsById(model);

  const personas = Arr.dedupeWith(
    filterSome(jobs, (item) =>
      item.kind === "goal" && item.jtbd !== undefined
        ? Option.fromNullishOr(byId.get(item.jtbd.persona))
        : Option.none()
    ),
    (a, b) => a.id === b.id
  );

  const roles = Arr.filter(
    items,
    (item) => item.kind === "actor" && item.actorType === "role"
  );

  const features = Arr.filter(
    items,
    (item) =>
      (item.kind === "component" &&
        item.tier !== "product" &&
        item.rejected !== true) ||
      (item.kind === "requirement" && item.reqType === "functional")
  );

  const served: readonly Item[] = Arr.flatMap(ofKind(items, "goal"), (goal) =>
    servedGoals(model, goal)
  );

  const orgGoals = Arr.dedupeWith(served, (a, b) => a.id === b.id);

  const inRevenueStreams: readonly Item[] = Arr.filter(
    items,
    (item) => item.canvas?.includes("revenue-streams") === true
  );

  const businessGoals = Arr.filter(
    Arr.dedupeWith([...orgGoals, ...inRevenueStreams], (a, b) => a.id === b.id),
    (item) =>
      item.scope === "org" || item.canvas?.includes("revenue-streams") === true
  );

  return Arr.join(
    [
      "## Product vision board",
      "",
      "After Roman Pichler's product vision board. Each cell is built from the model; click through to the element.",
      "",
      table(
        ["Cell", "Content"],
        [
          [
            "Vision",
            Arr.join(
              Arr.map(
                vision,
                (goal) => `${mark(goal)}: ${oneLine(goal.statement)}`
              ),
              "<br/>"
            ) || "_No vision goal is linked to the product component._",
          ],
          [
            "Target group",
            Arr.join(
              Arr.map(
                Arr.dedupeWith(
                  [...personas, ...roles],
                  (a, b) => a.id === b.id
                ),
                mark
              ),
              "<br/>"
            ) || "_None stated yet._",
          ],
          [
            "Needs (jobs to be done)",
            Arr.join(
              Arr.map(jobs, (item) =>
                item.kind === "goal" && item.jtbd !== undefined
                  ? `When ${oneLine(item.jtbd.when)}, I want ${oneLine(item.jtbd.want)}, so that ${oneLine(item.jtbd.soThat)} (${item.status})`
                  : ""
              ),
              "<br/>"
            ) || "_No jobs stated for this product yet._",
          ],
          [
            "Product (key features)",
            Arr.join(Arr.map(features, mark), "<br/>") || "_None stated yet._",
          ],
          [
            "Business goals",
            Arr.join(Arr.map(businessGoals, mark), "<br/>") ||
              "_None stated yet._",
          ],
        ]
      ),
      "",
      `Scope \`${scope}\`: ${items.length} elements.`,
      "",
    ],
    "\n"
  );
};

const arc42 = (model: Model, items: readonly Item[]): string => {
  const functional = Arr.filter(
    items,
    (item) => item.kind === "requirement" && item.reqType === "functional"
  );

  const qualities = Arr.filter(
    items,
    (item) => item.kind === "requirement" && item.quality !== undefined
  );

  const stakeholders = Arr.filter(items, (item) => item.kind === "actor");

  return Arr.join(
    [
      "## Goals and quality requirements (arc42 sections 1 and 10)",
      "",
      "### 1.1 Requirements overview",
      "",
      functional.length === 0
        ? "_None stated yet._"
        : table(
            ["Requirement", "Statement", "Status", "Sources"],
            Arr.map(functional, (item) => [
              titleLink(item, prefix),
              oneLine(item.statement),
              item.status,
              sourceLinks(model, item, prefix),
            ])
          ),
      "",
      "### 1.2 Quality goals",
      "",
      qualities.length === 0
        ? "_None stated yet._"
        : table(
            ["Quality", "Goal", "Scenario", "Status"],
            Arr.map(qualities, (item) =>
              item.kind === "requirement"
                ? [
                    item.quality ?? "",
                    `${titleLink(item, prefix)}: ${oneLine(item.statement)}`,
                    item.scenario === undefined ? "" : oneLine(item.scenario),
                    item.status,
                  ]
                : []
            )
          ),
      "",
      "### 1.3 Stakeholders",
      "",
      stakeholders.length === 0
        ? "_None stated yet._"
        : table(
            ["Stakeholder", "Role in the product", "Status"],
            Arr.map(stakeholders, (item) => [
              titleLink(item, prefix),
              oneLine(item.statement),
              item.status,
            ])
          ),
      "",
    ],
    "\n"
  );
};

const roadmapSection = (model: Model, items: readonly Item[]): string => {
  const tracker = new Map(
    Arr.map(model.tracker.items, (entry) => [entry.ref, entry] as const)
  );

  const rows = Arr.flatMap(items, (item) =>
    filterSome([...(item.refs ?? []), ...item.source], (text) =>
      Option.fromNullishOr(
        tracker.get(Arr.headNonEmpty(Str.split("@")(text)))
      ).pipe(
        Option.map(
          (entry) =>
            [
              entry.ref,
              entry.title,
              entry.state,
              titleLink(item, prefix),
            ] as const
        )
      )
    )
  );

  const unique = Arr.dedupeWith(rows, (a, b) => a[0] === b[0] && a[3] === b[3]);

  return Arr.join(
    [
      "## Work items",
      "",
      unique.length === 0
        ? "_No issue or pull request is cited for this product._"
        : table(
            ["Item", "Title", "State", "Element"],
            Arr.map(unique, (row) => [...row])
          ),
      "",
    ],
    "\n"
  );
};

const problemsSection = (items: readonly Item[]): string => {
  const problems = Arr.filter(
    items,
    (item) => item.kind === "problem" || item.kind === "constraint"
  );

  return Arr.join(
    [
      "## Problems and constraints",
      "",
      problems.length === 0
        ? "_None stated._"
        : bullets(
            Arr.map(
              problems,
              (item) => `${mark(item)}: ${oneLine(item.statement)}`
            )
          ),
      "",
    ],
    "\n"
  );
};

const renderProductPage = (model: Model, scope: Scope): string => {
  const items = itemsOfScope(model.items, scope);
  const product = productComponent(items);

  const name = Option.match(product, {
    onNone: () => scopeTitles[scope],
    onSome: (item) => item.title,
  });

  const counts = statusCounts(items);

  const header = Option.match(product, {
    onNone: () => "",
    onSome: (item) =>
      Arr.join(
        [
          item.kind === "component" && item.tagline !== undefined
            ? `> ${item.tagline}`
            : "",
          "",
          oneLine(item.statement),
          "",
          item.kind === "component"
            ? `Repository: ${item.repo === undefined ? "n/a" : `[reebeat/${item.repo}](https://github.com/reebeat/${item.repo})`}. Licence: ${item.licence ?? "not stated"}. Status of this description: ${item.status}.`
            : "",
          "",
        ],
        "\n"
      ),
  });

  return Arr.join(
    [
      generatedNotice,
      "",
      `# ${name}`,
      "",
      header,
      `${items.length} model elements: ${counts.decided} decided, ${counts.proposed} proposed, ${counts.open} open.`,
      "",
      visionBoard(model, scope, items),
      arc42(model, items),
      problemsSection(items),
      ...Arr.flatMap(
        [
          ["goals", "Goals it serves", goalsDiagram],
          ["processes", "Key processes", processesDiagram],
        ] as const,
        ([subModel, heading, diagram]) => {
          const slice = inSubModel(items, subModel);

          return slice.length === 0
            ? []
            : [`## ${heading}`, "", diagram(model, slice), ""];
        }
      ),
      ...Arr.flatMap(
        [
          ["rules", "Rules"],
          ["actors", "Actors and resources"],
          ["technical", "Components, requirements and IS goals"],
          ["concepts", "Concepts"],
        ] as const,
        ([subModel, heading]) => {
          const slice = inSubModel(items, subModel);

          return slice.length === 0
            ? []
            : [
                `## ${heading}`,
                "",
                `Full tables and diagrams: [${subModelTitles[subModel]}](${prefix}${subModelPages[subModel]}).`,
                "",
                bullets(
                  Arr.map(
                    slice,
                    (item) =>
                      `${titleLink(item, prefix)} (${Str.toLowerCase(kindInfo[item.kind].label)}, ${item.status})`
                  )
                ),
                "",
              ];
        }
      ),
      roadmapSection(model, items),
    ],
    "\n"
  );
};

export const productFiles = (
  model: Model,
  scopes: readonly Scope[]
): Readonly<Record<string, string>> =>
  Rec.fromEntries(
    Arr.map(scopes, (scope) => [
      `docs/products/${scope}.md`,
      renderProductPage(model, scope),
    ])
  );
