# Giraffty log report

A page that shows what an AI agent did through the Giraffty MCP server: the calls it made, what
failed, and the patterns worth a look. It reads the MCP server's call log
(`%LOCALAPPDATA%\Giraffty\logs\mcp-calls.jsonl`), the file a pilot user sends.

The page reads the file in your browser. It sends nothing anywhere and keeps nothing after you
close it.

## Develop

Requires Node 24 and pnpm. `@giraffty/ui` comes from GitHub Packages, so `GITHUB_TOKEN` must hold
a token that can read packages (see `.npmrc`).

```
pnpm install
pnpm test:browser   # once: the browser the tests run in
pnpm dev
pnpm verify         # types, lint, styles, format, dead code, tests, build
```

Every push to `master` that passes `pnpm verify` is published to GitHub Pages.

How the code is written: [CONVENTIONS.md](CONVENTIONS.md).
