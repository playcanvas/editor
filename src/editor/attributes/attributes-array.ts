import { Observer } from '@playcanvas/observer';

import { LegacyButton } from '@/common/ui/button';
import { LegacyPanel } from '@/common/ui/panel';
import { deepCopy } from '@/common/utils';

editor.once('load', () => {
    const defaults = {
        checkbox: false,
        number: 0,
        string: '',
        json: '{ }',
        asset: null,
        entity: null,
        rgb: [1, 1, 1],
        vec2: [0, 0],
        vec3: [0, 0, 0],
        vec4: [0, 0, 0, 0],
        curveset: { keys: [0, 0], type: 2 }
    };

    // Returns path at index of args.paths if that field exists otherwise
    // returns args.path
    const pathAt = function (args: { path?: string; paths?: string[] }, index: number) {
        return args.paths ? args.paths[index] : args.path;
    };

    // Creates an array widget
    editor.method('attributes:addArrayField', (args) => {
        const events = [];

        let suspendSizeEvents = false;

        const arrayElements = [];
        let timeoutRefreshElements = null;

        const panel = new LegacyPanel();
        panel.class.add('attributes-array');
        panel.flex = true;
        panel.flexGrow = 1;

        editor.call('attributes:addField', {
            panel: args.panel,
            name: args.name,
            type: 'element',
            element: panel
        });

        if (args.canOverrideTemplate && (args.path || args.paths)) {
            editor.call('attributes:registerOverridePath', pathAt(args, 0), args.panel ? args.panel.element : panel.element);
        }

        panel.parent.flex = true;

        // create array length observer for each link
        // in order to hook it up with the size field
        const sizeObservers = [];
        args.link.forEach((link, i) => {
            const path = pathAt(args, i);
            const arr = link.get(path);
            const len = arr ? arr.length : 0;

            const observer = new Observer({
                size: len
            });

            sizeObservers.push(observer);
        });

        // The number of elements in the array
        const fieldSize = editor.call('attributes:addField', {
            parent: panel,
            type: 'number',
            placeholder: 'Array Size',
            link: sizeObservers,
            path: 'size',
            stopHistory: true // do not use default number field history
        });

        fieldSize.parent.flexGrow = 1;

        fieldSize.on('change', (value) => {
            // check fieldSize._changing otherwise this will
            // cause changeArraySize to be called twice - once in
            // this function and once in the link event handlers
            if (suspendSizeEvents || fieldSize._changing) {
                return;
            }
            changeArraySize(value);
        });

        // container for array elements
        const panelElements = new LegacyPanel();
        panelElements.class.add('attributes-array-elements');
        panelElements.flex = true;
        panelElements.flexGrow = 1;
        panel.append(panelElements);

        const refreshArrayElements = function () {
            timeoutRefreshElements = null;

            // currently curves do not support multiselect
            if (args.type === 'curveset' && args.link.length > 1) {
                return;
            }

            // destroy existing elements
            arrayElements.forEach((field) => {
                // field might be an array like for vectors
                if (field instanceof Array) {
                    // check if parent exists because might
                    // have already been destroyed when parsing script attributes for example
                    if (field[0].parent) {
                        field[0].parent.destroy();
                    }
                } else {
                    if (field.parent) {
                        field.parent.destroy();
                    }
                }
            });
            arrayElements.length = 0;

            const allArrays = args.link.map((link, i) => {
                return link.get(pathAt(args, i));
            });

            let row = -1;
            let rowExistsEverywhere = true;

            const createRow = function (row: number) {
                const paths = args.link.map((link, i) => {
                    return `${pathAt(args, i)}.${row}`;
                });

                const fieldArgs = {
                    parent: panelElements,
                    type: args.type,
                    link: args.link,
                    placeholder: args.placeholder,
                    reference: args.reference,
                    kind: args.kind,
                    enum: args.enum,
                    curves: args.curves,
                    gradient: args.gradient,
                    min: args.min,
                    max: args.max,
                    hideRandomize: args.hideRandomize,
                    paths: paths
                };

                const field = editor.call('attributes:addField', fieldArgs);
                arrayElements.push(field);

                // button to remove array element
                const btnRemove = new LegacyButton({
                    text: '&#57636;',
                    unsafe: true
                });
                btnRemove.class.add('delete');

                const fieldParent = Array.isArray(field) ? field[0].parent : field.parent;
                fieldParent.append(btnRemove);

                btnRemove.on('click', () => {
                    let prev;

                    const redo = function () {
                        prev = new Array(args.link.length);

                        // store previous array
                        args.link.forEach((link, i) => {
                            // get link again in case it changed
                            link = link.latest();

                            if (!link) {
                                return;
                            }

                            // store previous array
                            const path = pathAt(args, i);
                            const arr = link.get(path);
                            prev[i] = arr && arr.slice();
                        });

                        args.link.forEach((link, i) => {
                            if (!prev[i]) {
                                return;
                            }

                            // get link again in case it changed
                            link = link.latest();

                            if (!link) {
                                return;
                            }

                            // copy array and remove
                            // the element at the relevant row
                            const arr = prev[i].slice();
                            arr.splice(row, 1);

                            // set new value
                            const history = link.history.enabled;
                            link.history.enabled = false;

                            if (arr[0] !== null && typeof arr[0] === 'object') {
                                link.set(pathAt(args, i), []);
                                arr.forEach((element) => {
                                    link.insert(pathAt(args, i), element);
                                });
                            } else {
                                link.set(pathAt(args, i), arr);
                            }

                            link.history.enabled = history;
                        });
                    };

                    const undo = function () {
                        args.link.forEach((link, i) => {
                            if (!prev[i]) {
                                return;
                            }

                            // get link again in case it changed
                            link = link.latest();

                            if (!link) {
                                return;
                            }

                            // set previous value
                            const history = link.history.enabled;
                            link.history.enabled = false;

                            const arr = prev[i];
                            if (arr[0] !== null && typeof arr[0] === 'object') {
                                link.set(pathAt(args, i), []);
                                arr.forEach((element) => {
                                    link.insert(pathAt(args, i), element);
                                });
                            } else {
                                link.set(pathAt(args, i), arr);
                            }

                            link.history.enabled = history;
                        });

                        // clean up
                        prev.length = 0;
                    };

                    redo();

                    editor.api.globals.history.add({
                        name: 'delete array element',
                        combine: false,
                        undo: undo,
                        redo: redo
                    });
                });
            };

            while (rowExistsEverywhere) {
                row++;

                for (let i = 0; i < allArrays.length; i++) {
                    if (!allArrays[i] || (!(allArrays[i] instanceof Array)) || allArrays[i].length <= row) {
                        rowExistsEverywhere = false;
                        break;
                    }
                }

                if (rowExistsEverywhere) {
                    createRow(row);
                }
            }
        };

        const refreshArrayElementsDeferred = function () {
            if (timeoutRefreshElements) {
                clearTimeout(timeoutRefreshElements);
            }

            timeoutRefreshElements = setTimeout(refreshArrayElements);
        };

        refreshArrayElements();

        // register event listeners for array
        args.link.forEach((link, i) => {
            const path = pathAt(args, i);

            const updateSize = function () {
                const value = link.get(path);
                const suspend = suspendSizeEvents;
                suspendSizeEvents = true;
                sizeObservers[i].set('size', value ? value.length : 0);
                suspendSizeEvents = suspend;

                refreshArrayElementsDeferred();
            };

            events.push(link.on(`${path}:set`, updateSize));
            events.push(link.on(`${path}:insert`, updateSize));
            events.push(link.on(`${path}:remove`, updateSize));
        });

        // Clean up
        panel.on('destroy', () => {
            events.forEach((evt) => {
                evt.unbind();
            });

            events.length = 0;
        });

        // Undoable action - change the size of the array of each link
        var changeArraySize = function (size: number) {
            let prev;

            const redo = function () {
                const suspend = suspendSizeEvents;
                suspendSizeEvents = true;

                prev = new Array(args.link.length);

                // store previous array
                // do this first so that prev has valid
                // values for all entries in case we need to
                // undo a half-completed redo
                args.link.forEach((link, i) => {
                    // get link again in case it changed
                    link = link.latest();

                    if (!link) {
                        return;
                    }

                    // store previous array
                    const path = pathAt(args, i);
                    const arr = link.get(path);
                    prev[i] = arr && arr.slice();
                });

                args.link.forEach((link, i) => {
                    if (!prev[i]) {
                        return;
                    }

                    // get link again in case it changed
                    link = link.latest();

                    if (!link) {
                        return;
                    }

                    // resize array
                    const arr = prev[i].slice();
                    while (arr.length < size) {
                        arr.push(getDefaultValue(args));
                    }
                    arr.length = size;

                    // set new value
                    const history = link.history.enabled;
                    link.history.enabled = false;

                    if (arr[0] !== null && typeof arr[0] === 'object') {
                        link.set(pathAt(args, i), []);
                        arr.forEach((element) => {
                            link.insert(pathAt(args, i), element);
                        });
                    } else {
                        link.set(pathAt(args, i), arr);
                    }

                    link.history.enabled = history;
                });

                suspendSizeEvents = suspend;
            };

            const undo = function () {
                const suspend = suspendSizeEvents;
                suspendSizeEvents = true;

                args.link.forEach((link, i) => {
                    if (!prev[i]) {
                        return;
                    }

                    // get link again in case it changed
                    link = link.latest();

                    if (!link) {
                        return;
                    }

                    // set previous value
                    const history = link.history.enabled;
                    link.history.enabled = false;

                    const arr = prev[i];
                    if (arr[0] !== null && typeof arr[0] === 'object') {
                        link.set(pathAt(args, i), []);
                        arr.forEach((element) => {
                            link.insert(pathAt(args, i), element);
                        });
                    } else {
                        link.set(pathAt(args, i), arr);
                    }

                    link.history.enabled = history;
                });

                // clean up
                prev.length = 0;

                suspendSizeEvents = suspend;
            };

            editor.api.globals.history.add({
                name: 'edit array size',
                combine: false,
                redo: redo,
                undo: undo
            });

            redo();
        };

        return panel;
    });

    // Returns the default value for a new array element
    // based on the args provided
    var getDefaultValue = function (args: { type?: string; color?: unknown[]; curves?: unknown[] }) {
        let result = null;

        if (defaults[args.type] !== undefined) {
            result = defaults[args.type];

            if (args.type === 'curveset') {
                result = deepCopy(result);
                if (args.color || args.curves) {
                    const len = args.color ? args.color.length : args.curves.length;
                    if (len > 1) {
                        result.keys = [];
                        for (let c = 0; c < len; c++) {
                            result.keys.push([0, 0]);
                        }

                    }
                }
            }
        }

        return result;
    };

});
