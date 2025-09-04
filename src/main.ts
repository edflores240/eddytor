// import App from './App.svelte';

// // Check if we're in development or production
// const isDemo = window.location.pathname.includes('demo.html');
// const target = isDemo ? document.getElementById('my-editor') : document.getElementById('app') || document.body;

// // Initialize the app
// const app = new App({
//   target,
//   props: {
//     initialContent: isDemo ? '<p>Start writing your content here...</p>' : ''
//   }
// });

// // Export the app instance for programmatic usage in demo.html
// if (isDemo) {
//   window.Eddytor = {
//     init: (selector: string, options: any = {}) => {
//       const target = typeof selector === 'string' 
//         ? document.querySelector(selector) 
//         : selector;
      
//       if (!target) {
//         console.error(`Target element '${selector}' not found`);
//         return null;
//       }
//       target.innerHTML = ''; // Clear the target
      
//       const app = new App({
//         target,
//         props: {
//           initialContent: options.initialContent || '',
//           showTitle: options.showTitle !== false,
//           title: options.title || '',
//           titlePlaceholder: options.titlePlaceholder || 'Untitled',
//           titleEditable: options.titleEditable !== false
//         }
//       });
      
//       // Expose methods to control the editor
//       return {
//         get showTitle() { return app.showTitle; },
//         set showTitle(value) { app.showTitle = value; },
//         get title() { return app.title; },
//         set title(value) { app.title = value; },
//         get titlePlaceholder() { return app.titlePlaceholder; },
//         set titlePlaceholder(value) { app.titlePlaceholder = value; },
//         get titleEditable() { return app.titleEditable; },
//         set titleEditable(value) { app.titleEditable = value; },
//         // Add other methods as needed
//         destroy: () => app.$destroy()
//       };
//     }
//   };
// }

// export default app;
