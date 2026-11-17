<script lang="ts">
  import type { CodeBlockProps } from "./code-block.types";

  let { label, text }: CodeBlockProps = $props();
</script>

<figure class="code">
  <figcaption class="label">{label}</figcaption>
  <pre class="text">{text}</pre>
</figure>

<style>
  .code {
    display: flex;
    flex-direction: column;
    gap: var(--ui-space-1);
    min-inline-size: 0;
    margin: 0;
  }

  .label {
    font-family: var(--ui-font-mono);
    font-size: var(--ui-font-size-xs);
    font-weight: var(--ui-font-weight-bold);
    color: var(--ui-color-text-secondary);
    text-transform: uppercase;
    letter-spacing: var(--ui-tracking-wide);
  }

  .text {
    max-block-size: calc(var(--ui-space-7) * 12);
    padding: var(--ui-space-3);
    margin: 0;
    overflow: auto;
    font-family: var(--ui-font-mono);
    font-size: var(--ui-font-size-xs);
    line-height: var(--ui-line-height-normal);
    color: var(--ui-color-text-primary);
    overflow-wrap: anywhere;
    white-space: pre-wrap;
    background-color: var(--ui-color-bg-raised);
    border: var(--ui-border-width-thin) solid var(--ui-color-border-subtle);
  }
</style>
