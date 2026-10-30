// Source and reference strings. One grammar; the model stores strings, this module parses them.
//
//   log:43  log:43-45                       lines of the operator's decision log (sources/operator-decisions-2026-10.md)
//   <repo>:<path>:<line>[-<line>]           lines of a file of a product repository, at the commit pinned in sources.yaml
//   record:<repo>:<path>:<line>[-<line>]    the same, where the file records an operator decision ("Decided <date>")
//   absent:<repo>:<path>                    the file does not exist at the pinned commit
//   issue:<repo>#<n>[@<comment id>]         a GitHub issue (or one of its comments)
//   pr:<repo>#<n>[@<comment id>]            a GitHub pull request (or one of its comments)
//
// <repo> is `tsukuri`, `studio` or `foldkit-flow`.
import { Array as Arr, Option } from "effect";

import { repoKeys, repoSlugs } from "./vocabulary.ts";
import type { RepoKey } from "./vocabulary.ts";

interface Lines {
  readonly from: number;
  readonly to: number;
}

interface InRepo {
  readonly repo: RepoKey;
}

interface Located extends InRepo {
  readonly path: string;
}

interface Tracked extends InRepo {
  readonly number: number;
  readonly comment: Option.Option<string>;
}

export type Source =
  | (Lines & { readonly kind: "log" })
  | (Located & Lines & { readonly kind: "file" })
  | (Located & Lines & { readonly kind: "record" })
  | (Located & { readonly kind: "absent" })
  | (Tracked & { readonly kind: "issue" })
  | (Tracked & { readonly kind: "pr" });

const repoPattern = Arr.join(repoKeys, "|");

const logPattern = /^log:(?<from>\d+)(?:-(?<to>\d+))?$/u;
const absentPattern = new RegExp(`^absent:(${repoPattern}):(.+)$`, "u");

const trackerPattern = new RegExp(
  `^(issue|pr):(${repoPattern})#(\\d+)(?:@(\\d+))?$`,
  "u"
);

const filePattern = new RegExp(
  `^(record:)?(${repoPattern}):([^:#]+):(\\d+)(?:-(\\d+))?$`,
  "u"
);

const isRepoKey = (value: string): value is RepoKey => value in repoSlugs;

const lineRange = (
  from: string | undefined,
  to: string | undefined
): Option.Option<{ readonly from: number; readonly to: number }> => {
  const start = Number(from);
  const end = Number(to ?? from);

  return Number.isInteger(start) &&
    Number.isInteger(end) &&
    start >= 1 &&
    end >= start
    ? Option.some({ from: start, to: end })
    : Option.none();
};

/** Parses a source string; `None` when it does not match the grammar. */
export const parseSource = (text: string): Option.Option<Source> => {
  const log = logPattern.exec(text);

  if (log !== null) {
    return Option.map(lineRange(log.groups?.from, log.groups?.to), (range) => ({
      kind: "log" as const,
      ...range,
    }));
  }

  const absent = absentPattern.exec(text);

  if (absent !== null) {
    const [, repo, path] = absent;

    return repo !== undefined && path !== undefined && isRepoKey(repo)
      ? Option.some({ kind: "absent" as const, path, repo })
      : Option.none();
  }

  const tracker = trackerPattern.exec(text);

  if (tracker !== null) {
    const [, kind, repo, number, comment] = tracker;

    return repo !== undefined &&
      isRepoKey(repo) &&
      (kind === "issue" || kind === "pr")
      ? Option.some({
          comment: Option.fromNullishOr(comment),
          kind,
          number: Number(number),
          repo,
        })
      : Option.none();
  }

  const file = filePattern.exec(text);

  if (file !== null) {
    const [, record, repo, path, from, to] = file;

    return repo !== undefined && path !== undefined && isRepoKey(repo)
      ? Option.map(lineRange(from, to), (range) => ({
          kind: record === undefined ? ("file" as const) : ("record" as const),
          path,
          repo,
          ...range,
        }))
      : Option.none();
  }

  return Option.none();
};

/** A source is an operator decision when it is a line of the decision log or a file line that records one. */
export const isOperatorDecision = (source: Source): boolean =>
  source.kind === "log" || source.kind === "record";

/** A work item that tracks or delivers an element: an issue, a pull request or a spec file of a product repository. */
export type Ref =
  | Extract<Source, { kind: "issue" | "pr" }>
  | (Extract<Source, { kind: "file" }> & { readonly isSpec: true });

const specPattern = /^docs\/specs\/[^/]+\.md$/u;

export const parseRef = (text: string): Option.Option<Ref> =>
  Option.flatMap(parseSource(text), (source) => {
    if (source.kind === "issue" || source.kind === "pr") {
      return Option.some(source);
    }

    return source.kind === "file" && specPattern.test(source.path)
      ? Option.some({ ...source, isSpec: true as const })
      : Option.none();
  });

/** The canonical `kind:repo#n` key under which tracker.yaml stores an issue or pull request. */
export const trackerKey = (
  source: Extract<Source, { kind: "issue" | "pr" }>
): string => `${source.kind}:${source.repo}#${source.number}`;

/** Short, human label for tables. */
export const sourceLabel = (source: Source): string => {
  if (source.kind === "log") {
    return source.from === source.to
      ? `log L${source.from}`
      : `log L${source.from}-${source.to}`;
  }

  if (source.kind === "file" || source.kind === "record") {
    const lines =
      source.from === source.to
        ? `${source.from}`
        : `${source.from}-${source.to}`;

    return `${source.kind === "record" ? "record " : ""}${source.repo}:${source.path}:${lines}`;
  }

  if (source.kind === "absent") {
    return `absent ${source.repo}:${source.path}`;
  }

  return `${source.kind} ${source.repo}#${source.number}`;
};

/** A permalink to the cited evidence; `shas` pins file sources to a commit. */
export const sourceUrl = (
  source: Source,
  shas: Readonly<Record<RepoKey, string>>,
  logPath: string,
  relativeTo: string
): string => {
  if (source.kind === "log") {
    return `${relativeTo}${logPath}#L${source.from}`;
  }

  if (source.kind === "file" || source.kind === "record") {
    const slug = repoSlugs[source.repo];

    const anchor =
      source.from === source.to
        ? `L${source.from}`
        : `L${source.from}-L${source.to}`;

    return `https://github.com/${slug}/blob/${shas[source.repo]}/${source.path}#${anchor}`;
  }

  if (source.kind === "absent") {
    return `https://github.com/${repoSlugs[source.repo]}/tree/${shas[source.repo]}`;
  }

  const slug = repoSlugs[source.repo];
  const base = `https://github.com/${slug}/${source.kind === "pr" ? "pull" : "issues"}/${source.number}`;

  return Option.match(source.comment, {
    onNone: () => base,
    onSome: (id) => `${base}#issuecomment-${id}`,
  });
};
