import type * as Monaco from 'monaco-editor';

// TODO: Types
type ViewEntry = {
    doc: any;
    type: any;
    asset: any;
    view: Monaco.editor.ITextModel;
    suppressChanges: boolean;
    viewState: any;
};

editor.once('load', () => {
    const panel = editor.call('layout.code');

    const monacoEditor = editor.call('editor:monaco');
    const viewIndex: Record<string, ViewEntry> = {};
    let focusedView = null;

    const modes = {
        script: 'javascript',
        json: 'json',
        html: 'html',
        css: 'css',
        shader: 'glsl'
    };

    /**
     * Converts an import entry to a Monaco-compatible path.
     *
     * @param {string[]} entry - The import entry (key, path).
     * @returns {[string, string[]]} The adjusted key and an array containing the file:// path.
     */
    function importEntryToMonacoPath([key, entry]) {
        const suffix = key.endsWith('/') ? '*' : '';
        const newKey = key + suffix;
        const path = `file://${entry}${suffix}`;
        return [newKey, [path]];
    }

    /**
     * Creates an array of module declarations for http imports.
     *
     * @example
     * ```
     * createModuleDeclarations([['external-lib', 'http://cdn.example.com/react']])
     * // =? ['declare module "external-lib" { const Module: any; export default Module; export = Module; }']
     * ```
     *
     * @param {[string, string][]} importEntries - The import entries (key, path).
     * @returns {string[]} The module declarations.
     */
    function createModuleDeclarations(importEntries) {
        const httpImports = importEntries
        .filter(([_, path]) => path.startsWith('http://') || path.startsWith('https://'))
        .map(([key]) => key);

        const httpImportToTypeDeclaration = key => (
            `declare module '${key}' {\nconst Module: any;\nexport default Module;\nexport = Module;\n}`
        );

        return httpImports.map(httpImportToTypeDeclaration);
    }

    function refreshReadonly() {
        const readonly = editor.call('editor:isReadOnly');
        const wasReadonly = monacoEditor.getOption('readOnly');
        monacoEditor.updateOptions({ readOnly: readonly });

        if (readonly !== wasReadonly) {
            editor.emit('editor:readonly:change', readonly);
        }
    }

    // Utility method that returns the import map if available
    editor.method('editor:importMap', () => new Promise((resolve, reject) => {
        const importMapId = config.project.settings.importMap;
        if (!importMapId) {
            resolve({ imports: {} });
        }
        const asset = editor.call('assets:get', importMapId);
        if (!asset) {
            resolve({ imports: {} });
        } else {
            editor.call('assets:contents:get', asset, (err, content) => {
                if (err) {
                    reject(err);
                }
                resolve(JSON.parse(content));
            });
        }
    }));

    // when we select an asset
    // if the asset is not loaded hide
    // the code panel until it's loaded
    editor.on('select:asset', (asset) => {
        if (asset.get('type') === 'folder') {
            return;
        }

        if (!viewIndex[asset.get('id')]) {
            panel.toggleCode(false);
        }
    });

    // When document is loaded create document
    // and add entry to index
    editor.on('documents:load', async (doc, asset) => {
        const id = asset.get('id');
        if (viewIndex[id]) {
            return;
        }

        let mode;
        const type = asset.get('type');
        if (modes[type]) {
            mode = modes[type];
        } else {
            mode = null;
        }

        const assetPath = asset.get('path');
        const pathAssets = assetPath.map(id => editor.call('assets:get', id));
        if (pathAssets.some(a => !a)) {
            // Parent folder(s) have been deleted, skip loading
            return;
        }
        const pathSegments = pathAssets.map(a => a.get('name'));
        const path = [...pathSegments, asset.get('file').filename].join('/');

        const uri = monaco.Uri.parse(`${path}`);
        const isModule = editor.call('assets:isModule', asset);
        if (isModule && monaco.editor.getModel(uri)) {
            editor.call('status:error', `Failed to open asset (${asset.get('id')}) from path ${path}. An asset with the same path is already open.`);
            return;
        }
        const entry: ViewEntry = {
            doc: doc,
            type: type,
            asset: asset,
            view: monaco.editor.createModel(doc.data, mode, isModule ? uri : undefined),
            suppressChanges: false,
            viewState: null
        };

        // emit change event
        entry.view.onDidChangeContent((evt) => {
            if (entry.suppressChanges) {
                return;
            }

            editor.emit('views:change', id, entry.view, evt);
        });

        viewIndex[id] = entry;

        editor.emit('views:new', id, entry.view, type);
        editor.emit(`views:new:${id}`, entry.view, type);

        const { imports } = await editor.call('editor:importMap');
        const importEntries = Object.entries(imports);
        const importPaths = importEntries.map(importEntryToMonacoPath);
        const monacoImportPaths = Object.fromEntries(importPaths);

        // The import map can contain external imports ie "react": "https://esm.sh/react"
        // We don't have type declarations for these, so we need to create pseudo ones for the editor for intellisense.
        // Note: Replace this when we actually resolve real type declarations
        const externalTypesDeclarations = createModuleDeclarations(importEntries);
        monaco.languages.typescript.javascriptDefaults.addExtraLib(externalTypesDeclarations.join('\n'), 'external-imports.d.ts');

        monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
            allowJs: true,
            checkJs: true,
            allowNonTsExtensions: true,
            esModuleInterop: true,
            target: monaco.languages.typescript.ScriptTarget.ES2020,
            lib: ['es2020', 'dom'],
            paths: {
                'playcanvas': ['playcanvas.d.ts'],
                ...monacoImportPaths
            }
        });
    });

    // Focus document
    editor.on('documents:focus', (id) => {
        if (!viewIndex[id]) {
            // This happens on some rare occasions not sure why yet...
            console.warn('Requested to focus document that has no view yet', `Document ${id}`);
            return;
        }
        // unhide code
        panel.toggleCode(true);

        // remember view state for the current view
        // so we can restore it after switching back to it
        if (focusedView) {
            focusedView.viewState = monacoEditor.saveViewState();
        }

        if (focusedView && viewIndex[id] === focusedView) {
            const content = focusedView.doc.data;
            if (focusedView.view.getValue() === content) {
                return;
            }

            // if the reloaded data are different
            // than the current editor value then reset the contents
            // of the editor - that can happen if a change has been rolled back
            // by sharedb for example
            focusedView.suppressChanges = true;
            focusedView.view.setValue(content);
            focusedView.suppressChanges = false;
        } else {
            focusedView = viewIndex[id];

            // set doc to monaco
            monacoEditor.setModel(focusedView.view);

            const options = {
                lineNumbers: true,
                folding: focusedView.type !== 'text'
            };

            monacoEditor.updateOptions(options);

            // only allow linting for script assets
            const isScript = focusedView.type === 'script';
            const isEsmScript = isScript && focusedView.asset.get('name').endsWith('.mjs');
            monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
                noSemanticValidation: !isEsmScript,
                noSyntaxValidation: !isScript
            });

            monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);

            // Enable TS like semantic type checking for ESM Scripts
        }

        refreshReadonly();

        // focus editor
        setTimeout(() => {
            monacoEditor.focus();

            // restore state
            if (focusedView.viewState) {
                monacoEditor.restoreViewState(focusedView.viewState);
            }
        });
    });

    // Close document
    editor.on('documents:close', (id) => {
        if (focusedView === viewIndex[id]) {
            // clear code
            // but suppress changes to the doc
            // to avoid sending them to sharedb
            focusedView.suppressChanges = true;
            monacoEditor.setValue('');

            panel.toggleCode(false);

            focusedView = null;
        }

        const entry = viewIndex[id];
        if (entry && entry.view) {
            entry.view.dispose();
        }

        delete viewIndex[id];
    });

    // Returns the dependencies of an ESM Script Asset
    const getDependenciesFromString = (content, importer = './') => {
        const importRegex = /import\s[\w\s{},*]+\sfrom\s+['"]([^'"]+)['"]/g;
        let match;
        const paths: Set<string> = new Set();

        while ((match = importRegex.exec(content)) !== null) {
            // Get the full path relative to the importer
            const path = new URL(match[1], `https://base${importer}`).pathname;

            // Check if the asset exists
            if (editor.call('assets:getByVirtualPath', path)) {
                paths.add(path);
            }
        }

        return paths;
    };

    editor.method('utils:deps-from-string', getDependenciesFromString);

    const getDependenciesForAsset = (asset): Promise<Set<string>> => {
        return new Promise((resolve, reject) => {
            editor.call('assets:contents:get', asset, (err, content) => {
                if (err) {
                    reject(err);
                }

                if (!asset.get('file.filename').endsWith('.mjs')) {
                    resolve(new Set([]));
                }

                const importer = editor.call('assets:virtualPath', asset);
                if (!importer) {
                    resolve(new Set([]));
                    return;
                }
                const deps = getDependenciesFromString(content, importer);

                resolve(deps);
            });
        });
    };

    editor.method('utils:deps-from-asset', asset => getDependenciesForAsset(asset));

    editor.method('asset:update-dependencies', async (asset) => {
        const filePath = editor.call('assets:virtualPath', asset);
        if (!filePath) {
            return;
        }

        // Fetch the dependencies for the asset
        const deps = await getDependenciesForAsset(asset);

        const openPaths = Object.values(viewIndex)
        .map(({ view }) => view.uri.path) // ignore the schema
        .filter(uri => uri.endsWith('.mjs')) // only esm files
        .filter(uri => uri !== filePath); // exclude the current asset

        // Create a set of the current files
        const currentFiles = new Set(openPaths);

        // Create a map of file paths to views. eg: { '/path/to/file.mjs': view }
        const pathEntryMap = new Map(
            Object.values(viewIndex).map(entry => [entry.view.uri.path, entry])
        );

        // get set of files that are not loaded
        const newFiles = deps.difference(currentFiles);

        // files to remove
        const filesToRemove = currentFiles.difference(deps);

        const openTabs = editor.call('tabs:list').map(tab => editor.call('assets:virtualPath', tab.asset)).filter(Boolean);

        // Remove the views for the files that are no longer dependencies
        filesToRemove.forEach((filePath) => {
            // Don't remove the file if it's open in a tab
            if (openTabs.includes(filePath)) {
                return;
            }
            const entry = pathEntryMap.get(filePath);
            if (entry) {
                editor.emit('documents:close', entry.asset.get('id'));
            }
        });

        // Find the associated asset for the file path, and load it
        newFiles.forEach((file) => {
            const asset = editor.call('assets:getByVirtualPath', file);
            if (asset) {
                editor.call('load:asset', asset, false);
            }
        });

        // We must force the editor content to refresh for changes to take effect
        const targetView = viewIndex[asset.get('id')];
        if (!targetView) {
            return;
        }

        targetView.suppressChanges = true;
        const monacoEditor = editor.call('editor:monaco');
        const position = monacoEditor.getPosition();
        const contents = targetView.view.getValue();
        targetView.view.setValue(contents);
        monacoEditor.setPosition(position);
        targetView.suppressChanges = false;
    });

    // unfocus
    editor.on('documents:unfocus', () => {
        // remember view state for the current view
        // so we can restore it after switching back to it
        if (focusedView) {
            focusedView.viewState = monacoEditor.saveViewState();
        }

        focusedView = null;
    });

    // Get focused document
    editor.method('editor:focusedView', () => {
        return focusedView && focusedView.view;
    });

    editor.on('documents:error', () => {
        refreshReadonly();
    });

    editor.method('editor:isReadOnly', () => {
        return !focusedView ||
               !editor.call('permissions:write') ||
                 editor.call('errors:hasRealtime') ||
                 editor.call('documents:hasError', focusedView.asset.get('id'));
    });

    // set code editor to readonly if necessary
    editor.on('permissions:writeState', refreshReadonly);

    // Returns the monaco view for an id
    editor.method('views:get', (id) => {
        const entry = viewIndex[id];
        return entry ? entry.view : null;
    });

    editor.method('view:asset', (modelId) => {
        for (const key in viewIndex) {
            if (viewIndex[key].view.id === modelId) {
                return viewIndex[key].asset;
            }
        }
        return null;
    });
});
