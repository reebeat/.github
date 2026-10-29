// docs/business-model.md (a Business Model Canvas), docs/roadmap.md and docs/gaps.md. Pure functions: Model in, Markdown out.
import { Array as Arr, Option, Order, String as Str } from "effect";

import { filterSome } from "../model.ts";
import type { Item, Model } from "../model.ts";
import {
  parseRef,
  parseSource,
  sourceLabel,
  sourceUrl,
  trackerKey,
} from "../refs.ts";
import { canvasBlocks, canvasTitles, repoSlugs } from "../vocabulary.ts";
import type { CanvasBlock } from "../vocabulary.ts";
import {
  generatedNotice,
  href,
  oneLine,
  scopeTitles,
  sourceLinks,
  table,
  titleLink,
} from "./format.ts";

const html = (text: string): string =>
  Str.replaceAll(
    ">",
    "&gt;"
  )(Str.replaceAll("<", "&lt;")(Str.replaceAll("&", "&amp;")(text)));

const inBlock = (model: Model, block: CanvasBlock): readonly Item[] =>
  Arr.filter(model.items, (item) => item.canvas?.includes(block) === true);

const cell = (model: Model, block: CanvasBlock, attributes: string): string => {
  const items = inBlock(model, block);

  return `<td ${attributes} valign="top"><b>${canvasTitles[block]}</b><ul>${Arr.join(
    Arr.map(
      items,
      (item) =>
        `<li><a href="${href(item, "")}">${html(item.title)}</a> <i>(${item.status})</i></li>`
    ),
    ""
  )}</ul></td>`;
};

const blockTable = (model: Model, block: CanvasBlock): string => {
  const items = inBlock(model, block);

  return Arr.join(
    [
      `### ${canvasTitles[block]}`,
      "",
      table(
        ["Element", "Scope", "Status"],
        Arr.map(items, (item) => [titleLink(item, ""), item.scope, item.status])
      ),
      "",
    ],
    "\n"
  );
};

const pricingSection = (model: Model): string => {
  const priced = Arr.filter(model.items, (item) => item.pricing !== undefined);

  const rule = Arr.findFirst(
    model.items,
    (item) => item.id === "rule-org-paid-when-costly"
  );

  return Arr.join(
    [
      "## Free and paid",
      "",
      Option.match(rule, {
        onNone: () => "",
        onSome: (item) =>
          `The rule ([${item.title}](${href(item, "")}), ${item.status}): ${oneLine(item.statement)}`,
      }),
      "",
      "The operator decided the principle and two paid features: multiplayer collaboration and integrated hosted AI agents. Every other mark below is a proposal until the operator confirms it.",
      "",
      priced.length === 0
        ? "_No element carries a pricing mark yet._"
        : table(
            ["Tier", "Element", "Scope", "Status", "Sources"],
            Arr.map(
              Arr.sort(
                priced,
                Order.mapInput(Order.Number, (item: Item) =>
                  item.pricing === "free" ? 0 : 1
                )
              ),
              (item) => [
                item.pricing ?? "",
                titleLink(item, ""),
                item.scope,
                item.status,
                sourceLinks(model, item, ""),
              ]
            )
          ),
      "",
    ],
    "\n"
  );
};

export const renderBusinessModel = (model: Model): string =>
  Arr.join(
    [
      generatedNotice,
      "",
      "# Business model",
      "",
      "A Business Model Canvas (Osterwalder and Pigneur, *Business Model Generation*, 2010) for an open core: an open compiler with closed products on top, a free tier for what costs nothing to run and a paid tier for what costs money to run. Each box lists the model elements tagged with that block; nothing is written here by hand.",
      "",
      "Elements marked `proposed` or `open` are not operator decisions. Demand and willingness to pay are not measured: see the [gap report](gaps.md).",
      "",
      "<table>",
      `<tr>${cell(model, "key-partners", 'rowspan="2"')}${cell(model, "key-activities", "")}${cell(model, "value-propositions", 'rowspan="2"')}${cell(model, "customer-relationships", "")}${cell(model, "customer-segments", 'rowspan="2"')}</tr>`,
      `<tr>${cell(model, "key-resources", "")}${cell(model, "channels", "")}</tr>`,
      `<tr>${cell(model, "cost-structure", 'colspan="2"')}${cell(model, "revenue-streams", 'colspan="3"')}</tr>`,
      "</table>",
      "",
      pricingSection(model),
      "## The blocks in detail",
      "",
      ...Arr.map(canvasBlocks, (block) => blockTable(model, block)),
    ],
    "\n"
  );

const stateOrder = (state: string): number => {
  if (state === "open") {
    return 0;
  }

  return state === "merged" ? 1 : 2;
};

export const renderRoadmap = (model: Model): string => {
  const itemsByRef = new Map<string, Item[]>();

  for (const item of model.items) {
    for (const text of [...(item.refs ?? []), ...item.source]) {
      const ref = Option.getOrNull(parseRef(text));

      if (ref !== null && (ref.kind === "issue" || ref.kind === "pr")) {
        const key = trackerKey(ref);

        itemsByRef.set(key, [...(itemsByRef.get(key) ?? []), item]);
      }
    }
  }

  const rows = Arr.map(model.tracker.items, (entry) => {
    const source = Option.getOrNull(parseSource(entry.ref));

    const url =
      source === null
        ? ""
        : sourceUrl(
            source,
            model.sources.repos,
            model.sources.decisionLog,
            "../"
          );

    const label = source === null ? entry.ref : sourceLabel(source);

    const elements = Arr.dedupeWith(
      itemsByRef.get(entry.ref) ?? [],
      (a, b) => a.id === b.id
    );

    return {
      entry,
      row: [
        `[${label}](${url})`,
        entry.title,
        entry.state,
        Arr.join(
          Arr.map(elements, (item) => titleLink(item, "")),
          "<br/>"
        ),
      ],
    };
  });

  const group = (
    title: string,
    intro: string,
    keep: (state: string) => boolean
  ): string => {
    const selected = Arr.filter(rows, (row) => keep(row.entry.state));

    return Arr.join(
      [
        `## ${title}`,
        "",
        intro,
        "",
        selected.length === 0
          ? "_None._"
          : table(
              ["Item", "Title", "State", "Model elements it serves"],
              Arr.map(
                Arr.sort(
                  selected,
                  Order.mapInput(Order.Number, (row: (typeof rows)[number]) =>
                    stateOrder(row.entry.state)
                  )
                ),
                (row) => row.row
              )
            ),
        "",
      ],
      "\n"
    );
  };

  const openPrs = Arr.filter(
    rows,
    (row) => Str.startsWith("pr:")(row.entry.ref) && row.entry.state === "open"
  );

  const undecided = Arr.filter(
    model.items,
    (item) => item.status === "open" && (item.refs ?? []).length === 0
  );

  return Arr.join(
    [
      generatedNotice,
      "",
      "# Roadmap",
      "",
      `Generated from the model and a snapshot of GitHub taken on ${model.tracker.asOf} (\`model/tracker.yaml\`, refreshed by \`bun run tracker:refresh\`). The roadmap lives in the model, not in a tool of its own: each item is an issue or pull request that an element of the model cites, with the elements it serves.`,
      "",
      `${openPrs.length} pull requests are open. Items that the model does not cite are not shown.`,
      "",
      group(
        "Open work: pull requests and issues",
        "Work that is not finished. A pull request in review comes before an issue that no one has started.",
        (state) => state === "open"
      ),
      group(
        "Done: merged or closed",
        "Work that landed, or was closed without merging.",
        (state) => state !== "open"
      ),
      "## Open questions without a work item",
      "",
      "Elements whose status is `open` and that no issue or pull request tracks. They wait for a decision, not for code.",
      "",
      undecided.length === 0
        ? "_None._"
        : table(
            ["Element", "Scope", "Why open"],
            Arr.map(undecided, (item) => [
              titleLink(item, ""),
              scopeTitles[item.scope],
              oneLine(item.rationale ?? item.statement),
            ])
          ),
      "",
    ],
    "\n"
  );
};

export const renderGaps = (model: Model): string => {
  const gaps = Arr.filter(
    model.items,
    (item) => item.kind === "problem" && item.gap !== undefined
  );

  const repos = Arr.dedupeWith(
    filterSome(gaps, (item) =>
      item.kind === "problem" && item.gap !== undefined
        ? Option.some(item.gap.repo)
        : Option.none()
    ),
    (a, b) => a === b
  );

  return Arr.join(
    [
      generatedNotice,
      "",
      "# Gap report",
      "",
      `What the analysis found missing in the product repositories, each with its fix. ${gaps.length} gaps. This repository changes none of the product repositories; the fixes are follow-ups for their owners.`,
      "",
      ...Arr.flatMap(repos, (repo) => {
        const slice = Arr.filter(
          gaps,
          (item) => item.kind === "problem" && item.gap?.repo === repo
        );

        const heading =
          repo === "org"
            ? "The organisation"
            : `[${repoSlugs[repo]}](https://github.com/${repoSlugs[repo]})`;

        return [
          `## ${heading}`,
          "",
          table(
            ["Gap", "What is missing", "Evidence", "Fix", "Status"],
            Arr.map(slice, (item) => [
              titleLink(item, ""),
              oneLine(item.statement),
              sourceLinks(model, item, ""),
              item.kind === "problem" && item.gap !== undefined
                ? oneLine(item.gap.fix)
                : "",
              item.status,
            ])
          ),
          "",
        ];
      }),
    ],
    "\n"
  );
};
