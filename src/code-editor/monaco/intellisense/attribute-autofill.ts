import { WorkerClient } from '../../../core/worker/worker-client.ts';

/** @import * as Monaco from 'monaco-editor' */
/** @import { Observer } from '@playcanvas/observer' */

/**
 * @typedef {object} ParseError
 * @property {string} file - The file path
 * @property {string} message - The error message
 * @property {number} line - The line number
 * @property {number} column - The column number
 * @property {number} length - The length of the error
 */

/**
 * @typedef {object} ParseAttribute
 * @property {boolean} isAttribute - Whether the attribute is an attribute
 * @property {object} start - The start position
 * @property {number} start.line - The start line number
 * @property {number} start.column - The start column number
 * @property {object} end - The end position
 * @property {number} end.line - The end line number
 * @property {number} end.column - The end column number
 */

const OWNER = 'attribute-autofill';
const CHAR_LIMIT = 1e6;
const ERROR_LIMIT = 1000;
const ATTRIBUTE_LIMIT = 1000;

/**
 * @param {string} url - The engine URL
 * @returns {Promise<string>} - The types source
 */
const fetchTypes = async (url) => {
    const typesURL = url.replace(/(\.min|\.dbg|\.prf)?\.js$/, '.d.ts');
    const res = await fetch(typesURL);
    return await res.text();
};

/**
 * Fetches all ESM scripts
 *
 * @param {Map<string, string>} cache - The file cache
 * @param {string[]} filter - The paths to filter
 * @returns {Promise<[[string, string][], string[]]>} - The scripts and deleted files
 */
const fetchModuleScripts = async (cache, filter = []) => {
    const assets = /** @type {Observer[]} */ (editor.call('assets:list') ?? []);

    // Get all the files that no longer exist. ie files in the cache, but not in esmScripts
    const deletedFiles = [];

    // loop over the file cache, remove any files that do no exist in the script assets
    const assetPaths = assets.map(asset => editor.call('assets:virtualPath', asset));
    for (const filePath in cache) {
        if (!assetPaths.includes(filePath)) {
            deletedFiles.push(filePath);
            cache.delete(filePath);
        }
    }

    const scripts = await Promise.all(assets.reduce((/** @type {Promise<[string, string]>[]} */ acc, asset) => {
        // skip non-module assets
        if (!editor.call('assets:isModule', asset)) {
            return acc;
        }

        // skip filtered paths
        const path = /** @type {string} */ (editor.call('assets:virtualPath', asset));
        if (filter.includes(path)) {
            return acc;
        }

        // skip cached files
        const hash = asset.get('file.hash');
        if (cache.get(path) === hash) {
            return acc;
        }

        // Attempt to fetch the script
        try {
            const url = editor.call('assets:realPath', asset);

            const promise = fetch(url).then(res => res.text()).then((content) => {
                cache.set(path, hash);
                return [path, content];
            });
            acc.push(/** @type {Promise<[string, string]>} */ (promise));
        } catch (e) {
            console.error(`Failed to fetch ESM script ${path}`, e);
        }
        return acc;
    }, []));

    return [scripts, deletedFiles];
};

/**
 * Creates a JSDoc attribute from the tags
 *
 * @param {Record<string, string>} tags - Object with attribute properties
 * @returns {string} JSDoc attribute
 */
const buildJSDoc = (tags) => {
    return [
        '/**',
        ' * @attribute',
        ...Object.keys(tags).map(key => ` * @${key} ${tags[key]}`),
        ' */'
    ].join('\n');
};

/**
 * Builds an error marker from the error object
 *
 * @param {ParseError} error - The error object
 * @returns {Monaco.editor.IMarkerData} - The error marker
 */
const buildErrorMarker = (error) => {
    return {
        severity: monaco.MarkerSeverity.Error,
        message: error.message,
        startLineNumber: error.line,
        startColumn: error.column,
        endLineNumber: error.line,
        endColumn: error.column + error.length
    };
};

/**
 * Builds an attribute marker from the attribute object
 *
 * @param {ParseAttribute} attribute - The attribute object
 * @returns {Monaco.editor.IMarkerData} - The attribute marker
 */
const buildAttributeMarker = (attribute) => {
    return {
        severity: monaco.MarkerSeverity.Hint,
        message: attribute.isAttribute ? 'Property can be reverted from @attribute' : 'Property can be converted to @attribute',
        startLineNumber: attribute.start.line,
        startColumn: attribute.start.column,
        endLineNumber: attribute.end.line,
        endColumn: attribute.end.column,
        source: JSON.stringify(attribute)
    };
};

/**
 * Generates Monaco markers from the attributes and errors
 *
 * @param {string} path - The file path
 * @param {Record<string, ParseAttribute[]>} attributes - The attributes
 * @param {ParseError[]} errors - The errors
 * @returns {Monaco.editor.IMarkerData[] | undefined} - The markers
 */
const buildMarkers = (path, attributes, errors) => {
    const markers = [];
    if (errors.length) {
        if (errors.length > ERROR_LIMIT) {
            console.warn('Too many errors for semantic analysis');
            return;
        }
        errors.forEach((error) => {
            if (error.file !== path) {
                return;
            }
            markers.push(buildErrorMarker(error));
        });
    } else {
        for (const className in attributes) {
            const data = attributes[className];
            if (data.length > ATTRIBUTE_LIMIT) {
                console.warn('Too many attributes for', className);
                continue;
            }
            for (const attribute of data) {
                markers.push(buildAttributeMarker(attribute));
            }
        }
    }
    return markers;
};

/**
 * Builds a create action for the given model, marker and name
 *
 * @param {Monaco.editor.ITextModel} model - The model
 * @param {Monaco.editor.IMarkerData} marker - The marker
 * @param {string} name - The attribute name
 * @returns {Monaco.languages.CodeAction} - The action
 */
const buildCreateAction = (model, marker, name) => {
    // pad the snippet with the line content
    const br = `\n${' '.repeat(marker.startColumn - 1)}`;
    const word = model.getWordAtPosition({
        lineNumber: marker.startLineNumber,
        column: marker.startColumn
    });
    const text = `${ATTRIBUTE_SNIPPETS[name].split('\n').join(br)}${br}${word?.word ?? ''}`;

    return {
        title: `Create ${name} @attribute`,
        kind: 'quickfix',
        edit: {
            edits: [{
                resource: model.uri,
                textEdit: {
                    range: marker,
                    text: text
                },
                versionId: model.getVersionId()
            }]
        }
    };
};

/**
 * Builds a remove action for the given model, marker and name
 *
 * @param {Monaco.editor.ITextModel} model - The model
 * @param {Monaco.editor.IMarkerData} marker - The marker
 * @param {string} name - The attribute name
 * @returns {Monaco.languages.CodeAction} - The action
 */
const buildRemoveAction = (model, marker, name) => {
    return {
        title: 'Remove @attribute',
        kind: 'quickfix',
        edit: {
            edits: [{
                resource: model.uri,
                textEdit: {
                    range: marker,
                    text: name
                },
                versionId: model.getVersionId()
            }]
        }
    };
};


/**
 * Build actions for the given model and context
 *
 * @param {Monaco.editor.ITextModel} model - The model
 * @param {Monaco.languages.CodeActionContext} context - The context
 * @returns {Monaco.languages.CodeAction[]} - The actions
 */
const buildActions = (model, context) => {
    const actions = [];
    context.markers.forEach((/** @type {Monaco.editor.IMarker} */ marker) => {
        if (marker.owner !== OWNER) {
            return;
        }

        // only consider hint markers
        if (marker.severity !== monaco.MarkerSeverity.Hint) {
            return;
        }

        // silently ignore invalid source
        let data = null;
        try {
            data = JSON.parse(marker.source);
        } catch (e) {
            return;
        }

        // check if the attribute is already an attribute
        if (data.isAttribute) {
            actions.push(buildRemoveAction(model, marker, data.name));
            return;
        }

        // check if the attribute is a known type
        for (const name in ATTRIBUTE_SNIPPETS) {
            if (data.type === 'any') {
                actions.push(buildCreateAction(model, marker, name));
                continue;
            }

            if (data.type === 'boolean' && name === 'checkbox') {
                actions.push(buildCreateAction(model, marker, name));
                continue;
            }

            if (data.type === 'number' && (name === 'slider' || name === 'numeric')) {
                actions.push(buildCreateAction(model, marker, name));
                continue;
            }

            if (data.type === 'string' && name === 'text') {
                actions.push(buildCreateAction(model, marker, name));
                continue;
            }

            if (data.type === name) {
                actions.push(buildCreateAction(model, marker, name));
            }
        }
    });

    return actions;
};

const ATTRIBUTE_SNIPPETS = {
    checkbox: buildJSDoc({
        type: '{boolean}'
    }),

    numeric: buildJSDoc({
        type: '{number}'
    }),

    slider: buildJSDoc({
        type: '{number}',
        range: '[0.1, 1]',
        precision: '2',
        step: '0.01'
    }),

    text: buildJSDoc({
        type: '{string}',
        placeholder: 'Enter text'
    }),

    Asset: buildJSDoc({
        type: '{pc.Asset}'
    }),

    Color: buildJSDoc({
        type: '{pc.Color}'
    }),

    Curve: buildJSDoc({
        type: '{pc.Curve}',
        color: 'rgb'
    }),

    Entity: buildJSDoc({
        type: '{pc.Entity}'
    }),

    Vec2: buildJSDoc({
        type: '{pc.Vec2}'
    }),

    Vec3: buildJSDoc({
        type: '{pc.Vec3}'
    }),

    Vec4: buildJSDoc({
        type: '{pc.Vec4}'
    })
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

            // collect markers from response
            const markers = buildMarkers(url.path, attributes, errors);
            if (!markers) {
                return;
            }

            monaco.editor.setModelMarkers(model, OWNER, markers);
            busy = false;
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

            if (value.length > CHAR_LIMIT) {
                console.warn('Too many characters for semantic analysis');
                return;
            }

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

        // register code action provider
        monaco.languages.registerCodeActionProvider('javascript', {
            provideCodeActions: (model, _range, context, _token) => {
                return {
                    actions: busy ? [] : buildActions(model, context),
                    dispose: async () => {
                        // check if the model has been modified
                        if (modelDirtyFlags.get(model)) {
                            modelDirtyFlags.set(model, false);
                            await fetchAttributes(model);
                        }
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
