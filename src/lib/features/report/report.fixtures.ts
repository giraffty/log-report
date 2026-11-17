import { analysisOf } from "#lib/features/call-log/call-log.analyze.ts";
import type { LineProblem } from "#lib/features/call-log/call-log.errors.ts";
import type {
  AnalyzedLog,
  LogLine,
} from "#lib/features/call-log/call-log.types.ts";

export const logOf = (
  lines: readonly LogLine[],
  problems: readonly LineProblem[] = [],
): AnalyzedLog => analysisOf({ lines, problems });
