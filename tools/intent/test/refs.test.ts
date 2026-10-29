import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";

import {
  isOperatorDecision,
  parseRef,
  parseSource,
  sourceLabel,
} from "../src/refs.ts";

const decision = (text: string): boolean =>
  Option.exists(parseSource(text), isOperatorDecision);

describe("source grammar", () => {
  it("parses a decision-log line and a range", () => {
    assert.deepStrictEqual(Option.getOrNull(parseSource("log:43")), {
      from: 43,
      kind: "log",
      to: 43,
    });
    assert.deepStrictEqual(Option.getOrNull(parseSource("log:43-45")), {
      from: 43,
      kind: "log",
      to: 45,
    });
  });

  it("parses a file line, a record line and an absence", () => {
    assert.deepStrictEqual(
      Option.getOrNull(parseSource("reebeat:README.md:12")),
      {
        from: 12,
        kind: "file",
        path: "README.md",
        repo: "reebeat",
        to: 12,
      }
    );
    assert.strictEqual(
      Option.getOrNull(parseSource("record:studio:docs/a.md:3-4"))?.kind,
      "record"
    );
    assert.strictEqual(
      Option.getOrNull(parseSource("absent:foldkit-flow:CONTRIBUTING.md"))
        ?.kind,
      "absent"
    );
  });

  it("parses issues, pull requests and comments", () => {
    const comment = Option.getOrNull(
      parseSource("issue:reebeat#19@6503203735")
    );

    assert.strictEqual(comment?.kind, "issue");
    assert.strictEqual(
      sourceLabel(comment ?? { from: 1, kind: "log", to: 1 }),
      "issue reebeat#19"
    );
    assert.strictEqual(
      Option.getOrNull(parseSource("pr:studio#6"))?.kind,
      "pr"
    );
  });

  it("rejects text that is not a source", () => {
    for (const text of [
      "",
      "log:",
      "log:0",
      "log:5-3",
      "nowhere:README.md:1",
      "reebeat:README.md",
      "issue:reebeat#x",
    ]) {
      assert.isTrue(Option.isNone(parseSource(text)), text);
    }
  });

  it("counts only the log and recorded decisions as operator decisions", () => {
    assert.isTrue(decision("log:7"));
    assert.isTrue(decision("record:reebeat:docs/a.md:3"));
    assert.isFalse(decision("reebeat:docs/a.md:3"));
    assert.isFalse(decision("issue:reebeat#7"));
    assert.isFalse(decision("absent:reebeat:SECURITY.md"));
  });
});

describe("ref grammar", () => {
  it("accepts issues, pull requests and spec files, and nothing else", () => {
    assert.isTrue(Option.isSome(parseRef("issue:reebeat#7")));
    assert.isTrue(Option.isSome(parseRef("pr:reebeat#18")));
    assert.isTrue(Option.isSome(parseRef("reebeat:docs/specs/0007-x.md:1")));
    assert.isTrue(Option.isNone(parseRef("reebeat:README.md:1")));
    assert.isTrue(Option.isNone(parseRef("log:3")));
  });
});
