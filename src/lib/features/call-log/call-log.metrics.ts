import type {
  AnalyzedCall,
  Calls,
  ConversationMetrics,
  DescribedBeforeQuerying,
} from "./call-log.types";

const isQuery = (call: AnalyzedCall): boolean => call.line.tool === "query";

const describedBeforeQuerying = (calls: Calls): DescribedBeforeQuerying => {
  const firstQuery = calls.findIndex(isQuery);
  return firstQuery === -1
    ? "NO_QUERY"
    : calls
          .slice(0, firstQuery)
          .some((call) => call.line.tool === "describe_type")
      ? "YES"
      : "NO";
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
  };
};
