import { RuleTester } from "eslint";
import svelteParser from "svelte-eslint-parser";
import { describe, expect, it } from "vitest";
import noComments, { locationsOf } from "./no-comments.ts";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const comment = { messageId: "comment" };

describe("locationsOf", () => {
  it("keeps the positions that exist and skips the missing ones", () => {
    const position = {
      start: { line: 1, column: 0 },
      end: { line: 1, column: 7 },
    };

    expect(locationsOf([{ loc: position }, { loc: null }, {}])).toEqual([
      position,
    ]);
  });
});

describe("no-comments", () => {
  new RuleTester().run("in TypeScript", noComments, {
    valid: ["const size = 1;", 'const text = "// not a comment";'],
    invalid: [
      { code: "// note\nconst size = 1;", errors: [comment] },
      { code: "/* note */ const size = 1;", errors: [comment] },
      { code: "/** Default: 1. */\nconst size = 1;", errors: [comment] },
      { code: "// one\n// two\nconst size = 1;", errors: [comment, comment] },
    ],
  });

  new RuleTester({
    languageOptions: { parser: svelteParser },
  }).run("in Svelte", noComments, {
    valid: ["<script>\n  const size = 1;\n</script>\n\n<p>{size}</p>"],
    invalid: [
      { code: "<!-- note -->\n<p>text</p>", errors: [comment] },
      {
        code: "<script>\n  // note\n  const size = 1;\n</script>\n\n<p>{size}</p>",
        errors: [comment],
      },
      { code: "<p>{/* note */ 1}</p>", errors: [comment] },
    ],
  });
});
