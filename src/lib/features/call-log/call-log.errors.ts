import { match } from "ts-pattern";

type LineIssue = {
  readonly key: string;
  readonly message: string;
};

export type LineProblem =
  | { readonly kind: "NotJson"; readonly lineNumber: number }
  | {
      readonly kind: "NotACall";
      readonly lineNumber: number;
      readonly issues: readonly LineIssue[];
    };

const formatIssue = (issue: LineIssue): string =>
  issue.key === "" ? issue.message : `${issue.key}: ${issue.message}`;

export const formatLineProblem = (problem: LineProblem): string =>
  match(problem)
    .with({ kind: "NotJson" }, (p) => `line ${p.lineNumber}: not JSON`)
    .with(
      { kind: "NotACall" },
      (p) => `line ${p.lineNumber}: ${p.issues.map(formatIssue).join("; ")}`,
    )
    .exhaustive();
