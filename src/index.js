/**
 * This class gives possibility to load js, css and html dinamically
 */
class ProjectAssetLoader {
    /**
     * @param {string} [currentScriptUrl] - Optional URL. If exists set direction to indicated folder.
     * @param {boolean} [enableDebug=false] - Optional flag to enable debug logging console.log.
     */
    constructor({ currentScriptUrl = '', enableDebug = false } = {}) {
        const scriptUrl = currentScriptUrl || (document.currentScript ? document.currentScript.src : '');
        this.#basePath = this.#calculateBasePath(scriptUrl);
        this.#enableDebug = enableDebug;
        this.#enableDebug && console.log("📦 AssetLoader: Initialized with base path ->", this.#basePath);
    }

    #mustacheCdnPath = 'https://cdnjs.cloudflare.com/ajax/libs/mustache.js/0.1/mustache.min.js';
    #basePath = "";
    #cache = new Map();
    #enableDebug = false;

    setBasePath({ path }) {
        this.#basePath = path;
    }

    loadJavaScript({ path }) {
        const normalizedPath = this.#getNormalizedPath({ path });
        
        // Check if the promise is already cached
        if (this.#cache.has(normalizedPath)) {
            return this.#cache.get(normalizedPath);
        }

        // Check if the script tag already exists in the DOM (e.g., loaded via HTML)
        const existingScript = document.querySelector(`script[src="${normalizedPath}"]`);

        if (existingScript) {
            const promise = Promise.resolve();
            this.#cache.set(normalizedPath, promise);
            return promise;
        }

        const promise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = normalizedPath;
            
            script.onload = () => {
                this.#enableDebug && console.log("📦 AssetLoader: Loaded JS ->", script.src);
                resolve();
            };
            
            script.onerror = () => {
                this.#cache.delete(normalizedPath);
                reject(new Error(`Failed to load script: ${normalizedPath}`));
            };
            
            document.body.appendChild(script);
        });

        this.#cache.set(normalizedPath, promise);

        return promise;
    }

    loadStyle({ path }) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = this.#getNormalizedPath({ path });

            // Resolve the Promise when the browser has fully loaded the CSS
            link.onload = () => {
                this.#enableDebug && console.log("📦 AssetLoader: Loaded CSS ->", link.href);
                resolve();
            };

            link.onerror = () => reject(new Error(`Failed to load CSS: ${path}`));

            document.head.appendChild(link);
        });
    }

    async loadMustacheHtmlToDomElementById({ targetId, pathHtml, data }) {
        await this.loadJavaScript({ path: this.#mustacheCdnPath });

        const normalizedPath = this.#getNormalizedPath({ path: pathHtml });
        const response = await fetch(normalizedPath);

        if (!response.ok) {
            throw new Error(`AssetLoader: Failed to load HTML -> ${response.statusText} , Path: ${normalizedPath}`);
        }
        
        const templateText = await response.text();
        const renderedHtml = Mustache.render(templateText, data);
        
        const targetElement = document.getElementById(targetId);

        if (!targetElement) {
            console.error(`Debug: Searching for #${targetId}`);
            console.error("Current DOM snapshot:", document.body.innerHTML); // See what's actually there
            throw new Error(`AssetLoader: Failed to load HTML -> Element with id ${targetId} doesn't exist.`);
        }

        if (targetElement) {
            targetElement.innerHTML = renderedHtml;
        } else {
            throw new Error(`AssetLoader: Failed to load HTML -> Element with id ${targetId} doesn't exist.`);
        }

        this.#enableDebug && console.log("📦 AssetLoader: Loaded HTML ->", normalizedPath);

        return renderedHtml;
    }
    
    #calculateBasePath({ url }) {
        if (url) {
            return url.substring(0, url.lastIndexOf('/') + 1);
        }

        return '';
    }
    
    #getNormalizedPath({ path }) {
        // If path is already absolute, leave it
        if (/^https?:\/\//i.test(path)) {
            return path;
        }
        
        // Combine base path with the requested file path
        // FEATURE_BASE_PATH should point to the correct folder
        return (typeof this.#basePath !== 'undefined' ? this.#basePath : '') + path.replace(/^\/+/, '');
    }
}

export default ProjectAssetLoader;