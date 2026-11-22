import type { LineProblem } from "./call-log.errors";

type Json =
  | null
  | boolean
  | number
  | string
  | readonly Json[]
  | { readonly [key: string]: Json };

type McpVersion =
  | { readonly kind: "RECORDED"; readonly version: string }
  | { readonly kind: "NOT_RECORDED" };

type Server = "RUST" | "TYPESCRIPT";

type Client =
  | {
      readonly kind: "RECORDED";
      readonly name: string;
      readonly version: string;
    }
  | { readonly kind: "NOT_RECORDED" };

type InnerResult =
  | { readonly kind: "ANSWERED" }
  | { readonly kind: "FAILED"; readonly error: string };

export type InnerCall = {
  readonly seq: number;
  readonly inputHash: string;
  readonly durationMs: number;
  readonly responseBytes: number;
  readonly result: InnerResult;
};

type ScriptLimit =
  | { readonly kind: "NONE" }
  | { readonly kind: "STOPPED"; readonly name: string };

export type Script =
  | { readonly kind: "NONE" }
  | {
      readonly kind: "SCRIPT";
      readonly code: string;
      readonly scriptHash: string;
      readonly innerCalls: readonly InnerCall[];
      readonly limit: ScriptLimit;
      readonly console: string;
    };

export type LogLine = {
  readonly at: number;
  readonly session: string;
  readonly seq: number;
  readonly mcpVersion: McpVersion;
  readonly server: Server;
  readonly tool: string;
  readonly input: Json;
  readonly inputHash: string;
  readonly isError: boolean;
  readonly durationMs: number;
  readonly responseBytes: number;
  readonly excerpt: string;
  readonly truncated: boolean;
  readonly client: Client;
  readonly script: Script;
};

export type ReadLog = {
  readonly lines: readonly LogLine[];
  readonly problems: readonly LineProblem[];
};

export type Outcome =
  | "OK"
  | "PARTIAL"
  | "INVALID_QUERY"
  | "UNAVAILABLE"
  | "NOT_FOUND"
  | "WEAK_SEARCH"
  | "SCRIPT_ERROR"
  | "QUERY_ERROR"
  | "LIMIT"
  | "CANCELLED";

export type AnalyzedCall = {
  readonly line: LogLine;
  readonly outcome: Outcome;
};

export type Calls = readonly [AnalyzedCall, ...AnalyzedCall[]];

export type Conversation = {
  readonly number: number;
  readonly session: string;
  readonly calls: Calls;
};

export type Fix =
  | { readonly kind: "FIXED_AT"; readonly seq: number }
  | { readonly kind: "NOT_FIXED" };

export type Flag =
  | {
      readonly kind: "RETRY_AFTER_FAILURE";
      readonly seq: number;
      readonly fix: Fix;
    }
  | {
      readonly kind: "REPEATED_CALL";
      readonly seq: number;
      readonly sameAs: number;
    }
  | {
      readonly kind: "LARGE_RESPONSE";
      readonly seq: number;
      readonly bytes: number;
    }
  | {
      readonly kind: "SLOW_CALL";
      readonly seq: number;
      readonly durationMs: number;
    }
  | { readonly kind: "SEARCH_LOOP"; readonly seq: number }
  | { readonly kind: "NULL_WITHOUT_ERROR"; readonly seq: number }
  | {
      readonly kind: "INNER_QUERY_FAILED";
      readonly seq: number;
      readonly failed: number;
    };

export type DescribedBeforeQuerying = "YES" | "NO" | "NO_QUERY";

export type ScriptMetrics =
  | { readonly kind: "NONE" }
  | {
      readonly kind: "SCRIPTS";
      readonly scripts: number;
      readonly failed: number;
      readonly innerQueries: number;
      readonly failedInnerQueries: number;
    };

export type ConversationMetrics = {
  readonly calls: number;
  readonly queries: number;
  readonly invalidQueries: number;
  readonly partialQueries: number;
  readonly totalBytes: number;
  readonly durationMs: number;
  readonly describedBeforeQuerying: DescribedBeforeQuerying;
  readonly scripts: ScriptMetrics;
};

type ConversationReport = {
  readonly conversation: Conversation;
  readonly flags: readonly Flag[];
  readonly metrics: ConversationMetrics;
};

export type AnalyzedLog = {
  readonly conversations: readonly ConversationReport[];
  readonly problems: readonly LineProblem[];
};
