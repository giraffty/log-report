import stylelint, { type Rule } from "stylelint";

const ruleName = "local/no-comments";

const messages = stylelint.utils.ruleMessages(ruleName, {
  comment: "Comments are not allowed.",
});

const rule: Rule = () => (root, result) => {
  root.walkComments((node) => {
    stylelint.utils.report({
      ruleName,
      result,
      node,
      message: messages.comment,
    });
  });
};

rule.ruleName = ruleName;
rule.messages = messages;

export default stylelint.createPlugin(ruleName, rule);
