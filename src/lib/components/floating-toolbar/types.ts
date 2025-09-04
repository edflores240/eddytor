// src/lib/components/floating-toolbar/types.ts
import type { SvelteComponent } from 'svelte';

export interface Position {
  x: number;
  y: number;
}

export interface ToolbarButton {
  type: 'button';
  command: string;
  icon: typeof SvelteComponent;
  title: string;
  shortcut?: string;
}

export interface ToolbarDivider {
  type: 'divider';
}

export type ToolbarItem = ToolbarButton | ToolbarDivider;