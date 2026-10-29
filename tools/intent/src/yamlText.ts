// A plain YAML scalar ends at the first " #": the rest of the line is a comment. `rationale: Issue #15 reports it` therefore
// decodes to "Issue" and the model silently loses the sentence. This module compares the text of a model file with what
// the parser kept: a plain scalar that carries a trailing comment is a cut value, and the file does not load.
import { Array as Arr, String as Str } from "effect";
import { parseDocument, visit } from "yaml";

export interface CutValue {
  /** The kept value, which ends where the comment starts. */
  readonly kept: string;
  /** The lost text, after the `#`. */
  readonly lost: string;
  /** The 1-based line of the kept value. */
  readonly line: number;
}

const lineOf = (text: string, offset: number): number =>
  Arr.length(Str.split(Str.slice(0, offset)(text), "\n"));

/** Every plain scalar of `text` that a trailing comment has cut. */
export const cutValues = (text: string): readonly CutValue[] => {
  const found: CutValue[] = [];

  visit(parseDocument(text), {
    Scalar: (_key, node) => {
      if (
        node.type === "PLAIN" &&
        node.comment !== undefined &&
        node.comment !== null
      ) {
        found.push({
          kept: String(node.value),
          line: lineOf(text, node.range?.[0] ?? 0),
          lost: Str.trim(node.comment),
        });
      }
    },
  });

  return found;
};

export const describeCut = (cut: CutValue): string =>
  `line ${cut.line}: the value "${cut.kept}" is cut at " #"; the parser dropped "${cut.lost}". Quote the value or use a folded block (>-).`;
