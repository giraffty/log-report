import type { AnalyzedLog } from "#lib/features/call-log/call-log.types.ts";
import type { ReadableFile } from "./log-file.types";

export const EMPTY_LOG: AnalyzedLog = { conversations: [], problems: [] };

export const fileOf = (name: string, text: Promise<string>): ReadableFile => ({
  name,
  text: () => text,
});
