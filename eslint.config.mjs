import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The reference spike is a separate app with its own config — not ours to lint.
    "spikes/**",
    // Node hook scripts for Claude Code (CommonJS by necessity), not app code.
    ".claude/hooks/**",
  ]),
]);

export default eslintConfig;
