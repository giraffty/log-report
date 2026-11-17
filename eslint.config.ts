import js from "@eslint/js";
import noComments from "./eslint/no-comments.ts";
import { defineConfig } from "eslint/config";
import svelte from "eslint-plugin-svelte";
import globals from "globals";
import ts from "typescript-eslint";

export default defineConfig(
  {
    ignores: [".svelte-kit/", "dist/", "build/", "coverage/", "node_modules/"],
  },

  {
    linterOptions: {
      noInlineConfig: true,
      reportUnusedDisableDirectives: "error",
      reportUnusedInlineConfigs: "error",
    },
  },

  js.configs.recommended,
  ts.configs.strictTypeChecked,
  ts.configs.stylisticTypeChecked,
  svelte.configs.recommended,

  {
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            "*.config.ts",
            "knip.ts",
            "eslint/*.ts",
            "stylelint/*.ts",
          ],
          defaultProject: "tsconfig.tools.json",
        },
        extraFileExtensions: [".svelte"],
      },
    },
  },

  {
    files: ["**/*.svelte", "**/*.svelte.ts"],
    languageOptions: {
      parserOptions: {
        parser: ts.parser,
      },
    },
  },

  {
    rules: {
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-check": true,
          "ts-expect-error": true,
          "ts-ignore": true,
          "ts-nocheck": true,
        },
      ],
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/consistent-type-exports": "error",
      "@typescript-eslint/explicit-module-boundary-types": "error",
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          allowAny: false,
          allowArray: false,
          allowBoolean: false,
          allowNever: false,
          allowNullish: false,
          allowNumber: true,
          allowRegExp: false,
        },
      ],

      "svelte/block-lang": ["error", { script: "ts" }],
      "svelte/button-has-type": "error",
      "svelte/no-at-html-tags": "error",
      "svelte/no-inline-styles": "error",
      "svelte/no-unused-class-name": "error",
      "svelte/no-unused-props": "error",
      "svelte/require-each-key": "error",
      "svelte/require-event-prefix": "error",
      "svelte/valid-compile": "error",
    },
  },
  {
    plugins: { local: { rules: { "no-comments": noComments } } },
    rules: { "local/no-comments": "error" },
  },
  {
    files: ["src/**/*.ts", "src/**/*.svelte"],
    rules: {
      "no-restricted-globals": [
        "error",
        ...["fetch", "XMLHttpRequest", "WebSocket", "EventSource"].map(
          (name) => ({
            name,
            message: "The page never sends the log anywhere.",
          }),
        ),
      ],
      "no-restricted-properties": [
        "error",
        {
          object: "navigator",
          property: "sendBeacon",
          message: "The page never sends the log anywhere.",
        },
      ],
    },
  },
  {
    files: ["src/lib/**/*.svelte"],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...[
          "ArrowFunctionExpression",
          "FunctionExpression",
          "FunctionDeclaration",
          "ConditionalExpression",
          "LogicalExpression",
          "UnaryExpression",
          "BinaryExpression:not(SvelteIfBlock > BinaryExpression.expression[operator='==='][right.type='Literal'])",
          "TemplateLiteral[expressions.length>0]",
          "IfStatement",
          "SwitchStatement",
          "ForStatement",
          "ForInStatement",
          "ForOfStatement",
          "WhileStatement",
          "DoWhileStatement",
          "TryStatement",
          "AssignmentExpression",
          "UpdateExpression",
          "NewExpression",
          "CallExpression[callee.name='$effect']",
          "CallExpression[callee.object.name='$effect']",
          "CallExpression[callee.name='$state']",
          "CallExpression[callee.object.name='$state']",
          "CallExpression[callee.object.name='$derived'][callee.property.name='by']",
          "SvelteConstTag",
        ].map((selector) => ({
          selector,
          message:
            "Components have no logic: move this into a tested .ts or .svelte.ts file.",
        })),
      ],
    },
  },
);
