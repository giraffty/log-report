import { describe, expect, it } from "vitest";
import {
  innerCallAt,
  lineAt,
  scriptAt,
} from "#lib/features/call-log/call-log.fixtures.ts";
import { logOf } from "./report.fixtures";
import { INITIAL_REPORT } from "./report.reducer";
import type { CallView, ReportState } from "./report.types";
import { reportViewOf } from "./report.view";

const INVALID = '{"errors":[{"message":"[GIRAFFTY.SCHEMA] no field x"}]}';
const HOUR = 60 * 60 * 1000;

const failedQuery = lineAt(1, { excerpt: INVALID });
const fixedQuery = lineAt(2, {
  input: { root: "document", payload: { title: true } },
});
const search = lineAt(1, {
  session: "s2",
  at: failedQuery.at + HOUR,
  tool: "search_schema",
  input: { query: "wall" },
  excerpt: "Wall (context)",
  mcpVersion: { kind: "NOT_RECORDED" },
  server: "TYPESCRIPT",
});

const log = logOf([failedQuery, fixedQuery, search]);

const shownCalls = (state: ReportState): readonly CallView[] => {
  const { shown } = reportViewOf(log, state);
  return shown.kind === "CONVERSATION" ? shown.conversation.calls : [];
};

describe("reportViewOf", () => {
  it("says when a log has no calls", () => {
    expect(reportViewOf(logOf([]), INITIAL_REPORT)).toEqual({
      summary: "No calls",
      problems: { kind: "NONE" },
      modes: [
        { mode: "ALL", label: "All", pressed: true, variant: "solid" },
        {
          mode: "FAILURES",
          label: "Failures",
          pressed: false,
          variant: "outline",
        },
        {
          mode: "FLAGGED",
          label: "Flagged",
          pressed: false,
          variant: "outline",
        },
      ],
      conversations: [],
      shown: { kind: "NOTHING", text: "No calls in this log." },
    });
  });

  it("lists the lines it could not read", () => {
    expect(
      reportViewOf(
        logOf([], [{ kind: "NotJson", lineNumber: 3 }]),
        INITIAL_REPORT,
      ).problems,
    ).toEqual({
      kind: "LINES",
      title: "1 line could not be read",
      lines: ["line 3: not JSON"],
    });
  });

  it("sums up the log and lists its conversations with their failures and flags", () => {
    const view = reportViewOf(log, INITIAL_REPORT);

    expect(view.summary).toBe(
      "2026-10-20 15:00:01 – 2026-10-20 16:00:01 UTC · 2 conversations · 3 calls · 1 failed · 1 flag",
    );
    expect(view.conversations).toEqual([
      {
        value: 1,
        title: "#1",
        meta: "15:00:01 · 2 calls",
        marks: [
          { text: "✗ 1", tone: "accent" },
          { text: "⚠ 1", tone: "neutral" },
        ],
        selected: true,
      },
      {
        value: 2,
        title: "#2",
        meta: "16:00:01 · 1 call",
        marks: [],
        selected: false,
      },
    ]);
  });

  it("shows the first conversation with its metrics and closed calls", () => {
    const { shown } = reportViewOf(log, INITIAL_REPORT);

    expect(shown).toEqual({
      kind: "CONVERSATION",
      conversation: {
        title: "#1 · 2026-10-20 15:00:01 – 15:00:02 UTC",
        metrics: [
          { label: "calls", value: "2" },
          { label: "queries", value: "2 (1 invalid, 0 partial)" },
          { label: "failed", value: "1" },
          { label: "flags", value: "1" },
          { label: "answers", value: "0.2 KB" },
          { label: "time", value: "1.0 s" },
          { label: "described before querying", value: "no" },
          { label: "MCP", value: "0.7.1" },
          { label: "client", value: "not recorded" },
        ],
        calls: [
          {
            key: "s1#1",
            id: { session: "s1", seq: 1 },
            time: "15:00:01",
            seq: "#1",
            tool: "query",
            outcome: { label: "invalid query", tone: "accent" },
            duration: "0.0 s",
            size: "0.1 KB",
            summary: "",
            flagMark: { kind: "text", text: "⚠ 1" },
            expanded: false,
            detail: { kind: "CLOSED" },
          },
          {
            key: "s1#2",
            id: { session: "s1", seq: 2 },
            time: "15:00:02",
            seq: "#2",
            tool: "query",
            outcome: { label: "ok", tone: "muted" },
            duration: "0.0 s",
            size: "0.1 KB",
            summary: "document: title",
            flagMark: { kind: "none" },
            expanded: false,
            detail: { kind: "CLOSED" },
          },
        ],
      },
    });
  });

  it("opens a call with its flags, what was sent and what came back", () => {
    const [failed] = shownCalls({
      ...INITIAL_REPORT,
      opened: [{ session: "s1", seq: 1 }],
    });

    expect(failed?.detail).toEqual({
      kind: "OPEN",
      flags: { kind: "FLAGS", texts: ["retryAfterFailure: fixed at #2"] },
      sentLabel: "Sent",
      sent: '{\n  "root": "document"\n}',
      sentCut: { kind: "none" },
      receivedLabel: "Received",
      received: JSON.stringify(JSON.parse(INVALID), null, 2),
      cut: { kind: "none" },
      script: { kind: "NONE" },
      meta: [
        { label: "session", value: "s1" },
        { label: "input hash", value: "hash00000001" },
        { label: "MCP", value: "0.7.1" },
        { label: "server", value: "Rust" },
        { label: "client", value: "not recorded" },
        { label: "time", value: "2026-10-20T15:00:01.000Z" },
      ],
    });
  });

  it("shows an error and a cut-off answer as they were logged", () => {
    const cut = lineAt(1, {
      isError: true,
      excerpt: '{"data":',
      truncated: true,
      responseBytes: 9000,
      mcpVersion: { kind: "NOT_RECORDED" },
      server: "TYPESCRIPT",
    });
    const { shown } = reportViewOf(logOf([cut]), {
      ...INITIAL_REPORT,
      opened: [{ session: "s1", seq: 1 }],
    });
    const [call] =
      shown.kind === "CONVERSATION" ? shown.conversation.calls : [];

    expect(call?.detail).toEqual({
      kind: "OPEN",
      flags: { kind: "NONE" },
      sentLabel: "Sent",
      sent: '{\n  "root": "document"\n}',
      sentCut: { kind: "none" },
      receivedLabel: "Received (error)",
      received: '{"data":',
      cut: {
        kind: "text",
        text: "Cut off: the log keeps the first 8 characters of 9000 bytes.",
      },
      script: { kind: "NONE" },
      meta: [
        { label: "session", value: "s1" },
        { label: "input hash", value: "hash00000001" },
        { label: "MCP", value: "not recorded" },
        { label: "server", value: "TypeScript" },
        { label: "client", value: "not recorded" },
        { label: "time", value: "2026-10-20T15:00:01.000Z" },
      ],
    });
  });

  it("shows the chosen conversation", () => {
    const view = reportViewOf(log, {
      ...INITIAL_REPORT,
      chosen: { kind: "CHOSEN", number: 2 },
    });

    const { shown } = view;

    expect(view.conversations.map((item) => item.selected)).toEqual([
      false,
      true,
    ]);
    expect(
      shown.kind === "CONVERSATION" ? shown.conversation.metrics.at(-2) : [],
    ).toEqual({
      label: "MCP",
      value: "not recorded",
    });
  });

  it("shows only failures, or only flagged calls, and the conversations that have them", () => {
    const failures = reportViewOf(log, { ...INITIAL_REPORT, mode: "FAILURES" });

    expect(failures.conversations.map((item) => item.value)).toEqual([1]);
    expect(
      shownCalls({ ...INITIAL_REPORT, mode: "FAILURES" }).map(
        (call) => call.seq,
      ),
    ).toEqual(["#1"]);
    expect(
      shownCalls({ ...INITIAL_REPORT, mode: "FLAGGED" }).map(
        (call) => call.seq,
      ),
    ).toEqual(["#1"]);
  });

  it("finds calls by the text of their input or answer, in any case", () => {
    expect(
      shownCalls({ ...INITIAL_REPORT, search: " TITLE " }).map(
        (call) => call.seq,
      ),
    ).toEqual(["#2"]);
  });

  it("falls back to the first conversation left when the filter hides the chosen one", () => {
    const view = reportViewOf(log, {
      ...INITIAL_REPORT,
      chosen: { kind: "CHOSEN", number: 1 },
      search: "wall",
    });

    expect(view.conversations).toEqual([
      {
        value: 2,
        title: "#2",
        meta: "16:00:01 · 1 call",
        marks: [],
        selected: true,
      },
    ]);
  });

  it("says when nothing matches the filter", () => {
    expect(
      reportViewOf(log, { ...INITIAL_REPORT, search: "zzzz" }).shown,
    ).toEqual({
      kind: "NOTHING",
      text: "No calls match the filter.",
    });
  });

  it("shows a script conversation with its scripts, client and queries inside", () => {
    const client = {
      kind: "RECORDED",
      name: "claude-ai",
      version: "1.2.3",
    } as const;
    const returned = scriptAt(
      1,
      {
        scriptHash: "whole",
        innerCalls: [
          innerCallAt(1),
          innerCallAt(2, { result: { kind: "FAILED", error: "no field x" } }),
        ],
        console: "checked",
      },
      { client },
    );
    const stopped = scriptAt(
      2,
      { limit: { kind: "STOPPED", name: "time" } },
      { client, isError: true, excerpt: "Limit: the script ran too long" },
    );
    const { shown } = reportViewOf(logOf([returned, stopped]), {
      ...INITIAL_REPORT,
      opened: [
        { session: "s1", seq: 1 },
        { session: "s1", seq: 2 },
      ],
    });
    const conversation =
      shown.kind === "CONVERSATION" ? shown.conversation : undefined;
    const [first, second] = conversation?.calls ?? [];

    expect(conversation?.metrics).toEqual([
      { label: "calls", value: "2" },
      { label: "queries", value: "0 (0 invalid, 0 partial)" },
      { label: "scripts", value: "2 (1 failed) · 2 queries inside (1 failed)" },
      { label: "failed", value: "1" },
      { label: "flags", value: "2" },
      { label: "answers", value: "0.2 KB" },
      { label: "time", value: "1.0 s" },
      { label: "described before querying", value: "no" },
      { label: "MCP", value: "0.7.1" },
      { label: "client", value: "claude-ai 1.2.3" },
    ]);
    expect([first?.summary, second?.summary]).toEqual([
      "script: 2 queries, 1 failed",
      "script: 0 queries",
    ]);
    expect(first?.detail).toEqual({
      kind: "OPEN",
      flags: {
        kind: "FLAGS",
        texts: ["innerQueryFailed: 1 failed inside and the script went on"],
      },
      sentLabel: "Script",
      sent: "return 1;",
      sentCut: {
        kind: "text",
        text: "Cut off: the log keeps the first 9 characters of the script.",
      },
      receivedLabel: "Received",
      received: "1",
      cut: { kind: "none" },
      script: {
        kind: "SCRIPT",
        console: { kind: "text", text: "checked" },
        innerCalls: {
          kind: "CALLS",
          title: "2 queries inside",
          rows: [
            {
              key: "1",
              label: "#1 · 0.0 s · 0.0 KB",
              value: "ok",
              tone: "muted",
            },
            {
              key: "2",
              label: "#2 · 0.0 s · 0.0 KB",
              value: "no field x",
              tone: "accent",
            },
          ],
        },
      },
      meta: [
        { label: "session", value: "s1" },
        { label: "input hash", value: "hash00000001" },
        { label: "script hash", value: "whole" },
        { label: "limit", value: "none" },
        { label: "MCP", value: "0.7.1" },
        { label: "server", value: "Rust" },
        { label: "client", value: "claude-ai 1.2.3" },
        { label: "time", value: "2026-10-20T15:00:01.000Z" },
      ],
    });
    expect(second?.detail).toEqual({
      kind: "OPEN",
      flags: {
        kind: "FLAGS",
        texts: ["retryAfterFailure: not fixed in this conversation"],
      },
      sentLabel: "Script",
      sent: "return 1;",
      sentCut: { kind: "none" },
      receivedLabel: "Received (error)",
      received: "Limit: the script ran too long",
      cut: { kind: "none" },
      script: {
        kind: "SCRIPT",
        console: { kind: "none" },
        innerCalls: { kind: "NONE" },
      },
      meta: [
        { label: "session", value: "s1" },
        { label: "input hash", value: "hash00000002" },
        { label: "script hash", value: "hash00000002" },
        { label: "limit", value: "time" },
        { label: "MCP", value: "0.7.1" },
        { label: "server", value: "Rust" },
        { label: "client", value: "claude-ai 1.2.3" },
        { label: "time", value: "2026-10-20T15:00:02.000Z" },
      ],
    });
  });
});
