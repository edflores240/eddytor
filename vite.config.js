import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';
import { resolve } from 'path';

export default defineConfig({
  server: {
    hmr: {
      overlay: true,
      reload: true
    },
    watch: {
      usePolling: true,
      interval: 100
    }
  },
  plugins: [
    svelte({
      hot: {
        injectCss: true,
        partialAccept: true,
        noReload: false,
        noPreserveState: false,
        optimistic: true
      },
      preprocess: sveltePreprocess({
        scss: {
          includePaths: [
            resolve(__dirname, 'src/lib/styles'),
            resolve(__dirname, 'node_modules')
          ],
          prependData: `
            @use 'sass:color';
            @use 'sass:map';
            @use 'sass:meta';
            @use 'sass:math';
            @use 'sass:string';
            @use '_variables' as *;
          `,
        },
      }),
      emitCss: true,
    }),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        includePaths: [
          resolve(__dirname, 'src/lib/styles'),
          resolve(__dirname, 'node_modules')
        ],
        additionalData: `
          @use 'sass:color';
          @use 'sass:map';
          @use 'sass:meta';
          @use 'sass:math';
          @use 'sass:string';
          @use '_variables' as *;
        `,  
      },
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/lib/index.ts'),
      name: 'Eddytor',
      fileName: (format) => `eddytor.${format}.js`,
      formats: ['umd'],
    },
    cssCodeSplit: false,
    rollupOptions: {
      external: [],
      loader: { ".svg": "dataurl" },
      output: {
        assetFileNames: 'eddytor[extname]',
        entryFileNames: 'eddytor.umd.js',
        globals: {
          'prosemirror-state': 'ProseMirror',
          'prosemirror-view': 'ProseMirror',
          'prosemirror-model': 'ProseMirror',
          'prosemirror-commands': 'ProseMirror',
          'prosemirror-schema-basic': 'ProseMirror',
          'prosemirror-history': 'ProseMirror',
          'prosemirror-keymap': 'ProseMirror',
          'lucide': 'lucide'
          
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      'svelte',
      'prosemirror-state',
      'prosemirror-view',
      'prosemirror-model',
      'prosemirror-commands',
      'prosemirror-schema-basic',
      'prosemirror-history',
      'prosemirror-keymap'
    ],
  },
});
