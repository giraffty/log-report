import type { OptionalText } from "@giraffty/ui";
import { isFailed } from "#lib/features/call-log/call-log.outcomes.ts";
import type {
  AnalyzedCall,
  AnalyzedLog,
  Flag,
} from "#lib/features/call-log/call-log.types.ts";
import { formatLineProblem } from "#lib/features/call-log/call-log.errors.ts";
import type {
  SelectItem,
  SelectMark,
} from "#lib/shared/ui/select-list/select-list.types.ts";
import { sameCall } from "./report.domain";
import {
  countOf,
  dateTimeOf,
  describedLabel,
  formatFlag,
  kilobytes,
  outcomeLabel,
  outcomeTone,
  prettyOf,
  seconds,
  summaryOf,
  timeOf,
} from "./report.format";
import type {
  CallDetail,
  CallView,
  ConversationView,
  FilterMode,
  ModeOption,
  ProblemsView,
  ReportState,
  ReportView,
  Row,
  ShownView,
} from "./report.types";

type ConversationReport = AnalyzedLog["conversations"][number];

type Visible = {
  readonly report: ConversationReport;
  readonly calls: readonly AnalyzedCall[];
};

const MODES: readonly { readonly mode: FilterMode; readonly label: string }[] =
  [
    { mode: "ALL", label: "All" },
    { mode: "FAILURES", label: "Failures" },
    { mode: "FLAGGED", label: "Flagged" },
  ];

const flagsAt = (flags: readonly Flag[], call: AnalyzedCall): readonly Flag[] =>
  flags.filter((flag) => flag.seq === call.line.seq);

const searchTextOf = (call: AnalyzedCall): string =>
  [
    call.line.tool,
    outcomeLabel(call.outcome),
    summaryOf(call.line.input),
    JSON.stringify(call.line.input),
    call.line.excerpt,
  ]
    .join("\n")
    .toLowerCase();

const isShown = (
  call: AnalyzedCall,
  flags: readonly Flag[],
  state: ReportState,
): boolean => {
  const search = state.search.trim().toLowerCase();
  const inMode =
    state.mode === "ALL" ||
    (state.mode === "FAILURES"
      ? isFailed(call.outcome)
      : flagsAt(flags, call).length > 0);
  return inMode && (search === "" || searchTextOf(call).includes(search));
};

const failedOf = (calls: readonly AnalyzedCall[]): number =>
  calls.filter((call) => isFailed(call.outcome)).length;

const marksOf = (report: ConversationReport): readonly SelectMark[] => {
  const failed = failedOf(report.conversation.calls);
  return [
    ...(failed > 0 ? [{ text: `✗ ${failed}`, tone: "accent" as const }] : []),
    ...(report.flags.length > 0
      ? [{ text: `⚠ ${report.flags.length}`, tone: "neutral" as const }]
      : []),
  ];
};

type Shown =
  | { readonly kind: "ONE"; readonly visible: Visible }
  | { readonly kind: "NONE" };

const itemOf = (visible: Visible, shown: number): SelectItem<number> => {
  const { conversation } = visible.report;
  return {
    value: conversation.number,
    title: `#${conversation.number}`,
    meta: `${timeOf(conversation.calls[0].line.at)} · ${countOf(conversation.calls.length, "call")}`,
    marks: marksOf(visible.report),
    selected: conversation.number === shown,
  };
};

const versionsOf = (report: ConversationReport): string => {
  const versions = [
    ...new Set(
      report.conversation.calls.flatMap((call) =>
        call.line.mcpVersion.kind === "RECORDED"
          ? [call.line.mcpVersion.version]
          : [],
      ),
    ),
  ];
  return versions.length === 0 ? "not recorded" : versions.join(", ");
};

const metricsOf = (report: ConversationReport): readonly Row[] => {
  const { metrics } = report;
  return [
    { label: "calls", value: `${metrics.calls}` },
    {
      label: "queries",
      value: `${metrics.queries} (${metrics.invalidQueries} invalid, ${metrics.partialQueries} partial)`,
    },
    { label: "failed", value: `${failedOf(report.conversation.calls)}` },
    { label: "flags", value: `${report.flags.length}` },
    { label: "answers", value: kilobytes(metrics.totalBytes) },
    { label: "time", value: seconds(metrics.durationMs) },
    {
      label: "described before querying",
      value: describedLabel(metrics.describedBeforeQuerying),
    },
    { label: "MCP", value: versionsOf(report) },
  ];
};

const cutOf = (call: AnalyzedCall): OptionalText =>
  call.line.truncated
    ? {
        kind: "text",
        text: `Cut off: the log keeps the first ${call.line.excerpt.length} characters of ${countOf(call.line.responseBytes, "byte")}.`,
      }
    : { kind: "none" };

const detailOf = (call: AnalyzedCall, flags: readonly Flag[]): CallDetail => ({
  kind: "OPEN",
  flags:
    flags.length === 0
      ? { kind: "NONE" }
      : { kind: "FLAGS", texts: flags.map(formatFlag) },
  sent: JSON.stringify(call.line.input, null, 2),
  receivedLabel: call.line.isError ? "Received (error)" : "Received",
  received: call.line.truncated
    ? call.line.excerpt
    : prettyOf(call.line.excerpt),
  cut: cutOf(call),
  meta: [
    { label: "session", value: call.line.session },
    { label: "input hash", value: call.line.inputHash },
    {
      label: "MCP",
      value:
        call.line.mcpVersion.kind === "RECORDED"
          ? call.line.mcpVersion.version
          : "not recorded",
    },
    {
      label: "server",
      value: call.line.server === "RUST" ? "Rust" : "TypeScript",
    },
    { label: "time", value: new Date(call.line.at).toISOString() },
  ],
});

const callViewOf = (
  call: AnalyzedCall,
  allFlags: readonly Flag[],
  state: ReportState,
): CallView => {
  const id = { session: call.line.session, seq: call.line.seq };
  const flags = flagsAt(allFlags, call);
  const expanded = state.opened.some((opened) => sameCall(opened, id));
  return {
    key: `${id.session}#${id.seq}`,
    id,
    time: timeOf(call.line.at),
    seq: `#${call.line.seq}`,
    tool: call.line.tool,
    outcome: {
      label: outcomeLabel(call.outcome),
      tone: outcomeTone(call.outcome),
    },
    duration: seconds(call.line.durationMs),
    size: kilobytes(call.line.responseBytes),
    summary: summaryOf(call.line.input),
    flagMark:
      flags.length > 0
        ? { kind: "text", text: `⚠ ${flags.length}` }
        : { kind: "none" },
    expanded,
    detail: expanded ? detailOf(call, flags) : { kind: "CLOSED" },
  };
};

const conversationViewOf = (
  visible: Visible,
  state: ReportState,
): ConversationView => {
  const { conversation, flags } = visible.report;
  const first = conversation.calls[0].line.at;
  const last = Math.max(...conversation.calls.map((call) => call.line.at));
  return {
    title: `#${conversation.number} · ${dateTimeOf(first)} – ${timeOf(last)} UTC`,
    metrics: metricsOf(visible.report),
    calls: visible.calls.map((call) => callViewOf(call, flags, state)),
  };
};

const shownOf = (visible: readonly Visible[], state: ReportState): Shown => {
  const { chosen } = state;
  const one =
    (chosen.kind === "CHOSEN"
      ? visible.find(
          (candidate) => candidate.report.conversation.number === chosen.number,
        )
      : undefined) ?? visible.at(0);
  return one === undefined ? { kind: "NONE" } : { kind: "ONE", visible: one };
};

const shownViewOf = (
  shown: Shown,
  log: AnalyzedLog,
  state: ReportState,
): ShownView =>
  shown.kind === "ONE"
    ? {
        kind: "CONVERSATION",
        conversation: conversationViewOf(shown.visible, state),
      }
    : {
        kind: "NOTHING",
        text:
          log.conversations.length === 0
            ? "No calls in this log."
            : "No calls match the filter.",
      };

const summaryLineOf = (log: AnalyzedLog): string => {
  const calls = log.conversations.flatMap(
    (report) => report.conversation.calls,
  );
  const times = calls.map((call) => call.line.at);
  const flags = log.conversations.reduce(
    (sum, report) => sum + report.flags.length,
    0,
  );
  return calls.length === 0
    ? "No calls"
    : [
        `${dateTimeOf(Math.min(...times))} – ${dateTimeOf(Math.max(...times))} UTC`,
        countOf(log.conversations.length, "conversation"),
        countOf(calls.length, "call"),
        `${failedOf(calls)} failed`,
        countOf(flags, "flag"),
      ].join(" · ");
};

const problemsOf = (log: AnalyzedLog): ProblemsView =>
  log.problems.length === 0
    ? { kind: "NONE" }
    : {
        kind: "LINES",
        title: `${countOf(log.problems.length, "line")} could not be read`,
        lines: log.problems.map(formatLineProblem),
      };

const modesOf = (state: ReportState): readonly ModeOption[] =>
  MODES.map((option) => ({
    ...option,
    pressed: option.mode === state.mode,
    variant: option.mode === state.mode ? "solid" : "outline",
  }));

export const reportViewOf = (
  log: AnalyzedLog,
  state: ReportState,
): ReportView => {
  const visible = log.conversations
    .map((report) => ({
      report,
      calls: report.conversation.calls.filter((call) =>
        isShown(call, report.flags, state),
      ),
    }))
    .filter((one) => one.calls.length > 0);
  const shown = shownOf(visible, state);
  return {
    summary: summaryLineOf(log),
    problems: problemsOf(log),
    modes: modesOf(state),
    conversations:
      shown.kind === "ONE"
        ? visible.map((one) =>
            itemOf(one, shown.visible.report.conversation.number),
          )
        : [],
    shown: shownViewOf(shown, log, state),
  };
};
