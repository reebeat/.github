// docs/confirm.md: every element that waits for the operator (`proposed` and `open`), by scope, with the reason. The operator
// confirms an element by changing its status to `decided` and citing the line that shows the decision, or rejects it by
// deleting it. Pure function: Model in, Markdown out.
import { Array as Arr, String as Str } from "effect";

import type { Item, Model } from "../model.ts";
import { kindInfo, scopes } from "../vocabulary.ts";
import {
  generatedNotice,
  href,
  itemsOfScope,
  oneLine,
  scopeTitles,
  statusCounts,
  table,
} from "./format.ts";

const waiting = (items: readonly Item[]): readonly Item[] =>
  Arr.filter(items, (item) => item.status !== "decided");

const rowOf = (item: Item): readonly string[] => [
  `[${item.title}](${href(item, "")})`,
  kindInfo[item.kind].label,
  item.status,
  oneLine(item.rationale ?? ""),
];

const scopeSection = (model: Model, scope: (typeof scopes)[number]): string => {
  const items = waiting(itemsOfScope(model.items, scope));
  const counts = statusCounts(items);

  return Arr.join(
    [
      `## ${scopeTitles[scope]}`,
      "",
      `${items.length} elements wait: ${counts.proposed} proposed, ${counts.open} open.`,
      "",
      table(
        ["Element", "Kind", "Status", "Why it waits, and what to confirm"],
        Arr.map(items, rowOf)
      ),
      "",
    ],
    "\n"
  );
};

/** A decided element with no line of the operator's decision log among its sources: it rests on repository records. */
const restsOnRecordsOnly = (item: Item): boolean =>
  item.status === "decided" &&
  !Arr.some(item.source, (text) => Str.startsWith("log:")(text));

const recordsOnlySection = (model: Model): string => {
  const items = Arr.filter(model.items, restsOnRecordsOnly);

  return Arr.join(
    [
      "## Decided on a repository record only",
      "",
      `${items.length} elements are \`decided\` and cite no line of the operator's decision log. Each cites a line of a repository document that records the operator's decision (a \`record:\` source, checked by \`sources:verify\`). The decision log is the declared source of truth and does not hold these decisions. To ratify one, add the decision to the log (the operator does this; this repository never edits it) and cite the log line as a source.`,
      "",
      table(
        ["Element", "Scope", "Kind", "Sources"],
        Arr.map(items, (item) => [
          `[${item.title}](${href(item, "")})`,
          item.scope,
          kindInfo[item.kind].label,
          Arr.join(item.source, ", "),
        ])
      ),
      "",
    ],
    "\n"
  );
};

export const renderConfirm = (model: Model): string =>
  Arr.join(
    [
      generatedNotice,
      "",
      "# What the operator confirms or rejects",
      "",
      "Every element in the scope tables is not an operator decision. `proposed` means an agent, a spec or an inference put it forward; `open` means a gap, a question or an undecided choice. Each row says why it waits and what to confirm. The last section lists decided elements that rest on repository records alone.",
      "",
      "To confirm an element, change its `status` to `decided` in `model/` and cite the line that shows the decision (a line of the decision log, or a repository line that records it); to reject it, delete it. Run `bun run model:check` and `bun run generate`.",
      "",
      ...Arr.map(scopes, (scope) => scopeSection(model, scope)),
      recordsOnlySection(model),
    ],
    "\n"
  );
