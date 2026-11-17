import { match, P } from "ts-pattern";
import type { LogLine, Outcome } from "./call-log.types";

const INVALID_QUERY_CODES = [
  "[GIRAFFTY.AST]",
  "[GIRAFFTY.SCHEMA]",
  "[GIRAFFTY.RT.ARGS]",
  "[GIRAFFTY.RT.ARB]",
  "[GIRAFFTY.RT.OPS]",
];

const queryOutcome = (excerpt: string): Outcome =>
  excerpt.startsWith('{"errors":[]')
    ? "OK"
    : INVALID_QUERY_CODES.some((code) => excerpt.includes(code))
      ? "INVALID_QUERY"
      : "PARTIAL";

const searchOutcome = (excerpt: string): Outcome => {
  const results = excerpt.split("\n");
  const enumValues = results.filter((result) =>
    result.includes("(enum value)"),
  ).length;
  return excerpt.startsWith("No matches") || enumValues * 2 > results.length
    ? "WEAK_SEARCH"
    : "OK";
};

export const outcomeOf = (line: LogLine): Outcome =>
  match<LogLine, Outcome>(line)
    .with({ isError: true, tool: "describe_type" }, () => "NOT_FOUND")
    .with({ isError: true }, () => "UNAVAILABLE")
    .with({ tool: P.union("query", "mutate") }, (l) => queryOutcome(l.excerpt))
    .with({ tool: "search_schema" }, (l) => searchOutcome(l.excerpt))
    .otherwise(() => "OK");

export const isFailed = (outcome: Outcome): boolean =>
  match(outcome)
    .with("INVALID_QUERY", "UNAVAILABLE", "NOT_FOUND", () => true)
    .with("OK", "PARTIAL", "WEAK_SEARCH", () => false)
    .exhaustive();
