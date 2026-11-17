import type { Config } from "stylelint";
import noComments from "./stylelint/no-comments.ts";

const config: Config = {
  ignoreDisables: true,
  extends: [
    "stylelint-config-standard",
    "stylelint-config-html/svelte",
    "stylelint-config-recess-order",
  ],
  plugins: ["stylelint-declaration-strict-value", noComments],
  rules: {
    "local/no-comments": true,
    "scale-unlimited/declaration-strict-value": [
      [
        "/color$/",
        "fill",
        "stroke",
        "/^background/",
        "/^border/",
        "/^outline/",
        "/^margin/",
        "/^padding/",
        "/gap$/",
        "/^inset/",
        "top",
        "right",
        "bottom",
        "left",
        "/width$/",
        "/height$/",
        "/^font/",
        "line-height",
        "letter-spacing",
        "z-index",
        "box-shadow",
        "opacity",
        "/^transition-(duration|timing-function|delay)$/",
        "/^animation-(duration|timing-function|delay)$/",
      ],
      {
        ignoreValues: [
          "0",
          "none",
          "auto",
          "inherit",
          "initial",
          "unset",
          "currentcolor",
          "transparent",
          "100%",
          "normal",
          "solid",
          "dotted",
        ],
        disableFix: true,
      },
    ],

    "color-no-hex": true,
    "color-named": "never",
    "function-disallowed-list": [
      "rgb",
      "rgba",
      "hsl",
      "hsla",
      "hwb",
      "lab",
      "lch",
      "oklab",
      "oklch",
    ],

    "import-notation": "string",
    "property-disallowed-list": ["transition", "animation"],
    "declaration-no-important": true,
    "selector-max-id": 0,
    "selector-pseudo-class-disallowed-list": ["global"],
  },
};

export default config;
