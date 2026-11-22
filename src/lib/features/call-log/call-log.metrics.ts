import { isFailed } from "./call-log.outcomes";
import type {
  AnalyzedCall,
  Calls,
  ConversationMetrics,
  DescribedBeforeQuerying,
  InnerCall,
  Outcome,
  ScriptMetrics,
} from "./call-log.types";

const isQuery = (call: AnalyzedCall): boolean => call.line.tool === "query";

const isQuerying = (call: AnalyzedCall): boolean =>
  isQuery(call) || call.line.tool === "run_script";

const describedBeforeQuerying = (calls: Calls): DescribedBeforeQuerying => {
  const firstQuery = calls.findIndex(isQuerying);
  return firstQuery === -1
    ? "NO_QUERY"
    : calls
          .slice(0, firstQuery)
          .some((call) => call.line.tool === "describe_type")
      ? "YES"
      : "NO";
};

type RunScript = {
  readonly outcome: Outcome;
  readonly innerCalls: readonly InnerCall[];
};

const runScriptsOf = (calls: Calls): readonly RunScript[] =>
  calls.flatMap((call) =>
    call.line.script.kind === "SCRIPT"
      ? [{ outcome: call.outcome, innerCalls: call.line.script.innerCalls }]
      : [],
  );

const scriptsOf = (calls: Calls): ScriptMetrics => {
  const scripts = runScriptsOf(calls);
  const inner = scripts.flatMap((script) => script.innerCalls);
  return scripts.length === 0
    ? { kind: "NONE" }
    : {
        kind: "SCRIPTS",
        scripts: scripts.length,
        failed: scripts.filter((script) => isFailed(script.outcome)).length,
        innerQueries: inner.length,
        failedInnerQueries: inner.filter(
          (call) => call.result.kind === "FAILED",
        ).length,
      };
};

export const metricsOf = (calls: Calls): ConversationMetrics => {
  const queries = calls.filter(isQuery);
  const times = calls.map((call) => call.line.at);
  return {
    calls: calls.length,
    queries: queries.length,
    invalidQueries: queries.filter((call) => call.outcome === "INVALID_QUERY")
      .length,
    partialQueries: queries.filter((call) => call.outcome === "PARTIAL").length,
    totalBytes: calls.reduce((sum, call) => sum + call.line.responseBytes, 0),
    durationMs: Math.max(...times) - Math.min(...times),
    describedBeforeQuerying: describedBeforeQuerying(calls),
    scripts: scriptsOf(calls),
  };
};
