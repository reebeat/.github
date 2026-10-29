// Every check has a positive control (the valid fixture passes) and a negative control (one mutation, one finding).
import { assert, describe, it } from "@effect/vitest";
import { Array as Arr, Record as Rec, Result } from "effect";

import { checkModel } from "../src/checks.ts";
import type { Model } from "../src/model.ts";
import { decodeModelFile } from "../src/schema.ts";
import { fixtureFiles, modelOf, withChange, withChanges } from "./fixture.ts";
import type { Raw } from "./fixture.ts";

const codes = (model: Model): readonly string[] =>
  Arr.dedupe(Arr.map(checkModel(model), (found) => found.code));

const without = (element: Raw, key: string): Raw =>
  Rec.filter(element, (_, name) => name !== key);

/** A goal element with every required field except the source; `fields` adds or overrides fields. */
const failsToDecode = (fields: Raw): boolean =>
  Result.isFailure(
    decodeModelFile({
      elements: [
        {
          id: "goal-x-y",
          kind: "goal",
          statement: "s",
          status: "decided",
          title: "t",
          ...fields,
        },
      ],
    })
  );

describe("the valid fixture", () => {
  it("passes every check", () => {
    assert.deepStrictEqual(checkModel(modelOf(fixtureFiles())), []);
  });
});

describe("goal with no support", () => {
  it("fails when no component or process serves the org goal", () => {
    const model = withChanges({
      "comp-org-c": (element) => without(element, "links"),
      "process-org-p": (element) => without(element, "links"),
    });

    assert.include(codes(model), "GOAL-UNSUPPORTED");
  });

  it("passes when a spec ref supports the goal instead", () => {
    const model = withChanges({
      "comp-org-c": (element) => without(element, "links"),
      "goal-org-g": (element) => ({
        ...element,
        refs: ["reebeat:docs/specs/0001-x.md:1"],
      }),
      "process-org-p": (element) => without(element, "links"),
    });

    assert.notInclude(codes(model), "GOAL-UNSUPPORTED");
  });
});

describe("component that serves no goal", () => {
  it("fails when the component has no serves link", () => {
    const model = withChange("comp-reebeat-c", (element) =>
      without(element, "links")
    );

    assert.include(codes(model), "COMPONENT-NO-GOAL");
  });

  it("is exempt when it is a rejected alternative", () => {
    const model = withChange("comp-reebeat-c", (element) => ({
      ...without(element, "links"),
      rejected: true,
    }));

    assert.notInclude(codes(model), "COMPONENT-NO-GOAL");
  });
});

describe("rule that cites no goal", () => {
  it("fails when the rule has no serves link", () => {
    const model = withChange("rule-studio-r", (element) =>
      without(element, "links")
    );

    assert.include(codes(model), "RULE-NO-GOAL");
  });
});

describe("element with no source", () => {
  it("does not decode without a source", () => {
    assert.isTrue(failsToDecode({}));
  });

  it("does not decode with an empty source list", () => {
    assert.isTrue(failsToDecode({ source: [] }));
  });

  it("does not decode a misspelt field", () => {
    assert.isTrue(failsToDecode({ soruce: ["log:1"], source: ["log:1"] }));
  });

  it("fails the check when a source does not parse", () => {
    const model = withChange("goal-org-g", (element) => ({
      ...element,
      source: ["see the readme"],
    }));

    assert.include(codes(model), "SOURCE-SYNTAX");
  });

  it("fails the check when a log line is beyond the log", () => {
    const model = withChange("goal-org-g", (element) => ({
      ...element,
      source: ["log:11"],
    }));

    assert.include(codes(model), "SOURCE-LOG-RANGE");
  });
});

describe("decided element whose source is not an operator decision", () => {
  it("fails for a repository line that records no decision", () => {
    const model = withChange("goal-org-g", (element) => ({
      ...element,
      source: ["reebeat:README.md:3"],
    }));

    assert.include(codes(model), "STATUS-DECIDED-NOT-OPERATOR");
  });

  it("passes for a recorded decision line", () => {
    const model = withChange("goal-org-g", (element) => ({
      ...element,
      source: ["record:reebeat:docs/design/open-core-boundary.md:39"],
    }));

    assert.notInclude(codes(model), "STATUS-DECIDED-NOT-OPERATOR");
  });

  it("passes when the same element is proposed with a rationale", () => {
    const model = withChange("goal-org-g", (element) => ({
      ...element,
      rationale: "The README says so; the operator should confirm.",
      source: ["reebeat:README.md:3"],
      status: "proposed",
    }));

    assert.notInclude(codes(model), "STATUS-DECIDED-NOT-OPERATOR");
  });

  it("fails for a proposed element with no rationale", () => {
    const model = withChange("goal-org-g", (element) => ({
      ...element,
      status: "proposed",
    }));

    assert.include(codes(model), "STATUS-NO-RATIONALE");
  });
});

describe("links", () => {
  it("fails for a dangling target", () => {
    const model = withChange("rule-org-r", (element) => ({
      ...element,
      links: { serves: ["goal-org-nowhere"] },
    }));

    assert.include(codes(model), "LINK-DANGLING");
  });

  it("fails for an unknown link type", () => {
    const model = withChange("rule-org-r", (element) => ({
      ...element,
      links: { loves: ["goal-org-g"], serves: ["goal-org-g"] },
    }));

    assert.include(codes(model), "LINK-UNKNOWN-TYPE");
  });

  it("fails for a link between kinds the type may not join", () => {
    const model = withChange("concept-org-c", (element) => ({
      ...element,
      links: { performs: ["process-org-p"] },
    }));

    assert.include(codes(model), "LINK-KIND");
  });

  it("fails for a link to itself", () => {
    const model = withChange("goal-org-g", (element) => ({
      ...element,
      links: { supports: ["goal-org-g"] },
    }));

    assert.include(codes(model), "LINK-SELF");
  });
});

const advised = (id: string, change: (element: Raw) => Raw) => {
  const model = withChange(id, change);

  return {
    ...model,
    triage: { advice: [{ advice: "Recommended: confirm", id }] },
  };
};

describe("a decided problem that keeps a gap", () => {
  it("passes: the answer decides how to resolve it, the gap stays", () => {
    const files = Arr.map(fixtureFiles(), (file) =>
      file.scope === "org"
        ? {
            ...file,
            elements: [
              ...file.elements,
              {
                gap: { fix: "Add the missing file.", repo: "reebeat" },
                id: "problem-org-p",
                kind: "problem",
                links: { hinders: ["goal-org-g"] },
                source: ["log:7"],
                statement: "The file is missing; it will be added.",
                status: "decided",
                title: "A missing file",
              },
            ],
          }
        : file
    );

    assert.deepStrictEqual(checkModel(modelOf(files)), []);
  });
});

describe("triage advice", () => {
  it("passes advice on an element that waits", () => {
    const model = advised("goal-org-g", (element) => ({
      ...element,
      rationale: "Waits for the operator.",
      status: "proposed",
    }));

    assert.notInclude(codes(model), "TRIAGE-DECIDED");
    assert.notInclude(codes(model), "TRIAGE-UNKNOWN-ID");
  });

  it("fails when the advised element is decided", () => {
    assert.include(
      codes(advised("goal-org-g", (element) => element)),
      "TRIAGE-DECIDED"
    );
  });

  it("fails when the advised id does not exist", () => {
    const model = {
      ...withChange("goal-org-g", (element) => element),
      triage: {
        advice: [{ advice: "Recommended: confirm", id: "goal-org-nowhere" }],
      },
    };

    assert.include(codes(model), "TRIAGE-UNKNOWN-ID");
  });
});

describe("text cut short", () => {
  it("fails when a rationale ends at the word Issue", () => {
    const model = withChange("goal-org-g", (element) => ({
      ...element,
      rationale: "Issue",
      status: "proposed",
    }));

    assert.include(codes(model), "TEXT-DANGLING");
  });

  it("fails when a statement ends at a hash sign", () => {
    const model = withChange("goal-org-g", (element) => ({
      ...element,
      statement: "Proposed in issue #",
    }));

    assert.include(codes(model), "TEXT-DANGLING");
  });

  it("passes a rationale that mentions an issue and goes on", () => {
    const model = withChange("goal-org-g", (element) => ({
      ...element,
      rationale: "Issue #14 reports it.",
      status: "proposed",
    }));

    assert.notInclude(codes(model), "TEXT-DANGLING");
  });
});

describe("identity and structure", () => {
  it("fails for an id that begins with the prefix of another kind", () => {
    const model = withChange("concept-org-c", (element) => ({
      ...element,
      id: "goal-org-wrong",
    }));

    assert.include(codes(model), "ID-PREFIX");
  });

  it("fails for a duplicate id", () => {
    const files = fixtureFiles();
    const [first] = files;

    assert.isDefined(first);

    const model = modelOf([
      { ...first, elements: [...first.elements, ...first.elements] },
      ...Arr.drop(files, 1),
    ]);

    assert.include(codes(model), "ID-DUPLICATE");
  });

  it("fails when a scope lacks a sub-model", () => {
    const model = withChange("concept-foldkit-flow-c", () => {});

    assert.include(codes(model), "COVERAGE-SUBMODEL");
  });

  it("fails when a product has no product component", () => {
    const model = withChange("comp-studio-c", (element) => ({
      ...element,
      tier: "library",
    }));

    assert.include(codes(model), "PRODUCT-COMPONENT");
  });

  it("fails when a product states no quality goal", () => {
    const model = withChange("req-reebeat-q", () => {});

    assert.include(codes(model), "QUALITY-MISSING");
  });

  it("fails when the organisation has no tagline", () => {
    const model = withChange("goal-org-g", (element) =>
      without(element, "tagline")
    );

    assert.include(codes(model), "ORG-TAGLINE");
  });

  it("fails when a canvas block is empty", () => {
    const model = withChange("goal-org-g", (element) =>
      without(element, "canvas")
    );

    assert.include(codes(model), "CANVAS-EMPTY");
  });

  it("fails when a cited issue is missing from the tracker", () => {
    const model = withChange("goal-org-g", (element) => ({
      ...element,
      refs: ["issue:reebeat#7"],
    }));

    assert.include(codes(model), "TRACKER-MISSING");
  });
});
