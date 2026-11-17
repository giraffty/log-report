<script lang="ts" generics="T extends string | number">
  import { Tag } from "@giraffty/ui";
  import { currentOf, selectOf } from "./select-list";
  import type { SelectListProps } from "./select-list.types";

  let { label, items, onSelect }: SelectListProps<T> = $props();
</script>

<nav aria-label={label}>
  <ul class="items">
    {#each items as item (item.value)}
      <li>
        <button
          type="button"
          class="item"
          class:selected={item.selected}
          aria-current={currentOf(item.selected)}
          onclick={selectOf(onSelect, item.value)}
        >
          <span class="title">{item.title}</span>
          <span class="meta">{item.meta}</span>
          {#each item.marks as mark (mark.text)}
            <Tag size="xs" tone={mark.tone}>{mark.text}</Tag>
          {/each}
        </button>
      </li>
    {/each}
  </ul>
</nav>

<style>
  .items {
    display: flex;
    flex-direction: column;
    padding: 0;
    margin: 0;
    list-style: none;
  }

  .item {
    display: flex;
    gap: var(--ui-space-2);
    align-items: center;
    inline-size: 100%;
    padding-block: var(--ui-space-2);
    padding-inline: var(--ui-space-3);
    font-family: var(--ui-font-mono);
    font-size: var(--ui-font-size-xs);
    color: var(--ui-color-text-secondary);
    text-align: start;
    cursor: pointer;
    background: none;
    border: none;
    border-left: var(--ui-border-width-thick) solid transparent;
  }

  .item:hover {
    color: var(--ui-color-text-primary);
    background-color: var(--ui-color-bg-hover);
  }

  .item.selected {
    color: var(--ui-color-text-primary);
    background-color: var(--ui-color-bg-active);
    border-left-color: var(--ui-color-border-strong);
  }

  .item:focus-visible {
    outline: var(--ui-focus-width) solid var(--ui-color-focus);
    outline-offset: calc(var(--ui-focus-width) * -1);
  }

  .title {
    font-weight: var(--ui-font-weight-bold);
  }

  .meta {
    flex: 1;
    min-inline-size: 0;
  }
</style>
