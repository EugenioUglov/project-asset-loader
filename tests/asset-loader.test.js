import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import ProjectAssetLoader from '../src/index.js';

// Prepare a minimal mock browser environment (DOM)
function mockBrowserEnvironment() {
    global.document = {
        currentScript: { src: 'http://localhost/js/main.js' },
        createElement: (tagName) => {
            const element = { tagName, attributes: {} };
            return element;
        },
        body: {
            appendChild: (el) => {
                queueMicrotask(() => {
                    if (el.onload) el.onload();
                });
            }
        },
        head: {
            appendChild: (el) => {
                queueMicrotask(() => {
                    if (el.onload) el.onload();
                });
            }
        },
        getElementById: (id) => {
            if (id === 'existing-id') {
                return { id, innerHTML: '' };
            }
            return null;
        }
    };

    global.window = global;
}

describe('ProjectAssetLoader (Native Node.js Tests)', () => {
    let loader;

    beforeEach(() => {
        mockBrowserEnvironment();
        loader = new ProjectAssetLoader();
    });

    it('should initialize correctly via ESM import', () => {
        assert.ok(loader instanceof ProjectAssetLoader);
    });

    it('should create script element on loadJavaScript', async () => {
        let scriptCreated = false;
        
        const originalCreateElement = global.document.createElement;
        global.document.createElement = (tag) => {
            if (tag === 'script') scriptCreated = true;
            return originalCreateElement(tag);
        };

        // Pass an object with the path parameter
        await loader.loadJavaScript({ path: 'app.js' });
        assert.strictEqual(scriptCreated, true);
    });

    it('should cache repeated JavaScript loads (same Promise)', () => {
        const promise1 = loader.loadJavaScript({ path: 'cached.js' });
        const promise2 = loader.loadJavaScript({ path: 'cached.js' });

        // Verify that both calls returned the exact same Promise instance from cache
        assert.strictEqual(promise1, promise2);
    });

    it('should create link element on loadStyle', async () => {
        let linkCreated = false;
        
        const originalCreateElement = global.document.createElement;
        global.document.createElement = (tag) => {
            const element = originalCreateElement(tag);
            if (tag === 'link') {
                linkCreated = true;
            }
            return element;
        };

        // Pass an object with the path parameter
        await loader.loadStyle({ path: 'style.css' });
        assert.strictEqual(linkCreated, true);
    });

    it('should throw error if target DOM element does not exist for HTML', async () => {
        // Mock fetch for loading Mustache and the template
        global.fetch = async () => ({
            ok: true,
            text: async () => '<h1>Hello {{name}}</h1>'
        });
        
        global.Mustache = {
            render: () => '<h1>Hello World</h1>'
        };

        await assert.rejects(
            async () => {
                await loader.loadMustacheHtmlToDomElementById({
                    targetId: 'non-existent-element',
                    pathHtml: 'template.html',
                    data: { name: 'World' }
                });
            },
            {
                name: 'Error',
                message: /doesn't exist/
            }
        );
    });
});