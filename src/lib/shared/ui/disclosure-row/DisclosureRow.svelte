<script lang="ts">
  import { markOf, toggleOf } from "./disclosure-row";
  import type { DisclosureRowProps } from "./disclosure-row.types";

  let { expanded, onExpanded, header, children }: DisclosureRowProps = $props();
</script>

<div class="row" class:expanded>
  <button
    type="button"
    class="toggle"
    aria-expanded={expanded}
    onclick={toggleOf(onExpanded, expanded)}
  >
    <span class="mark" aria-hidden="true">{markOf(expanded)}</span>
    {@render header()}
  </button>
  {#if expanded}
    <div class="body">{@render children()}</div>
  {/if}
</div>

<style>
  .row {
    min-inline-size: 0;
    border-bottom: var(--ui-border-width-thin) solid
      var(--ui-color-border-subtle);
  }

  .row.expanded {
    background-color: var(--ui-color-bg-raised);
  }

  .toggle {
    display: flex;
    gap: var(--ui-space-3);
    align-items: center;
    inline-size: 100%;
    min-inline-size: 0;
    padding-block: var(--ui-space-2);
    padding-inline: var(--ui-space-3);
    font-family: var(--ui-font-mono);
    font-size: var(--ui-font-size-xs);
    color: var(--ui-color-text-primary);
    text-align: start;
    cursor: pointer;
    background: none;
    border: none;
  }

  .toggle:hover {
    background-color: var(--ui-color-bg-hover);
  }

  .toggle:focus-visible {
    outline: var(--ui-focus-width) solid var(--ui-color-focus);
    outline-offset: calc(var(--ui-focus-width) * -1);
  }

  .mark {
    flex-shrink: 0;
    color: var(--ui-color-text-secondary);
  }

  .body {
    display: flex;
    flex-direction: column;
    gap: var(--ui-space-3);
    padding-block: var(--ui-space-2) var(--ui-space-4);
    padding-inline: var(--ui-space-6) var(--ui-space-3);
  }
</style>
