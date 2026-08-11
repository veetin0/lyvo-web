import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const config = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    ignores: [
      "node_modules/**",
      "**/node_modules/**",
      ".next/**",
      "**/.next/**",
      "out/**",
      "build/**",
      // Agent worktrees hold full project copies; linting them buries real findings.
      ".claude/**",
      "next-env.d.ts",
      "**/*.css",
    ],
  },
];

export default config;
