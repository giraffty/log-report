# Conventions

How code in log-report is organized and written, and why. Most of it comes from giraffty-sheets;
the differences are what a static page that reads one file needs.

## What the page may do

The page reads a call log that a pilot user sent: project data. It reads the file in the browser
and keeps what it read in memory, nothing more:

- No network: `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource` and `navigator.sendBeacon` are
  lint errors in `src/`.
- No storage: nothing of the log goes to `localStorage`, `IndexedDB` or a cookie. A reload starts
  empty.

The log's format is [`docs/CALL_LOG.md`](https://github.com/giraffty/mcp/blob/master/docs/CALL_LOG.md)
in the MCP repository. It only grows, so reading accepts keys it does not know.

## Layout

```
src/
  routes/              the one page: wiring only
  lib/features/        one folder per feature
    log-file/          choosing and reading the file
    call-log/          the log's lines, outcomes, conversations, flags, metrics
    report/            what is shown: selection, filters, opened calls
eslint/, stylelint/    the repository's own lint rules, with tests
```

Each feature owns everything it needs. There is no `shared` folder:

- Generic UI goes to `@giraffty/ui`, where it is documented and tested on its own. A missing
  component is added there, not built in a feature.
- Code used by one feature lives in that feature. When a second feature needs it, it moves to the
  feature it belongs to, and the other imports it from there.

Imports go through `#lib/…` (`#lib/features/call-log/call-log.types`), never `../..`.

## Anatomy of a feature

| File                | Holds                                    | Rule                                   |
| ------------------- | ---------------------------------------- | -------------------------------------- |
| `x.types.ts`        | State and domain types                   | Types only                             |
| `x.events.ts`       | The events the feature reacts to         | One union                              |
| `x.reducer.ts`      | `(state, event) => state`                | Pure: no IO, no time, no globals       |
| `x.domain.ts`       | Pure functions on the domain types       | No IO                                  |
| `x.effects.ts`      | Talking to the outside: reading the file | Returns `ResultAsync`; globals as args |
| `x.errors.ts`       | Error types and their text               | Text only in `format*`                 |
| `x.view.ts`         | Values derived for the markup            | Pure                                   |
| `x.store.svelte.ts` | `$state`, `dispatch`, wiring             | The only place globals are taken       |
| `ui/*.svelte`       | Components                               | No logic in markup                     |

A feature has the files it needs: `call-log` is domain only and has no events, reducer or store.
A domain too large for one file is split by what each part answers: `call-log.read.ts`,
`call-log.flags.ts`. Values that tests of a feature build go in `x.fixtures.ts`.

Tests sit next to the file they test: `x.reducer.test.ts`.

## Data flow

```
UI  ──► effect (reads the file)
           └► dispatch(event)
                 └► reducer(state, event)    the new state
                       └► UI re-renders from state, through x.view.ts
```

- The reducer never reads anything. If it needs something from outside, the effect reads it first
  and puts it in the event: the event carries the parsed log, not the `File`.
- An event says what happened (`FILE_READ`, `CONVERSATION_SELECTED`), not what to do with the
  state.

## Modelling state

The state says what the page shows, and only states that can happen can be written down:

```ts
type LogFileState =
  | { readonly phase: "EMPTY" }
  | { readonly phase: "READING"; readonly name: string }
  | { readonly phase: "READ"; readonly name: string; readonly log: ParsedLog }
  | {
      readonly phase: "FAILED";
      readonly name: string;
      readonly error: ReadError;
    };
```

- "Nothing", "not chosen" and "not loaded" are states, so they get a name, as
  `{ kind: "none" }` or a phase. No `null` or `undefined` for "nothing": `null` from outside
  (`DataTransfer`, DOM APIs) is converted where it comes in.
- A list that is never empty is `readonly [T, ...T[]]`. An id that must exist in a list is checked
  where it comes in, not at every use.
- Unions are handled with `match(...).exhaustive()` from `ts-pattern`, so a new case fails to
  compile wherever it is not handled.
- Types are `type`, not `interface`, and `readonly`. `exactOptionalPropertyTypes` is on: an
  optional property is either present with a value or absent.
- Discriminants: a state's is `phase`, an event's is `type`, an error's and a value's is `kind`.
  They are `SCREAMING_CASE` (`"FILE_READ"`, `"FIXED_AT"`), and so are modes (`"FAILURES"`); only an
  error's `kind` is `PascalCase` (`"NotJson"`), so an error reads as one wherever it appears.
  `@giraffty/ui`'s own types keep theirs (`{ kind: "none" }`).
- A value with a meaning is data, not text: a flag carries the call it points to
  (`{ kind: "REPEATED_CALL", seq: 3, sameAs: 2 }`), and the view makes the words.

## Errors

Errors are data. Text is made only when it is shown, in `format*` of the feature's `x.errors.ts`.

```ts
export type LineProblem =
  | { readonly kind: "NotJson"; readonly lineNumber: number }
  | {
      readonly kind: "NotACall";
      readonly lineNumber: number;
      readonly issues: readonly LineIssue[];
    };
```

- Extra fields carry the details. An error from another layer is wrapped, not flattened, so its
  own type and text survive.
- Never `string` or `unknown` as an error type.
- A line of the log that cannot be read is not a failure of the log: it is kept as a problem and
  the rest is shown.

## Results

Anything that can fail returns a `neverthrow` `Result<T, E>` (`ResultAsync` when it waits), with a
typed `E`.

- The success value is meaningful, never `null`, `undefined` or `void`.
- "Nothing there" is not a failure: it is a success with a `{ kind: "none" }` value.
- Code that throws (`JSON.parse`, `File.text()`) is wrapped where it is called, with
  `Result.fromThrowable` or `ResultAsync.fromPromise`.

## Globals

`document`, `File`, `DataTransfer` and the like are taken in the store file or the route, and
passed down. Effects take them as parameters, without defaults: a test passes a fake, and every
global an effect uses is visible where it is called.

## UI

- Components come from `@giraffty/ui`; styles use its tokens (`var(--ui-…)`), which stylelint
  enforces.
- Markup has no logic: no functions, conditions or computations in `src/lib/**/*.svelte`, which
  eslint enforces. Anything computed goes into `x.view.ts` and is tested there.
- No comments and no `eslint-disable` anywhere, which eslint and stylelint enforce. If a line
  needs explaining, the name is wrong. If a rule needs disabling, the code is.

## Tests

- 100% coverage on the `.ts` files in `src/lib`, except the stores, which only wire.
- Assert whole outcomes: `expect(result).toEqual(ok(value))`,
  `expect(problems).toEqual([{ kind: "NotJson", lineNumber: 3 }])`.
- No `_unsafe*` helpers from `neverthrow`.
- Log lines in tests are built by the feature's fixtures (`lineAt(3, { tool: "mutate" })`), with
  only the keys the test is about spelled out.
