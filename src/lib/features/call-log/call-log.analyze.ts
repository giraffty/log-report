import { conversationsOf } from "./call-log.conversations";
import { flagsOf } from "./call-log.flags";
import { metricsOf } from "./call-log.metrics";
import { readLog } from "./call-log.read";
import type { AnalyzedLog } from "./call-log.types";

export const analyzeLog = (content: string): AnalyzedLog => {
  const log = readLog(content);
  return {
    conversations: conversationsOf(log.lines).map((conversation) => ({
      conversation,
      flags: flagsOf(conversation.calls),
      metrics: metricsOf(conversation.calls),
    })),
    problems: log.problems,
  };
};
