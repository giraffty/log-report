<script lang="ts">
  import {
    chooseOf,
    dragStateOf,
    dropOf,
    keepInPage,
  } from "./file-drop.svelte";
  import type { FileDropProps } from "./file-drop.types";

  let { title, chooseLabel, accept, onFiles }: FileDropProps = $props();

  const drag = dragStateOf();
</script>

<div
  class="drop"
  class:over={drag.over}
  role="region"
  aria-label={title}
  ondragenter={drag.enter}
  ondragover={keepInPage}
  ondragleave={drag.leave}
  ondrop={dropOf(drag, onFiles)}
>
  <p class="title">{title}</p>
  <label class="choose">
    <input class="input" type="file" {accept} onchange={chooseOf(onFiles)} />
    {chooseLabel}
  </label>
</div>

<style>
  .drop {
    display: flex;
    flex-direction: column;
    gap: var(--ui-space-4);
    align-items: center;
    justify-content: center;
    padding: var(--ui-space-7);
    font-family: var(--ui-font-mono);
    font-size: var(--ui-font-size-sm);
    color: var(--ui-color-text-secondary);
    background-color: var(--ui-color-bg-surface);
    border: var(--ui-border-width-thick) dashed var(--ui-color-border-default);
  }

  .drop.over {
    color: var(--ui-color-text-primary);
    background-color: var(--ui-color-bg-hover);
    border-color: var(--ui-color-border-strong);
  }

  .title {
    margin: 0;
    letter-spacing: var(--ui-tracking-wide);
    text-transform: uppercase;
  }

  .choose {
    display: inline-flex;
    align-items: center;
    block-size: var(--ui-control-height-md);
    padding-inline: var(--ui-space-3);
    font-weight: var(--ui-font-weight-bold);
    color: var(--ui-color-text-primary);
    letter-spacing: var(--ui-tracking-wide);
    text-transform: uppercase;
    cursor: pointer;
    border: var(--ui-border-width-thin) solid var(--ui-color-border-strong);
  }

  .choose:hover {
    background-color: var(--ui-color-bg-hover);
  }

  .choose:focus-within {
    outline: var(--ui-focus-width) solid var(--ui-color-focus);
    outline-offset: var(--ui-focus-offset);
  }

  .input {
    position: absolute;
    inline-size: var(--ui-border-width-thin);
    block-size: var(--ui-border-width-thin);
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
</style>
