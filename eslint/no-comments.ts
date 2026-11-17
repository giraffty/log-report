import type { AST, Rule } from "eslint";

type Located = { readonly loc?: AST.SourceLocation | null | undefined };

export const locationsOf = (
  nodes: readonly Located[],
): readonly AST.SourceLocation[] =>
  nodes.flatMap((node) => (node.loc ? [node.loc] : []));

const noComments: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: { description: "Disallow comments" },
    schema: [],
    messages: { comment: "Comments are not allowed." },
  },
  create(context) {
    const report = (nodes: readonly Located[]): void => {
      locationsOf(nodes).forEach((loc) => {
        context.report({ loc, messageId: "comment" });
      });
    };
    return {
      Program: (): void => {
        report(context.sourceCode.getAllComments());
      },
      SvelteHTMLComment: (node: Located): void => {
        report([node]);
      },
    };
  },
};

export default noComments;
