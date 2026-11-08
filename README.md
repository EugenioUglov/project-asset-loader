# project-asset-loader

A lightweight JavaScript utility for dynamically loading scripts, CSS stylesheets, and rendering HTML templates using Mustache.js.

## Features

- 📦 **Dynamic Script Loading**: Load JavaScript files on-demand with automatic Caching/Deduplication (prevents duplicate injections).
- 🎨 **Dynamic Stylesheet Loading**: Inject CSS links into the `<head>` asynchronously.
- 📝 **Mustache HTML Rendering**: Fetch HTML templates and automatically compile/render them with data into target DOM elements using Mustache.js.
- ⚡ **Zero Dependencies**: Lightweight and fast, bundled in ESM and UMD formats.

---

## Installation

```bash
npm install project-asset-loader
```

---

## Usage

### Option 1. ES Modules (Bundlers, Modern JS, Node.js environment)

```javascript
import ProjectAssetLoader from 'project-asset-loader';

// Initialize with options (all options are optional)
const loader = new ProjectAssetLoader({
  currentScriptUrl: '', // Optional: sets base path for relative asset fetching
  enableDebug: false    // Optional: enable debug logs
});

// Load CSS dynamically
loader.loadStyle('./css/styles.css')
  .then(() => console.log('Styles loaded!'))
  .catch(err => console.error(err));

// Load JS dynamically
loader.loadJavaScript('./js/feature.js')
  .then(() => console.log('Script loaded!'));

// Load Mustache HTML template and render to DOM element
loader.loadMustacheHtmlToDomElementById({
  targetId: 'app-container',
  pathHtml: './templates/user-card.html',
  data: { name: 'John Doe', role: 'Developer' }
}).then(renderedHtml => {
  console.log('HTML successfully injected!');
});
```

### Option 2. Browser Environment (UMD / direct `<script>` tag)

When included via a standard `<script>` tag, `ProjectAssetLoader` is available directly on the global `window` object.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Asset Loader Demo</title>
  
  <!-- Include UMD Bundle -->
  <script src="./node_modules/project-asset-loader/dist/project-asset-loader.umd.js"></script>
</head>
<body>

  <div id="content-container">Loading content...</div>

  <script>
    const loader = new ProjectAssetLoader();

    // Render HTML template dynamically
    loader.loadMustacheHtmlToDomElementById({
      targetId: 'content-container',
      pathHtml: './templates/widget.html',
      data: { title: 'Welcome!' }
    });
  </script>
</body>
</html>
```

---

## API Reference

### `new ProjectAssetLoader(options)`
- **`options.currentScriptUrl`** *(string, optional)*: Explicit base path URL for relative asset resolving.
- **`options.enableDebug`** *(boolean, optional)*: Toggles internal debug logging.

### `loadJavaScript(path)`
Loads a JavaScript file asynchronously. Returns a `Promise`.
- **`path`** *(string)*: Absolute or relative URL to the JavaScript file.

### `loadStyle(path)`
Injects a stylesheet `<link>` tag into `<head>`. Returns a `Promise`.
- **`path`** *(string)*: Absolute or relative URL to the CSS file.

### `loadMustacheHtmlToDomElementById({ targetId, pathHtml, data })`
Fetches an HTML template, automatically loads Mustache.js if not present, renders the template with the provided data, and injects the resulting HTML into the target element. Returns a `Promise<string>`.
- **`targetId`** *(string)*: ID of the DOM container element.
- **`pathHtml`** *(string)*: Path to the HTML template file.
- **`data`** *(object)*: Object containing variables for Mustache rendering.

### `setBasePath({ path })`
Dynamically changes the base path used for resolving relative URLs.

---

## License

MIT LICENSE