import type { Observer } from '@playcanvas/observer';
import type * as Monaco from 'monaco-editor';

import { WorkerClient } from '../../../core/worker/worker-client.ts';

export interface Fix extends Monaco.languages.TextEdit {
    title?: string;
}

type ParseAttribute = {
    isAttribute: boolean;
    name: string;
    type: string;
    start: { line: number; column: number };
    end: { line: number; column: number };
}

const OWNER = 'attribute-autofill';

const fetchTypes = async (url: string): Promise<string> => {
    const typesURL = url.replace(/(\.min|\.dbg|\.prf)?\.js$/, '.d.ts');
    const res = await fetch(typesURL);
    return await res.text();
};

const NULL_EDIT_PROVIDER: Monaco.languages.CodeLensList = {
    lenses: [],
    dispose: () => {}
};

const buildFixAction = (
    model: Monaco.editor.ITextModel,
    marker: Monaco.editor.IMarkerData,
    fix: Fix
): Monaco.languages.CodeAction => {
    return {
        title: fix.title ?? 'Fix',
        diagnostics: [marker],
        kind: 'quickfix',
        isPreferred: true,
        edit: {
            edits: [
                {
                    resource: model.uri,
                    textEdit: fix,
                    versionId: model.getVersionId()
                } as Monaco.languages.IWorkspaceTextEdit
            ]
        }
    };
};

/**
 * JSDoc manipulation utilities
 */
class JSDocUtils {
    static ATTRIBUTE_TAGS = [
        '@attribute',
        '@range',
        '@precision',
        '@step',
        '@resource',
        '@curves',
        '@placeholder',
        '@size',
        '@enabledif',
        '@visibleif',
        '@color'
    ];

    /**
     * Get indentation from a line
     * @param {string} line - The line to get the indentation from
     * @returns {string} - The indentation
     */
    static getIndent(line: string) {
        return line.match(/^(\s*)/)?.[0] || '';
    }

    /**
     * Create JSDoc block with specified tags
     * @param {string} indent - The indentation to use
     * @param {string[]} tags - The tags to add to the JSDoc block
     * @returns {string} - The JSDoc block
     */
    static createJSDoc(indent: string, tags: string[]) : string {
        const tagLines = tags.map(tag => `${indent} * ${tag}`).join('\n');
        return `${indent}/**\n${tagLines}\n${indent} */\n`;
    }

    /**
     * Remove attribute tags from single-line JSDoc
     * @param {string} content - The content to clean
     * @returns {string} - The cleaned content
     */
    static cleanSingleLineJSDoc(content: string) {
        let cleaned = content;
        JSDocUtils.ATTRIBUTE_TAGS.forEach((tag) => {
            cleaned = cleaned.replace(new RegExp(`\\s*\\*?\\s*${tag}\\s*`, 'g'), '');
        });
        return cleaned;
    }

    /**
     * Find lines containing attribute tags
     * @param {string[]} lines - The lines to search
     * @param {number} startLine - The start line number
     * @param {number} endLine - The end line number
     * @returns {number[]} - The lines containing attribute tags
     */
    static findAttributeLines(lines: string[], startLine: number, endLine: number) : number[] {
        const linesToRemove = [];
        for (let i = startLine - 1; i < endLine; i++) {
            const line = lines[i];
            const hasAttributeTag = JSDocUtils.ATTRIBUTE_TAGS.some(tag => line.includes(tag));
            if (hasAttributeTag) {
                linesToRemove.push(i + 1);
            }
        }
        return linesToRemove;
    }

    /**
     * Check if a specific tag exists in the JSDoc block
     * @param {Monaco.editor.ITextModel} model - The text model
     * @param {number} startLine - The start line of the JSDoc block
     * @param {number} endLine - The end line of the JSDoc block
     * @param {string} tag - The tag to check for (e.g., '@range', '@attribute')
     * @returns {boolean} - Whether the tag exists in the JSDoc block
     */
    static hasTagInJSDoc(model: Monaco.editor.ITextModel, startLine: number, endLine: number, tag: string) : boolean {
        const lines = model.getLinesContent();
        for (let i = startLine - 1; i < endLine; i++) {
            const line = lines[i];
            if (line.includes(tag)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Apply multiple edits in reverse order to maintain line numbers
     * @param {Monaco.editor.ITextModel} model - The text model to apply edits to
     * @param {Monaco.editor.IIdentifiedSingleEditOperation[]} edits - The edits to apply
     */
    static applyEditsReverse(
        model: Monaco.editor.ITextModel,
        edits: Monaco.editor.IIdentifiedSingleEditOperation[]
    ): void {
        edits.reverse().forEach(edit => model.applyEdits([edit]));
    }
}

/**
 * Fetches all ESM scripts
 *
 * @param {Map<string, string>} cache - The file cache
 * @param {string[]} filter - The paths to filter
 * @returns {Promise<[[string, string][], string[]]>} - The scripts and deleted files
 */
const fetchModuleScripts = async (
    cache: Map<string, string>,
    filter: string[] = []
) : Promise<[[string, string][], string[]]> => {
    const assets = (editor.call('assets:list') ?? []) as Observer[];

    // Get all the files that no longer exist. ie files in the cache, but not in esmScripts
    const deletedFiles = [];

    // loop over the file cache, remove any files that do no exist in the script assets
    const assetPaths: string[] = assets.map(asset => editor.call('assets:virtualPath', asset));
    for (const filePath in cache) {
        if (!assetPaths.includes(filePath)) {
            deletedFiles.push(filePath);
            cache.delete(filePath);
        }
    }

    const scripts = await Promise.all(assets.reduce((acc: Promise<[string, string]>[], asset: Observer) => {
        // skip non-module assets
        if (!editor.call('assets:isModule', asset)) {
            return acc;
        }

        // skip filtered paths
        const path: string = editor.call('assets:virtualPath', asset);
        if (filter.includes(path)) {
            return acc;
        }

        // skip cached files
        const hash: string = asset.get('file.hash');
        if (cache.get(path) === hash) {
            return acc;
        }

        // Attempt to fetch the script
        try {
            const url = editor.call('assets:realPath', asset);

            const promise: Promise<[string, string]> = fetch(url).then(res => res.text()).then((content) => {
                cache.set(path, hash);
                return [path, content];
            });
            acc.push(promise);
        } catch (e) {
            console.error(`Failed to fetch ESM script ${path}`, e);
        }
        return acc;
    }, [] as Promise<[string, string]>[]));

    return [scripts, deletedFiles];
};

/**
 * Generic function to modify JSDoc attributes
 * @param {Monaco.editor.ITextModel} model - The text model
 * @param {number} lineNumber - The line number of the member
 * @param {ParseAttribute | null} attribute - The attribute object with JSDoc positioning
 * @param {'add' | 'addSlider' | 'remove'} action - The action to perform
 */
const modifyJSDocAttribute = (
    model: Monaco.editor.ITextModel,
    lineNumber: number,
    attribute: ParseAttribute | null,
    action: 'add' | 'addSlider' | 'remove'
) : void => {
    const lines = model.getLinesContent();

    // If start == end (same position), no JSDoc exists
    const hasJSDoc = !(attribute.start.line === attribute.end.line && attribute.start.column === attribute.end.column);

    // If JSDoc exists and spans only one line, it's single-line
    const isSingleLine = hasJSDoc && attribute.start.line === attribute.end.line - 1;

    if (hasJSDoc) {
        const jsDocStartLine = attribute.start.line;
        const jsDocEndLine = attribute.end.line;
        const startLineContent = lines[jsDocStartLine - 1];
        const indent = JSDocUtils.getIndent(startLineContent);

        if (action === 'remove') {
            JSDocActions.remove(model, lines, jsDocStartLine, jsDocEndLine, isSingleLine);
        } else {
            JSDocActions.add(model, jsDocStartLine, jsDocEndLine, startLineContent, indent, isSingleLine, action);
        }
    } else {
        // No JSDoc block - create new one
        const memberLine = lines[lineNumber - 1];
        const indent = JSDocUtils.getIndent(memberLine);
        const tags = action === 'addSlider' ? ['@attribute', '@range [0, 100]'] : ['@attribute'];
        const jsDoc = JSDocUtils.createJSDoc(indent, tags);

        model.applyEdits([{
            range: {
                startLineNumber: lineNumber,
                startColumn: 1,
                endLineNumber: lineNumber,
                endColumn: 1
            },
            text: jsDoc
        }]);
    }
};

/**
 * Specific JSDoc actions
 */
const JSDocActions = {
    remove(
        model: Monaco.editor.ITextModel,
        lines: string[],
        startLine: number,
        endLine: number,
        isSingleLine: boolean
    ) : void {
        if (isSingleLine) {
            const lineContent = lines[startLine - 1];
            const newContent = JSDocUtils.cleanSingleLineJSDoc(lineContent);

            if (newContent !== lineContent) {
                model.applyEdits([{
                    range: {
                        startLineNumber: startLine,
                        startColumn: 1,
                        endLineNumber: startLine,
                        endColumn: lineContent.length + 1
                    },
                    text: newContent
                }]);
            }
        } else {
            const linesToRemove = JSDocUtils.findAttributeLines(lines, startLine, endLine);
            const edits: Monaco.editor.IIdentifiedSingleEditOperation[] = linesToRemove.map(lineNumber => ({
                range: {
                    startLineNumber: lineNumber,
                    startColumn: 1,
                    endLineNumber: lineNumber + 1,
                    endColumn: 1
                },
                text: ''
            }));
            JSDocUtils.applyEditsReverse(model, edits);
        }
    },

    add(
        model: Monaco.editor.ITextModel,
        startLine: number,
        endLine: number,
        startLineContent: string,
        indent: string,
        isSingleLine: boolean,
        action: 'add' | 'addSlider'
    ) : void {
        if (isSingleLine) {
            const tags = action === 'addSlider' ? ['@attribute', '@range [0, 100]'] : ['@attribute'];
            const newJsDoc = JSDocUtils.createJSDoc(indent, tags).slice(0, -1); // Remove trailing newline

            model.applyEdits([{
                range: {
                    startLineNumber: startLine,
                    startColumn: 1,
                    endLineNumber: startLine,
                    endColumn: startLineContent.length + 1
                },
                text: newJsDoc
            }]);
        } else {
            const insertLine = startLine + 1;
            let tagsToAdd;

            if (action === 'addSlider') {
                // Check if @range already exists using the utility function
                const hasRangeTag = JSDocUtils.hasTagInJSDoc(model, startLine, endLine, '@range');
                tagsToAdd = hasRangeTag ? `${indent} * @attribute\n` : `${indent} * @attribute\n${indent} * @range [0, 100]\n`;
            } else {
                tagsToAdd = `${indent} * @attribute\n`;
            }

            model.applyEdits([{
                range: {
                    startLineNumber: insertLine,
                    startColumn: 1,
                    endLineNumber: insertLine,
                    endColumn: 1
                },
                text: tagsToAdd
            }]);
        }
    }
};

/**
 * Add @attribute tag to a member using JSDoc position information
 * @param {Monaco.editor.ITextModel} model - The text model
 * @param {number} lineNumber - The line number of the member
 * @param {string} memberName - The name of the member
 * @param {ParseAttribute} attribute - The attribute object with JSDoc positioning
 */
const addAttributeToMember = (
    model: Monaco.editor.ITextModel,
    lineNumber: number,
    attribute: ParseAttribute | null = null
) : void => {
    modifyJSDocAttribute(model, lineNumber, attribute, 'add');
};

/**
 * Add `@attribute` and `@range` tags to a member for slider functionality
 * @param {Monaco.editor.ITextModel} model - The text model
 * @param {number} lineNumber - The line number of the member
 * @param {string} memberName - The name of the member
 * @param {ParseAttribute} attribute - The attribute object with JSDoc positioning
 */
const addSliderAttributeToMember = (
    model: Monaco.editor.ITextModel,
    lineNumber: number,
    attribute: ParseAttribute | null = null
) => {
    modifyJSDocAttribute(model, lineNumber, attribute, 'addSlider');
};

/**
 * Remove `@attribute` tag from a member using JSDoc position information
 * @param {Monaco.editor.ITextModel} model - The text model
 * @param {number} lineNumber - The line number of the member
 * @param {string} memberName - The name of the member
 * @param {ParseAttribute} attribute - The attribute object with JSDoc positioning
 */
const removeAttributeFromMember = (
    model: Monaco.editor.ITextModel,
    lineNumber: number,
    attribute: ParseAttribute | null = null
) => {
    modifyJSDocAttribute(model, lineNumber, attribute, 'remove');
};

editor.once('load', () => {

    // start worker client
    const workerClient = new WorkerClient(`${config.url.frontend}js/esm-script.worker.js`);
    workerClient.once('init', async () => {
        // get Playcanvas Types
        const types = await fetchTypes(config.url.engine);

        // file cache
        const fileCache = new Map();

        // model dirty flags
        const modelDirtyFlags = new Map();
        // model timeout storage
        const modelTimeouts = new Map();

        // attribute sequence number
        let asn = 0;

        // busy flag
        let busy = false;

        // attributes handler
        workerClient.on('attributes:get', (currAsn, uri, attributes, errors) => {
            // discard old requests
            if (asn !== currAsn) {
                return;
            }

            // get model from uri
            const url = monaco.Uri.parse(uri);
            const model = monaco.editor.getModel(url);
            if (!model) {
                return;
            }

            // Store attributes for code lens provider
            modelAttributes.set(model, attributes);

            // Set busy to false so code lens provider can work
            busy = false;

            // Handle errors only (no markers for attributes since we use code lenses)
            if (errors && errors.length > 0) {
                // Store errors with fixes for code actions
                const errorsWithFixes = errors.filter(error => error.fix);
                if (errorsWithFixes.length > 0) {
                    modelMarkersWithFixes.set(model, errorsWithFixes);
                }

                monaco.editor.setModelMarkers(model, OWNER, errors);
            } else {
                // Clear any existing markers
                monaco.editor.setModelMarkers(model, OWNER, []);
                modelMarkersWithFixes.delete(model);
            }

            // Set up model disposal listeners only once
            if (!modelDirtyFlags.has(model)) {
                model.onWillDispose(() => {
                    modelAttributes.delete(model);
                    modelMarkersWithFixes.delete(model);
                    modelDirtyFlags.delete(model);
                    clearTimeout(modelTimeouts.get(model));
                    modelTimeouts.delete(model);
                    lastKnownLenses.delete(model);
                });
            }

            // Fire code lens change event to refresh code lenses
            codeLensChangeEmitter.fire(null);
        });

        /**
         * Send a request to fetch attributes for a given model
         *
         * @param {Monaco.editor.IModel} model - The model
         */
        const fetchAttributes = async (model) => {
            if (model.isDisposed()) {
                return;
            }

            // get model content
            const uri = model.uri.toString();
            const value = model.getValue();

            // fetch scripts
            const asset = editor.call('view:asset', model.id);
            const path = editor.call('assets:virtualPath', asset);
            const [scripts, deletedFiles] = await fetchModuleScripts(fileCache, [path]);
            scripts.push([path, value]);
            scripts.push(['/playcanvas.d.ts', types]);

            // submit request
            workerClient.send('attributes:get', ++asn, uri, path, scripts, deletedFiles);
            busy = true;
        };

        // Store parsed attributes for code lens
        const modelAttributes = new Map();

        // Store markers with fixes for code actions
        const modelMarkersWithFixes = new Map();

        // Cache last-known lenses per model to avoid flicker when busy
        const lastKnownLenses = new Map();

        // Helper to convert an active lens into an inactive (no-op) lens
        const toInactiveLens = lens => ({
            ...lens,
            command: lens.command ? { id: 'attribute-autofill:inactive', title: lens.command.title } : undefined
        });

        // Create an event emitter for code lens changes
        const codeLensChangeEmitter = new monaco.Emitter();

        // register code lens provider
        monaco.languages.registerCodeLensProvider('javascript', {
            // @ts-ignore - Monaco types are overly strict about IEvent<CodeLensProvider>
            onDidChange: codeLensChangeEmitter.event,
            provideCodeLenses: (model, _token) => {

                // While busy analyzing, keep previous lenses visible (as inactive) to avoid flicker
                if (busy) {
                    const cached = lastKnownLenses.get(model);
                    if (cached?.inactive) {
                        return cached.inactive;
                    }
                    if (cached?.active) {
                        return cached.active;
                    }
                    return NULL_EDIT_PROVIDER;
                }

                const attributes = modelAttributes.get(model);

                // If we have no attributes yet, keep showing last-known lenses (active)
                if (!attributes) {
                    const cached = lastKnownLenses.get(model);
                    if (cached?.active) {
                        return cached.active;
                    }
                    return NULL_EDIT_PROVIDER;
                }

                const lenses = [];

                // Process all parsed attributes
                for (const className in attributes) {
                    const classAttributes = attributes[className];

                    for (const attribute of classAttributes) {
                        // Assume we have the correct attribute data from the worker
                        const memberName = attribute.name || `member_line_${attribute.start.line}`;

                        // Skip private members if the attribute has a name property
                        if (memberName.startsWith('#') || memberName.startsWith('_')) {
                            continue;
                        }

                        // Use the worker-provided positioning for code lens placement
                        const lensLine = attribute.start.line;

                        const lens = {
                            range: {
                                startLineNumber: lensLine,
                                startColumn: 1,
                                endLineNumber: lensLine,
                                endColumn: 1
                            },
                            id: `attribute-${attribute.start.line}`,
                            command: {
                                id: attribute.isAttribute ? 'removeAttribute' : 'makeAttribute',
                                title: attribute.isAttribute ? 'Remove Attribute' : 'Make Attribute',
                                arguments: [model.uri, attribute.start.line, attribute]
                            }
                        };

                        lenses.push(lens);

                        // Add "Make Slider Attribute" lens for number types (only if not already an attribute)
                        if (!attribute.isAttribute && attribute.type === 'number') {
                            const sliderLens = {
                                range: {
                                    startLineNumber: lensLine,
                                    startColumn: 1,
                                    endLineNumber: lensLine,
                                    endColumn: 1
                                },
                                id: `slider-attribute-${attribute.start.line}`,
                                command: {
                                    id: 'makeSliderAttribute',
                                    title: 'Make Slider Attribute',
                                    arguments: [model.uri, attribute.start.line, attribute]
                                }
                            };
                            lenses.push(sliderLens);
                        }
                    }
                }

                const active = { lenses, dispose: () => {} };
                const inactive = { lenses: lenses.map(toInactiveLens), dispose: () => {} };
                lastKnownLenses.set(model, { active, inactive });

                return active;
            }
        });


        // Register a no-op command for inactive lenses shown while updating
        monaco.editor.registerCommand('attribute-autofill:inactive', () => {});

        // Register commands for the code lens actions
        monaco.editor.registerCommand('makeAttribute', async (accessor, uri, lineNumber, attribute) => {
            const model = monaco.editor.getModel(uri);
            if (model) {
                addAttributeToMember(model, lineNumber, attribute);

                // Force immediate re-fetch of attributes to update code lens positions
                modelDirtyFlags.set(model, true);
                clearTimeout(modelTimeouts.get(model));
                await fetchAttributes(model);
                modelDirtyFlags.set(model, false);

                // Fire the code lens change event to trigger refresh
                codeLensChangeEmitter.fire(null);
            }
        });

        monaco.editor.registerCommand('removeAttribute', async (accessor, uri, lineNumber, attribute) => {
            const model = monaco.editor.getModel(uri);
            if (model) {
                removeAttributeFromMember(model, lineNumber, attribute);

                // Force immediate re-fetch of attributes to update code lens positions
                clearTimeout(modelTimeouts.get(model));
                modelDirtyFlags.set(model, true);
                await fetchAttributes(model);
                modelDirtyFlags.set(model, false);
            }
        });

        monaco.editor.registerCommand('makeSliderAttribute', async (accessor, uri, lineNumber, attribute) => {
            const model = monaco.editor.getModel(uri);
            if (model) {
                addSliderAttributeToMember(model, lineNumber, attribute);

                // Force immediate re-fetch of attributes to update code lens positions;
                modelDirtyFlags.set(model, true);
                clearTimeout(modelTimeouts.get(model));
                await fetchAttributes(model);
                modelDirtyFlags.set(model, false);
            }
        });

        /**
         * Register a code action provider for error fixes
         */
        monaco.languages.registerCodeActionProvider('javascript', {
            provideCodeActions: (model) => {

                const actions = [];

                if (!busy) {
                    // Get all markers for this model, not just context markers
                    const allMarkers = monaco.editor.getModelMarkers({ owner: OWNER });
                    const modelMarkers = allMarkers.filter(marker => marker.resource.toString() === model.uri.toString());

                    modelMarkers.forEach((marker: Monaco.editor.IMarker) => {
                        // Process any provided fixes for the marker (both errors and warnings)
                        const markersWithFixes = modelMarkersWithFixes.get(model);
                        if (markersWithFixes) {
                            // Match by position instead of message for more reliable matching
                            const error = markersWithFixes.find(error => (
                                error.startLineNumber === marker.startLineNumber &&
                                error.startColumn === marker.startColumn &&
                                error.endLineNumber === marker.endLineNumber &&
                                error.endColumn === marker.endColumn));

                            if (error?.fix) {
                                actions.push(buildFixAction(model, marker, error.fix));
                            }
                        }
                    });
                }

                return {
                    actions,
                    dispose: async () => {
                        // No cleanup needed - this provider doesn't hold persistent resources
                    }
                };
            }
        });

        /**
         * Initialize the request for a given model
         *
         * @param {string} assetId - The asset id
         */
        const init = async (assetId) => {
            if (!assetId) {
                return;
            }
            const model = /** @type {Monaco.editor.ITextModel} */ (editor.call('views:get', assetId));
            if (!model) {
                // FIXME: View is not defined sometimes
                console.warn('No view found with id:', assetId);
                return;
            }

            // check if module
            const name = editor.call('assets:get', assetId).get('name') ?? '';
            if (!/\.mjs$/.test(name)) {
                return;
            }

            // make initial request
            await fetchAttributes(model);

            // listen for changes
            if (!modelDirtyFlags.has(model)) {
                modelDirtyFlags.set(model, false);
                model.onDidChangeContent(() => {
                    modelDirtyFlags.set(model, true);

                    // Debounce the refetch to avoid too many requests
                    clearTimeout(modelTimeouts.get(model));
                    modelTimeouts.set(model, setTimeout(async () => {
                        if (modelDirtyFlags.get(model)) {
                            await fetchAttributes(model);
                            modelDirtyFlags.set(model, false);
                        }
                    }, 1000));
                });

                // Listen for model disposal to clean up the dirty flag
                model.onWillDispose(() => {
                    clearTimeout(modelTimeouts.get(model));
                    modelTimeouts.delete(model);
                    modelDirtyFlags.delete(model);
                });
            }
        };

        init(editor.call('documents:getFocused'));
        editor.on('documents:focus', assetId => init(assetId));
    });

    workerClient.once('ready', () => workerClient.send('init', config.url.frontend));
    workerClient.start();

    window.addEventListener('beforeunload', () => {
        workerClient.stop();
    });
});
