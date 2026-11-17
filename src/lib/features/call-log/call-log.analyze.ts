import { conversationsOf } from "./call-log.conversations";
import { flagsOf } from "./call-log.flags";
import { metricsOf } from "./call-log.metrics";
import { readLog } from "./call-log.read";
import type { AnalyzedLog, ReadLog } from "./call-log.types";

export const analysisOf = (log: ReadLog): AnalyzedLog => ({
  conversations: conversationsOf(log.lines).map((conversation) => ({
    conversation,
    flags: flagsOf(conversation.calls),
    metrics: metricsOf(conversation.calls),
  })),
  problems: log.problems,
});

export const analyzeLog = (content: string): AnalyzedLog =>
  analysisOf(readLog(content));
