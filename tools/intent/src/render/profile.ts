// profile/README.md (the GitHub organisation profile) and docs/README.md (the index). Pure functions: Model in, Markdown out.
import { Array as Arr, Option, Order, Record as Rec } from "effect";

import { edgesOf, filterSome } from "../model.ts";
import type { Edge, Item, Model } from "../model.ts";
import {
  kinds,
  kindInfo,
  productScopes,
  scopes,
  subModels,
  subModelTitles,
} from "../vocabulary.ts";
import type { Scope } from "../vocabulary.ts";
import {
  generatedNotice,
  itemsOfScope,
  oneLine,
  scopeTitles,
  statusCounts,
  subModelPages,
  table,
} from "./format.ts";

const site = "https://github.com/reebeat/.github/blob/main/";

const productRow = (item: Item): string =>
  item.kind === "component"
    ? Arr.join(
        [
          `### [${item.title}](https://github.com/reebeat/${item.repo ?? ""})`,
          "",
          item.tagline === undefined ? "" : `*${item.tagline}*`,
          "",
          oneLine(item.statement),
          "",
          `Licence: ${item.licence ?? "not stated"}. Model status: ${item.status}. [Product page](${site}docs/products/${item.scope}.md).`,
          "",
        ],
        "\n"
      )
    : "";

export const renderProfile = (model: Model): string => {
  const vision = Arr.findFirst(
    model.items,
    (item) => item.kind === "goal" && item.tagline !== undefined
  );

  const products = filterSome(productScopes, (scope) =>
    Arr.findFirst(
      itemsOfScope(model.items, scope),
      (item) => item.kind === "component" && item.tier === "product"
    )
  );

  const qualities = Arr.filter(
    model.items,
    (item) =>
      item.kind === "goal" &&
      item.scope === "org" &&
      Arr.contains(
        item.links?.["subgoal-of"] ?? Arr.empty<string>(),
        "goal-org-vision"
      )
  );

  const counts = statusCounts(model.items);

  const open = Arr.filter(
    model.tracker.items,
    (entry) => entry.state === "open"
  ).length;

  const body = Option.match(vision, {
    onNone: () => "",
    onSome: (goal) =>
      goal.kind === "goal"
        ? Arr.join(
            [
              `# ${goal.tagline ?? goal.title}`,
              "",
              oneLine(goal.statement),
              "",
              goal.elevator === undefined
                ? ""
                : `**In one line:** ${oneLine(goal.elevator)}`,
              "",
              goal.technicalLine === undefined
                ? ""
                : `**How it works, technically:** ${oneLine(goal.technicalLine)}`,
              "",
            ],
            "\n"
          )
        : "",
  });

  return Arr.join(
    [
      generatedNotice,
      "",
      body,
      "## What we aim for",
      "",
      ...Arr.map(
        qualities,
        (goal) => `- **${goal.title}.** ${oneLine(goal.statement)}`
      ),
      "",
      "## The product family",
      "",
      ...Arr.map(products, productRow),
      "## Read more",
      "",
      ...Arr.flatMap(model.items, (item) =>
        item.kind === "component" && item.url !== undefined
          ? [
              `- [${item.title}](${item.url}): ${oneLine(item.statement)} (${item.status})`,
            ]
          : []
      ),
      "",
      "## Status and roadmap",
      "",
      `The model holds ${model.items.length} elements: ${counts.decided} decided by the operator, ${counts.proposed} proposed and ${counts.open} open. ${open} tracked issues and pull requests are open (snapshot of ${model.tracker.asOf}).`,
      "",
      `- [Roadmap](${site}docs/roadmap.md): generated from the model and the issue tracker.`,
      `- [Goals](${site}docs/goals.md) and the other [4EM sub-model pages](${site}docs/README.md).`,
      `- [Business model](${site}docs/business-model.md): the canvas, and the free and paid split.`,
      `- [Gap report](${site}docs/gaps.md): what is missing in the repositories, and how to fix it.`,
      `- [To confirm](${site}docs/confirm.md): what waits for the operator to confirm or reject.`,
      "",
    ],
    "\n"
  );
};

const countTable = (model: Model): string =>
  table(
    [
      "Sub-model",
      ...Arr.map(scopes, (scope) => scopeTitles[scope]),
      "decided",
      "proposed",
      "open",
    ],
    Arr.map(subModels, (subModel) => {
      const slice = Arr.filter(
        model.items,
        (item) => kindInfo[item.kind].subModel === subModel
      );

      const counts = statusCounts(slice);

      return [
        `[${subModelTitles[subModel]}](${subModelPages[subModel]})`,
        ...Arr.map(scopes, (scope) => `${itemsOfScope(slice, scope).length}`),
        `${counts.decided}`,
        `${counts.proposed}`,
        `${counts.open}`,
      ];
    })
  );

const linkMatrix = (model: Model): string => {
  const edges = edgesOf(model.items);

  const targetOf = (edge: Edge): Option.Option<Item> =>
    Arr.findFirst(model.items, (item) => item.id === edge.to);

  const pairs = Arr.groupBy(
    Arr.filter(edges, (edge) =>
      Option.exists(
        targetOf(edge),
        (target) =>
          kindInfo[edge.from.kind].subModel !== kindInfo[target.kind].subModel
      )
    ),
    (edge) =>
      `${kindInfo[edge.from.kind].subModel} -> ${Option.match(targetOf(edge), {
        onNone: () => "",
        onSome: (target) => kindInfo[target.kind].subModel,
      })}`
  );

  return table(
    ["From sub-model -> to sub-model", "Links", "Link types"],
    Arr.map(
      Arr.sort(
        Rec.toEntries(pairs),
        Order.mapInput(
          Order.String,
          (entry: readonly [string, readonly Edge[]]) => entry[0]
        )
      ),
      ([pair, group]) => [
        pair,
        `${group.length}`,
        Arr.join(
          Arr.sort(
            Arr.dedupe(Arr.map(group, (edge) => edge.type)),
            Order.String
          ),
          ", "
        ),
      ]
    )
  );
};

const kindTable = (model: Model): string =>
  table(
    ["Kind", "Sub-model", ...Arr.map(["decided", "proposed", "open"], String)],
    Arr.map(kinds, (kind) => {
      const counts = statusCounts(
        Arr.filter(model.items, (item) => item.kind === kind)
      );

      return [
        kindInfo[kind].label,
        subModelTitles[kindInfo[kind].subModel],
        `${counts.decided}`,
        `${counts.proposed}`,
        `${counts.open}`,
      ];
    })
  );

export const renderIndex = (model: Model): string => {
  const scopeRows = Arr.map(scopes, (scope: Scope) => {
    const counts = statusCounts(itemsOfScope(model.items, scope));

    return [
      scope === "org"
        ? scopeTitles[scope]
        : `[${scopeTitles[scope]}](products/${scope}.md)`,
      `${itemsOfScope(model.items, scope).length}`,
      `${counts.decided}`,
      `${counts.proposed}`,
      `${counts.open}`,
    ];
  });

  return Arr.join(
    [
      generatedNotice,
      "",
      "# The intent model",
      "",
      "The reasons behind the reebeat products, modelled with the 4EM method and generated from `model/`. Read [the spec](specs/0000-intent-model.md) for the method, the rules and the checks.",
      "",
      "## Pages",
      "",
      Arr.join(
        Arr.map(
          subModels,
          (subModel) =>
            `- [${subModelTitles[subModel]}](${subModelPages[subModel]})`
        ),
        "\n"
      ),
      "- [Business model](business-model.md): a Business Model Canvas, with the free and paid split.",
      "- [Roadmap](roadmap.md), [gap report](gaps.md) and [what the operator confirms](confirm.md).",
      ...Arr.map(
        productScopes,
        (scope) =>
          `- Product page: [${scopeTitles[scope]}](products/${scope}.md)`
      ),
      "",
      "## Elements by sub-model and scope",
      "",
      countTable(model),
      "",
      "## Elements by scope and status",
      "",
      table(["Scope", "Elements", "decided", "proposed", "open"], scopeRows),
      "",
      "## Elements by kind",
      "",
      kindTable(model),
      "",
      "## Inter-model links",
      "",
      "4EM relates its sub-models by links between their elements. This table counts the links that join one sub-model to another.",
      "",
      linkMatrix(model),
      "",
      "## Status",
      "",
      "- **decided**: a source shows that the operator decided it.",
      "- **proposed**: an agent or a document proposed it, or it was inferred. Each carries a rationale; the operator confirms or rejects it.",
      "- **open**: a known gap, question or undecided item.",
      "",
    ],
    "\n"
  );
};
