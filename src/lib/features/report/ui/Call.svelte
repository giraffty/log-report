<script lang="ts">
  import { DataList, DataRow, InlineNotice, Tag } from "@giraffty/ui";
  import CodeBlock from "#lib/shared/ui/code-block/CodeBlock.svelte";
  import DisclosureRow from "#lib/shared/ui/disclosure-row/DisclosureRow.svelte";
  import { expandCallOf } from "../report.store.svelte";
  import type { CallView } from "../report.types";

  let { call }: { readonly call: CallView } = $props();
</script>

<DisclosureRow expanded={call.expanded} onExpanded={expandCallOf(call.id)}>
  {#snippet header()}
    <span class="time">{call.time}</span>
    <span class="seq">{call.seq}</span>
    <span class="tool">{call.tool}</span>
    <Tag size="xs" tone={call.outcome.tone}>{call.outcome.label}</Tag>
    <span class="number">{call.duration}</span>
    <span class="number">{call.size}</span>
    <span class="summary">{call.summary}</span>
    {#if call.flagMark.kind === "text"}
      <Tag size="xs" tone="neutral" variant="outline">{call.flagMark.text}</Tag>
    {/if}
  {/snippet}
  {#if call.detail.kind === "OPEN"}
    {#if call.detail.flags.kind === "FLAGS"}
      <ul class="flags">
        {#each call.detail.flags.texts as flag (flag)}
          <li>{flag}</li>
        {/each}
      </ul>
    {/if}
    <CodeBlock label="Sent" text={call.detail.sent} />
    <CodeBlock label={call.detail.receivedLabel} text={call.detail.received} />
    {#if call.detail.cut.kind === "text"}
      <InlineNotice kind="info" size="sm">{call.detail.cut.text}</InlineNotice>
    {/if}
    <DataList size="xs">
      {#each call.detail.meta as row (row.label)}
        <DataRow label={row.label} value={row.value} tone="muted" />
      {/each}
    </DataList>
  {/if}
</DisclosureRow>

<style>
  .time,
  .seq,
  .number {
    flex-shrink: 0;
    color: var(--ui-color-text-secondary);
  }

  .tool {
    flex-shrink: 0;
    font-weight: var(--ui-font-weight-bold);
  }

  .summary {
    flex: 1;
    min-inline-size: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .flags {
    display: flex;
    flex-direction: column;
    gap: var(--ui-space-1);
    padding: 0;
    margin: 0;
    font-family: var(--ui-font-mono);
    font-size: var(--ui-font-size-xs);
    color: var(--ui-color-accent);
    list-style: none;
  }
</style>
