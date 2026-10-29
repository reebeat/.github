// A throwaway git repository with one commit, for the tests of the source verifier. The commit identity is passed per
// command and never configured. The directory is removed with the scope of the test.
import { Effect, FileSystem, Path, Record as Rec, String as Str } from "effect";
import { ChildProcess, ChildProcessSpawner } from "effect/process";

export const makeGitRepo = (
  name: string,
  files: Readonly<Record<string, string>>
) =>
  Effect.gen(function* repoBuilder() {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
    const base = yield* fs.makeTempDirectoryScoped();
    const dir = path.join(base, name);

    yield* fs.makeDirectory(dir);

    const git = (...args: readonly string[]) =>
      spawner.string(
        ChildProcess.make("git", [
          "-C",
          dir,
          "-c",
          "user.name=fixture",
          "-c",
          "user.email=fixture@example.invalid",
          ...args,
        ])
      );

    yield* git("init", "-q");
    yield* Effect.forEach(Rec.toEntries(files), ([file, text]) =>
      fs.writeFileString(path.join(dir, file), text)
    );
    yield* git("add", "-A");
    yield* git("commit", "-q", "-m", "fixture");

    return { base, dir, sha: Str.trim(yield* git("rev-parse", "HEAD")) };
  });
