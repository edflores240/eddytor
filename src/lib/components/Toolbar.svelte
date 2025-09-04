<script lang="ts">
  import { Separator, Toolbar } from "bits-ui";
  import { onMount } from 'svelte';
  import { createIcons, Bold, Italic, Strikethrough, AlignLeft, AlignCenter, AlignRight, Sparkles } from 'lucide';
 
  let text = $state(["bold"]);
  let align = $state("");
  
  onMount(() => {
    // Initialize Lucide icons
    createIcons({
      icons: {
        Bold,
        Italic,
        Strikethrough,
        AlignLeft,
        AlignCenter,
        AlignRight,
        Sparkles
      },
      attrs: {
        class: 'w-full h-full',
        'stroke-width': 1.5
      },
      nameAttr: 'data-lucide'
    });
  });
</script>
 
<Toolbar.Root
  class="rounded-10px border-border bg-background-alt shadow-mini flex h-12 min-w-max items-center justify-center border px-[4px] py-1"
>
  <Toolbar.Group
    bind:value={text}
    type="multiple"
    class="flex items-center gap-x-0.5"
  >
    <Toolbar.GroupItem
      aria-label="toggle bold"
      value="bold"
      class="rounded-9px bg-background-alt text-foreground/60 hover:bg-muted active:bg-dark-10 data-[state=on]:bg-muted data-[state=on]:text-foreground/80 active:data-[state=on]:bg-dark-10 inline-flex size-10 items-center justify-center transition-all active:scale-[0.98]"
    >
      <Toolbar.Button
        class="rounded-9px bg-background-alt text-foreground/60 hover:bg-muted active:bg-dark-10 data-[state=on]:bg-muted data-[state=on]:text-foreground/80 active:data-[state=on]:bg-dark-10 inline-flex size-10 items-center justify-center transition-all active:scale-[0.98]"
      >
        <i data-lucide="bold" class="size-6"></i>
      </Toolbar.Button>
    </Toolbar.GroupItem>
    <Toolbar.GroupItem
      aria-label="toggle italic"
      value="italic"
      class="rounded-9px bg-background-alt text-foreground/60 hover:bg-muted active:bg-dark-10 data-[state=on]:bg-muted data-[state=on]:text-foreground/80 active:data-[state=on]:bg-dark-10 inline-flex size-10 items-center justify-center transition-all active:scale-[0.98]"
    >
      <Toolbar.Button
        class="rounded-9px bg-background-alt text-foreground/60 hover:bg-muted active:bg-dark-10 data-[state=on]:bg-muted data-[state=on]:text-foreground/80 active:data-[state=on]:bg-dark-10 inline-flex size-10 items-center justify-center transition-all active:scale-[0.98]"
      >
        <i data-lucide="italic" class="size-6"></i>
      </Toolbar.Button>
    </Toolbar.GroupItem>
    <Toolbar.GroupItem
      aria-label="toggle strikethrough"
      value="strikethrough"
      class="rounded-9px bg-background-alt text-foreground/60 hover:bg-muted active:bg-dark-10 data-[state=on]:bg-muted data-[state=on]:text-foreground/80 active:data-[state=on]:bg-dark-10 inline-flex size-10 items-center justify-center transition-all active:scale-[0.98]"
    >
      <i data-lucide="strikethrough" class="size-6"></i>
    </Toolbar.GroupItem>
  </Toolbar.Group>
 
  <Separator.Root class="bg-dark-10 -my-1 mx-1 w-[1px] self-stretch" />
 
  <Toolbar.Group
    bind:value={align}
    type="single"
    class="flex items-center gap-x-0.5"
  >
    <Toolbar.GroupItem
      aria-label="align left"
      value="left"
      class="rounded-9px bg-background-alt text-foreground/60 hover:bg-muted active:bg-dark-10 data-[state=on]:bg-muted data-[state=on]:text-foreground/80 active:data-[state=on]:bg-dark-10 inline-flex size-10 items-center justify-center transition-all active:scale-[0.98]"
    >
      <i data-lucide="align-left" class="size-6"></i>
    </Toolbar.GroupItem>
    <Toolbar.GroupItem
      aria-label="align center"
      value="center"
      class="rounded-9px bg-background-alt text-foreground/60 hover:bg-muted active:bg-dark-10 data-[state=on]:bg-muted data-[state=on]:text-foreground/80 active:data-[state=on]:bg-dark-10 inline-flex size-10 items-center justify-center transition-all active:scale-[0.98]"
    >
      <i data-lucide="align-center" class="size-6"></i>
    </Toolbar.GroupItem>
    <Toolbar.GroupItem
      aria-label="align right"
      value="right"
      class="rounded-9px bg-background-alt text-foreground/60 hover:bg-muted active:bg-dark-10 data-[state=on]:bg-muted data-[state=on]:text-foreground/80 active:data-[state=on]:bg-dark-10 inline-flex size-10 items-center justify-center transition-all active:scale-[0.98]"
    >
      <i data-lucide="align-right" class="size-6"></i>
    </Toolbar.GroupItem>
  </Toolbar.Group>
 
  <Separator.Root class="bg-dark-10 -my-1 mx-1 w-[1px] self-stretch" />
 
  <div class="flex items-center">
    <Toolbar.Button
      class="rounded-9px text-foreground/80 hover:bg-muted active:bg-dark-10 inline-flex items-center justify-center px-3 py-2 text-sm font-medium transition-all active:scale-[0.98]"
    >
      <i data-lucide="sparkles" class="mr-2 size-6"></i>
      <span> Ask AI </span>
    </Toolbar.Button>
  </div>
</Toolbar.Root>