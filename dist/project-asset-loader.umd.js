(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.ProjectAssetLoader = factory());
})(this, (function () { 'use strict';

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

        /**
         * Sets a new base path for asset loading.
         * @param {Object} params - The parameters object.
         * @param {string} params.path - The new base path to set.
         * @returns {void}
         */
        setBasePath({ path }) {
            this.#basePath = path;
        }

        /**
         * Loads a JavaScript file dynamically or returns a cached promise if already loaded.
         * @param {Object} params - The parameters object.
         * @param {string} params.path - The path to the JavaScript file.
         * @returns {Promise<void>} A promise that resolves when the script is loaded.
         */
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
        
        /**
         * Loads a CSS stylesheet dynamically or returns a cached promise if already loaded.
         * @param {Object} params - The parameters object.
         * @param {string} params.path - The path to the CSS file.
         * @returns {Promise<void>} A promise that resolves when the stylesheet is loaded.
         */
        loadStyle({ path }) {
            const normalizedPath = this.#getNormalizedPath({ path });
            
            // Check if the promise is already cached
            if (this.#cache.has(normalizedPath)) {
                return this.#cache.get(normalizedPath);
            }

            // Check if the stylesheet link already exists in the DOM (e.g., loaded via HTML)
            const existingLink = document.querySelector(`link[rel="stylesheet"][href="${normalizedPath}"]`);

            if (existingLink) {
                const promise = Promise.resolve();
                this.#cache.set(normalizedPath, promise);
                return promise;
            }

            const promise = new Promise((resolve, reject) => {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = normalizedPath;

                // Resolve the Promise when the browser has fully loaded the CSS
                link.onload = () => {
                    this.#enableDebug && console.log("📦 AssetLoader: Loaded CSS ->", link.href);
                    resolve();
                };

                link.onerror = () => {
                    this.#cache.delete(normalizedPath);
                    reject(new Error(`Failed to load CSS: ${normalizedPath}`));
                };

                document.head.appendChild(link);
            });

            this.#cache.set(normalizedPath, promise);

            return promise;
        }

        /**
         * Loads an HTML template, renders it using Mustache with the provided data, and injects it into a DOM element.
         * @param {Object} params - The parameters object.
         * @param {string} params.targetId - The ID of the DOM element where the rendered HTML will be inserted.
         * @param {string} params.pathHtml - The path to the HTML template file.
         * @param {Object} [params.data={}] - The data object to render with the Mustache template.
         * @returns {Promise<string>} A promise that resolves with the rendered HTML string.
         */
        async loadMustacheHtmlToDomElementById({ targetId, pathHtml, data }) {
            await this.loadJavaScript({ path: this.#mustacheCdnPath });

            const normalizedPath = this.#getNormalizedPath({ path: pathHtml });
            
            let templateText;

            if (this.#cache.has(normalizedPath)) {
                templateText = this.#cache.get(normalizedPath);
            } else {
                const response = await fetch(normalizedPath);

                if (!response.ok) {
                    throw new Error(`AssetLoader: Failed to load HTML -> ${response.statusText} , Path: ${normalizedPath}`);
                }
                
                templateText = await response.text();
                this.#cache.set(normalizedPath, templateText);
            }

            const renderedHtml = Mustache.render(templateText, data);
            
            const targetElement = document.getElementById(targetId);

            if (!targetElement) {
                console.error(`Debug: Searching for #${targetId}`);
                console.error("Current DOM snapshot:", document.body.innerHTML);
                throw new Error(`AssetLoader: Failed to load HTML -> Element with id ${targetId} doesn't exist.`);
            }

            targetElement.innerHTML = renderedHtml;

            this.#enableDebug && console.log("📦 AssetLoader: Loaded HTML ->", normalizedPath);

            return renderedHtml;
        }
        
        /**
         * Calculates the base path directory from a given URL string.
         * @private
         * @param {Object} params - The parameters object.
         * @param {string} params.url - The URL string to parse.
         * @returns {string} The calculated base path.
         */
        #calculateBasePath({ url }) {
            if (url) {
                return url.substring(0, url.lastIndexOf('/') + 1);
            }

            return '';
        }
        
        /**
         * Normalizes a relative or absolute asset path.
         * @private
         * @param {Object} params - The parameters object.
         * @param {string} params.path - The asset path to normalize.
         * @returns {string} The normalized full path.
         */
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

    return ProjectAssetLoader;

}));
