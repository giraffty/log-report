import { outcomeOf } from "./call-log.outcomes";
import type {
  AnalyzedCall,
  Calls,
  Conversation,
  LogLine,
} from "./call-log.types";

const CONVERSATION_GAP_MS = 2 * 60 * 1000;

type Lines = readonly [LogLine, ...LogLine[]];

type Group = {
  readonly lines: Lines;
  readonly lastAt: number;
};

const splitByGap = (lines: readonly LogLine[]): readonly Group[] =>
  lines.reduce<readonly Group[]>((groups, line) => {
    const last = groups.at(-1);
    return last !== undefined && line.at - last.lastAt <= CONVERSATION_GAP_MS
      ? [
          ...groups.slice(0, -1),
          { lines: [...last.lines, line], lastAt: line.at },
        ]
      : [...groups, { lines: [line], lastAt: line.at }];
  }, []);

const analyzedCall = (line: LogLine): AnalyzedCall => ({
  line,
  outcome: outcomeOf(line),
});

const analyzedCalls = ([first, ...rest]: Lines): Calls => [
  analyzedCall(first),
  ...rest.map(analyzedCall),
];

const bySeq = (a: LogLine, b: LogLine): number => a.seq - b.seq;

export const conversationsOf = (
  lines: readonly LogLine[],
): readonly Conversation[] =>
  [...new Set(lines.map((line) => line.session))]
    .flatMap((session) =>
      splitByGap(
        lines.filter((line) => line.session === session).toSorted(bySeq),
      ).map((group) => ({ session, lines: group.lines })),
    )
    .map((group, index) => ({
      number: index + 1,
      session: group.session,
      calls: analyzedCalls(group.lines),
    }));
