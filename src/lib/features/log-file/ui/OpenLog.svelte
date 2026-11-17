<script lang="ts">
  import { Notice, Spinner } from "@giraffty/ui";
  import FileDrop from "#lib/shared/ui/file-drop/FileDrop.svelte";
  import { formatFileError } from "../log-file.errors";
  import { openFiles } from "../log-file.store.svelte";
  import type { LogFileState } from "../log-file.types";

  let { file }: { readonly file: Exclude<LogFileState, { phase: "READ" }> } =
    $props();
</script>

<div class="open">
  {#if file.phase === "READING"}
    <p class="reading"><Spinner /> Reading {file.name}</p>
  {:else}
    {#if file.phase === "FAILED"}
      <Notice kind="error" title="Not read"
        >{formatFileError(file.error)}</Notice
      >
    {/if}
    <FileDrop
      title="Drop a call log here"
      chooseLabel="Choose a file"
      accept=".jsonl,.json,.txt,.log"
      onFiles={openFiles}
    />
  {/if}
  <p class="where">
    The MCP server writes its log to <code
      >%LOCALAPPDATA%\Giraffty\logs\mcp-calls.jsonl</code
    >: type <code>%LOCALAPPDATA%\Giraffty\logs</code> into the file dialog's address
    bar to get there.
  </p>
  <p class="privacy">
    The file is read in this browser. Nothing is sent, and nothing is kept when
    you close the page.
  </p>
</div>

<style>
  .open {
    display: flex;
    flex-direction: column;
    gap: var(--ui-space-4);
    inline-size: 100%;
    max-inline-size: calc(var(--ui-space-7) * 16);
    padding: var(--ui-space-6);
    margin-inline: auto;
  }

  .reading {
    display: flex;
    gap: var(--ui-space-2);
    align-items: center;
    margin: 0;
    font-family: var(--ui-font-mono);
    font-size: var(--ui-font-size-sm);
  }

  .where,
  .privacy {
    margin: 0;
    font-size: var(--ui-font-size-sm);
    color: var(--ui-color-text-secondary);
  }

  code {
    font-family: var(--ui-font-mono);
    color: var(--ui-color-text-primary);
  }
</style>
