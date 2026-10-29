// The loaded model: every element with its scope, indexed by id. Pure data; checks and renderers read it.
import { Array as Arr, Option, Record as Rec } from "effect";

import type { Element, Sources, Tracker, Triage } from "./schema.ts";
import { kindInfo } from "./vocabulary.ts";
import type { Kind, Scope, SubModel } from "./vocabulary.ts";

/** The present results of `f` over `items`, in order. */
export const filterSome = <A, B>(
  items: Iterable<A>,
  f: (item: A) => Option.Option<B>
): readonly B[] =>
  Arr.flatMap(Arr.fromIterable(items), (item) => Option.toArray(f(item)));

export type Item = Element & { readonly scope: Scope };

export interface ModelInput {
  readonly files: readonly {
    readonly elements: readonly Element[];
    readonly scope: Scope;
  }[];
  /** The number of lines of the operator's decision log, so a `log:N` source can be range-checked. */
  readonly logLines: number;
  readonly sources: Sources;
  readonly tracker: Tracker;
  readonly triage: Triage;
}

export interface Model {
  /** All items in file order, duplicates included (a check reports them). */
  readonly items: readonly Item[];
  readonly logLines: number;
  readonly sources: Sources;
  readonly tracker: Tracker;
  /** The lead's advice on elements that wait (confirm, or a default); it is not a decision. */
  readonly triage: Triage;
}

export const buildModel = (input: ModelInput): Model => ({
  items: Arr.flatMap(input.files, (file) =>
    Arr.map(file.elements, (element) => ({ ...element, scope: file.scope }))
  ),
  logLines: input.logLines,
  sources: input.sources,
  tracker: input.tracker,
  triage: input.triage,
});

export const itemsById = (model: Model): ReadonlyMap<string, Item> =>
  new Map(Arr.map(model.items, (item) => [item.id, item] as const));

export const subModelOf = (item: Item): SubModel =>
  kindInfo[item.kind].subModel;

export const ofKind = <K extends Kind>(
  items: readonly Item[],
  kind: K
): readonly (Item & { readonly kind: K })[] =>
  Arr.filter(
    items,
    (item): item is Item & { readonly kind: K } => item.kind === kind
  );

export interface Edge {
  readonly from: Item;
  readonly to: string;
  readonly type: string;
}

/** Every link of every item as an edge, in file order. */
export const edgesOf = (items: readonly Item[]): readonly Edge[] =>
  Arr.flatMap(items, (from) =>
    Arr.flatMap(Rec.toEntries(from.links ?? {}), ([type, targets]) =>
      Arr.map(targets, (to) => ({ from, to, type }))
    )
  );

export const outgoing = (
  edges: readonly Edge[],
  id: string,
  type?: string
): readonly Edge[] =>
  Arr.filter(
    edges,
    (edge) => edge.from.id === id && (type === undefined || edge.type === type)
  );

export const incoming = (
  edges: readonly Edge[],
  id: string,
  type?: string
): readonly Edge[] =>
  Arr.filter(
    edges,
    (edge) => edge.to === id && (type === undefined || edge.type === type)
  );
