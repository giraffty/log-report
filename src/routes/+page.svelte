<script lang="ts">
  import OpenLog from "#lib/features/log-file/ui/OpenLog.svelte";
  import {
    closeLog,
    logFile,
  } from "#lib/features/log-file/log-file.store.svelte.ts";
  import { resetReport } from "#lib/features/report/report.store.svelte.ts";
  import Report from "#lib/features/report/ui/Report.svelte";
  import { keepInPage } from "#lib/shared/ui/file-drop/file-drop.svelte.ts";

  const close = (): void => {
    resetReport();
    closeLog();
  };
</script>

<svelte:head>
  <title>Log report</title>
</svelte:head>

<svelte:window ondragover={keepInPage} ondrop={keepInPage} />

{#if logFile.current.phase === "READ"}
  <Report
    name={logFile.current.name}
    log={logFile.current.log}
    onclose={close}
  />
{:else}
  <OpenLog file={logFile.current} />
{/if}
