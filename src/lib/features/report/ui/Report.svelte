<script lang="ts">
  import { Bar, Button } from "@giraffty/ui";
  import type { AnalyzedLog } from "#lib/features/call-log/call-log.types.ts";

  let {
    name,
    log,
    onclose,
  }: {
    readonly name: string;
    readonly log: AnalyzedLog;
    readonly onclose: () => void;
  } = $props();
</script>

<Bar edge="top" size="md">
  {#snippet start()}
    <span class="name">{name}</span>
    <span class="count">{log.conversations.length} conversations</span>
  {/snippet}
  {#snippet end()}
    <Button size="sm" variant="outline" onclick={onclose}>Open another</Button>
  {/snippet}
</Bar>

<style>
  .name,
  .count {
    font-family: var(--ui-font-mono);
    font-size: var(--ui-font-size-sm);
  }

  .count {
    color: var(--ui-color-text-secondary);
  }
</style>
