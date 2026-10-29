// Provenance: adapted from reebeat/studio @ d4fd75e (vite.config.ts), which adapted it from reebeat/reebeat @ f7c348877585f54b6bf00651608726dd7e5044d3.
// Deviations: no Foldkit plugin, no vendored anti-slop Effect rules, no exception-registry diagnostics (this repository has no
// suppressions and no registry); the Effect roles are this repository's (tools/intent). See PROVENANCE.md.
import { effectNative, strict } from "@effect/tsgo/oxlint-presets";
import { effect } from "@phibkro/oxlint-effect-plugin";
import type { EffectConfigInput } from "@phibkro/oxlint-effect-plugin";
import ultraciteFmt from "ultracite/oxfmt";
import antiSlop from "ultracite/oxlint/anti-slop";
import core from "ultracite/oxlint/core";
import { defineConfig } from "vite-plus";

const effectConfig: EffectConfigInput = {
  groups: [
    {
      files: ["**/*.test.ts"],
      platform: "node",
      role: "test",
      strictness: "strict",
    },
    {
      files: ["tools/intent/src/**"],
      platform: "node",
      role: "composition-root",
      strictness: "strict",
    },
  ],
};

const effectConfigResult = effect(effectConfig);

export default defineConfig({
  // Prose is written by hand or generated: Oxfmt re-wraps Markdown and joins hard line breaks, which changes meaning
  // and would make the drift test compare formatted text with unformatted text.
  fmt: {
    ...ultraciteFmt,
    ignorePatterns: [
      ...(ultraciteFmt.ignorePatterns ?? []),
      "**/*.md",
      "model/**",
    ],
  },
  lint: {
    extends: [core, antiSlop, strict, effectNative],
    ignorePatterns: [...(core.ignorePatterns ?? [])],
    jsPlugins: [
      { name: "vite-plus", specifier: "vite-plus/oxlint-plugin" },
      ...effectConfigResult.jsPlugins,
      { name: "complexity", specifier: "oxlint-plugin-complexity" },
    ],
    options: { typeAware: true, typeCheck: true },
    overrides: [...effectConfigResult.overrides],
    rules: {
      ...effectConfigResult.rules,
      "complexity/complexity": ["error", { cognitive: 15 }],
      "unicorn/filename-case": ["error", { case: "camelCase" }],
      // Preset contradiction: effecttsgo(prefer-effect-array) requires Effect's data-first Array module
      // (`Arr.map(xs, fn)`), which unicorn/no-array-method-this-argument misreads as a native `.map(fn, thisArg)` call.
      "unicorn/no-array-method-this-argument": "off",
      "vite-plus/prefer-vite-plus-imports": "error",
    },
  },
  run: { cache: true },
  staged: { "*": "vp check --fix" },
});
