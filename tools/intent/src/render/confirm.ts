// docs/confirm.md: every element that waits for the operator (`proposed` and `open`), by scope, with the reason. The operator
// confirms an element by changing its status to `decided` and citing the line that shows the decision, or rejects it by
// deleting it. Pure function: Model in, Markdown out.
import { Array as Arr, String as Str } from "effect";

import { itemsById } from "../model.ts";
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

const rowOf =
  (advice: ReadonlyMap<string, string>) =>
  (item: Item): readonly string[] => [
    `[${item.title}](${href(item, "")})`,
    kindInfo[item.kind].label,
    item.status,
    oneLine(item.rationale ?? ""),
    advice.get(item.id) ?? "",
  ];

const scopeSection = (model: Model, scope: (typeof scopes)[number]): string => {
  const items = waiting(itemsOfScope(model.items, scope));
  const counts = statusCounts(items);

  const advice = new Map(
    Arr.map(model.triage.advice, (entry) => [entry.id, entry.advice] as const)
  );

  return Arr.join(
    [
      `## ${scopeTitles[scope]}`,
      "",
      `${items.length} elements wait: ${counts.proposed} proposed, ${counts.open} open.`,
      "",
      table(
        [
          "Element",
          "Kind",
          "Status",
          "Why it waits, and what to confirm",
          "Triage advice",
        ],
        Arr.map(items, rowOf(advice))
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

const recheckSection = (model: Model): string => {
  const byId = itemsById(model);

  const rows = Arr.flatMap(model.triage.recheck ?? [], (entry) => {
    const item = byId.get(entry.id);

    return item === undefined
      ? []
      : [
          [
            `[${item.title}](${href(item, "")})`,
            item.scope,
            item.status,
            oneLine(entry.note),
          ],
        ];
  });

  return Arr.join(
    [
      "## Citations to re-read",
      "",
      `${rows.length} elements cite lines that another commit changed between two pins of \`model/sources.yaml\`. The citation was moved to the new lines and still resolves, but the statement was written from the old text and may now disagree with it. Read the new lines, then correct the statement and delete the entry from \`recheck\` in \`model/triage.yaml\`.`,
      "",
      table(["Element", "Scope", "Status", "What changed"], rows),
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
      'Every element in the scope tables is not an operator decision. `proposed` means an agent, a spec or an inference put it forward; `open` means a gap, a question or an undecided choice. Each row says why it waits and what to confirm. The column "Triage advice" holds the lead\'s advice where there is one ("Recommended: confirm", or a recommended default); the operator has not answered it, so it is not a decision. The next section lists decided elements that rest on repository records alone; the last lists elements whose cited lines changed at a re-pin.',
      "",
      "To confirm an element, change its `status` to `decided` in `model/` and cite the line that shows the decision (a line of the decision log, or a repository line that records it); to reject it, delete it. Run `bun run model:check` and `bun run generate`.",
      "",
      ...Arr.map(scopes, (scope) => scopeSection(model, scope)),
      recordsOnlySection(model),
      recheckSection(model),
    ],
    "\n"
  );
