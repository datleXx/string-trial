import { FlatCompat } from "@eslint/eslintrc";
import tseslint from "typescript-eslint";
// @ts-ignore -- no types for this plugin
import drizzle from "eslint-plugin-drizzle";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

export default tseslint.config(
  {
    ignores: [".next"],
  },
  ...compat.extends("next/core-web-vitals"),
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      drizzle,
    },
    extends: [
      ...tseslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    rules: {
      "react/no-unescaped-entities": 0,
    "@next/next/no-img-element": "off",
    "@next/next/inline-script-id": "off",
    "jsx-a11y/alt-text": [0],
    "import/no-unused-modules": "off",
    "no-unused-vars": "off",
    "import/no-unresolved": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "import/no-anonymous-default-export": [
      "error",
      {
        "allowArray": true,
        "allowArrowFunction": true,
        "allowAnonymousClass": true,
        "allowAnonymousFunction": true,
        "allowCallExpression": true, // The true value here is for backward compatibility
        "allowNew": true,
        "allowLiteral": true,
        "allowObject": true
      }
    ],
    "@typescript-eslint/no-implicit-any": "off",
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/exhaustive-deps": "off",
      "react/jsx-key": "off",
      "react/display-name": "off",
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      "drizzle/enforce-delete-with-where": [
        "error",
        { drizzleObjectName: ["db", "ctx.db"] },
      ],
      "drizzle/enforce-update-with-where": [
        "error",
        { drizzleObjectName: ["db", "ctx.db"] },
      ],
    },
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
);
