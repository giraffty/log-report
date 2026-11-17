<script lang="ts">
  import {
    Bar,
    Button,
    DataList,
    DataRow,
    Notice,
    SearchField,
    SectionHeader,
  } from "@giraffty/ui";
  import type { AnalyzedLog } from "#lib/features/call-log/call-log.types.ts";
  import SelectList from "#lib/shared/ui/select-list/SelectList.svelte";
  import {
    chooseConversation,
    chooseModeOf,
    report,
    search,
  } from "../report.store.svelte";
  import { reportViewOf } from "../report.view";
  import Call from "./Call.svelte";

  let {
    name,
    log,
    onclose,
  }: {
    readonly name: string;
    readonly log: AnalyzedLog;
    readonly onclose: () => void;
  } = $props();

  const view = $derived(reportViewOf(log, report.current));
</script>

<div class="report">
  <Bar edge="top" size="md">
    {#snippet start()}
      <span class="name">{name}</span>
      <span class="summary">{view.summary}</span>
    {/snippet}
    {#snippet end()}
      <Button size="sm" variant="outline" onclick={onclose}>Open another</Button
      >
    {/snippet}
  </Bar>

  {#if view.problems.kind === "LINES"}
    <div class="problems">
      <Notice kind="warning" title={view.problems.title} size="sm">
        <ul class="lines">
          {#each view.problems.lines as line (line)}
            <li>{line}</li>
          {/each}
        </ul>
      </Notice>
    </div>
  {/if}

  <div class="body">
    <aside class="side">
      <div class="filters">
        <div class="modes" role="group" aria-label="Show">
          {#each view.modes as option (option.mode)}
            <Button
              size="sm"
              variant={option.variant}
              aria-pressed={option.pressed}
              onclick={chooseModeOf(option.mode)}>{option.label}</Button
            >
          {/each}
        </div>
        <SearchField
          label="Search calls"
          labelVisibility="hidden"
          size="sm"
          placeholder="Search calls…"
          value={report.current.search}
          onValue={search}
        />
      </div>
      <SelectList
        label="Conversations"
        items={view.conversations}
        onSelect={chooseConversation}
      />
    </aside>

    <main class="main">
      {#if view.shown.kind === "CONVERSATION"}
        <SectionHeader
          title={view.shown.conversation.title}
          level="h2"
          size="sm"
        />
        <DataList size="xs">
          {#each view.shown.conversation.metrics as row (row.label)}
            <DataRow label={row.label} value={row.value} />
          {/each}
        </DataList>
        <div class="calls">
          {#each view.shown.conversation.calls as call (call.key)}
            <Call {call} />
          {/each}
        </div>
      {:else}
        <p class="nothing">{view.shown.text}</p>
      {/if}
    </main>
  </div>
</div>

<style>
  .report {
    display: flex;
    flex-direction: column;
    block-size: 100vh;
  }

  .name,
  .summary {
    font-family: var(--ui-font-mono);
    font-size: var(--ui-font-size-sm);
  }

  .summary {
    color: var(--ui-color-text-secondary);
  }

  .problems {
    padding: var(--ui-space-3);
  }

  .lines {
    padding: 0;
    margin: 0;
    font-family: var(--ui-font-mono);
    font-size: var(--ui-font-size-xs);
    list-style: none;
  }

  .body {
    display: grid;
    flex: 1;
    grid-template-columns: calc(var(--ui-space-7) * 6) minmax(0, 1fr);
    min-block-size: 0;
  }

  .side {
    display: flex;
    flex-direction: column;
    min-block-size: 0;
    overflow: auto;
    border-right: var(--ui-border-width-thin) solid
      var(--ui-color-border-default);
  }

  .filters {
    display: flex;
    flex-direction: column;
    gap: var(--ui-space-2);
    padding: var(--ui-space-3);
    border-bottom: var(--ui-border-width-thin) solid
      var(--ui-color-border-subtle);
  }

  .modes {
    display: flex;
    gap: var(--ui-space-1);
  }

  .main {
    display: flex;
    flex-direction: column;
    gap: var(--ui-space-3);
    min-inline-size: 0;
    padding: var(--ui-space-4);
    overflow: auto;
  }

  .calls {
    display: flex;
    flex-direction: column;
    border-top: var(--ui-border-width-thin) solid var(--ui-color-border-subtle);
  }

  .nothing {
    margin: 0;
    font-family: var(--ui-font-mono);
    font-size: var(--ui-font-size-sm);
    color: var(--ui-color-text-secondary);
  }
</style>
