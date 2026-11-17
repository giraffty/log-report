import adapter from "@sveltejs/adapter-static";
import { sveltekit } from "@sveltejs/kit/vite";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const full = { lines: 100, branches: 100, functions: 100, statements: 100 };

export default defineConfig({
  plugins: [
    sveltekit({
      adapter: adapter(),
      paths: { base: "/log-report" },
      compilerOptions: {
        runes: ({ filename }) =>
          filename.split(/[/\\]/).includes("node_modules") ? undefined : true,
      },
    }),
  ],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "browser",
          include: ["src/**/*.test.ts"],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: "chromium" }],
          },
        },
      },
      {
        test: {
          name: "tools",
          include: ["eslint/**/*.test.ts", "stylelint/**/*.test.ts"],
          environment: "node",
        },
      },
    ],
    coverage: {
      provider: "v8",
      include: ["src/lib/**/*.ts", "eslint/**/*.ts", "stylelint/**/*.ts"],
      exclude: ["**/*.test.ts", "src/lib/**/*.store.svelte.ts"],
      thresholds: {
        "src/lib/**/*.ts": full,
        "eslint/**/*.ts": full,
        "stylelint/**/*.ts": full,
      },
    },
  },
});
