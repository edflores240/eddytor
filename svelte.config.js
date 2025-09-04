const sveltePreprocess = require('svelte-preprocess');
const path = require('path');

module.exports = {
  preprocess: sveltePreprocess({
    scss: {
      includePaths: [
        path.join(__dirname, 'src/lib/styles'), // Directly to the styles folder
        path.join(__dirname, 'node_modules')
      ],
      prependData: `
        @use 'sass:color';
        @use 'sass:map';
        @use 'sass:meta';
        @use 'sass:math';
        @use 'sass:string';
        @use 'sass:selector';

        // Load variables from _variables.scss
        @use '_variables' as *;
      `,
      sourceMap: true,
      warnRuleAsWarning: true,
    },
    postcss: true,
  }),
  compilerOptions: {
    css: 'injected',
    dev: process.env.NODE_ENV !== 'production',
    compatibility: {
      componentApi: 4
    }
  }
};
