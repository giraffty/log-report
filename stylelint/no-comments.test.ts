import stylelint from "stylelint";
import { describe, expect, it } from "vitest";
import noComments from "./no-comments.ts";

const lint = async (
  code: string,
  customSyntax: string | undefined,
): Promise<readonly string[]> => {
  const { results } = await stylelint.lint({
    code,
    ...(customSyntax === undefined ? {} : { customSyntax }),
    config: {
      plugins: [noComments],
      rules: { "local/no-comments": true },
    },
  });
  return results.flatMap((result) =>
    result.warnings.map((warning) => warning.text),
  );
};

const ERROR = "Comments are not allowed. (local/no-comments)";

describe("local/no-comments", () => {
  it("allows CSS without comments, even text that looks like one", async () => {
    expect(
      await lint('.a {\n  content: "/* text */";\n}\n', undefined),
    ).toEqual([]);
  });

  it("reports every comment in a CSS file", async () => {
    expect(
      await lint("/* one */\n.a {\n  /* two */\n  color: red;\n}\n", undefined),
    ).toEqual([ERROR, ERROR]);
  });

  it("reports a comment in a Svelte <style> block", async () => {
    expect(
      await lint(
        "<p>text</p>\n<style>\n  /* note */\n  p {\n    margin: 0;\n  }\n</style>\n",
        "postcss-html",
      ),
    ).toEqual([ERROR]);
  });
});
