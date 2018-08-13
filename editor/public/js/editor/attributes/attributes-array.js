editor.once('load', function () {
    'use strict';

    var defaults = {
        checkbox: false,
        number: 0,
        string: '',
        json: '{ }',
        asset: null,
        entity: null,
        rgb: [ 1, 1, 1 ],
        vec2: [ 0, 0 ],
        vec3: [ 0, 0, 0 ],
        vec4: [ 0, 0, 0, 0 ],
        curveset: { keys: [ 0, 0 ], type: 2 }
    };

    // Creates an array widget
    editor.method('attributes:addArrayField', function (args) {
        var events = [];

        var suspendSizeEvents = false;

        var arrayElements = [];
        var timeoutRefreshElements = null;

        var panel = new ui.Panel();
        panel.class.add('attributes-array');
        panel.flex = true;
        panel.flexGrow = 1;

        editor.call('attributes:addField', {
            panel: args.panel,
            name: args.name,
            type: 'element',
            element: panel
        });

        panel.parent.flex = true;

        // create array length observer for each link
        // in order to hook it up with the size field
        var sizeObservers = [];
        args.link.forEach(function (link, i) {
            var path = pathAt(args, i);
            var arr = link.get(path);
            var len = arr ? arr.length : 0;

            var observer = new Observer({
                size: len
            });

            sizeObservers.push(observer);
        });

        // The number of elements in the array
        var fieldSize = editor.call('attributes:addField', {
            parent: panel,
            type: 'number',
            placeholder: 'Array Size',
            link: sizeObservers,
            path: 'size'
        });

        // do not use default number field history
        fieldSize._stopHistory = true;

        fieldSize.parent.flexGrow = 1;

        fieldSize.on('change', function (value) {
            // check fieldSize._changing otherwise this will
            // cause changeArraySize to be called twice - once in
            // this function and once in the link event handlers
            if (suspendSizeEvents || fieldSize._changing) return;
            changeArraySize(value);
        });

        // container for array elements
        var panelElements = new ui.Panel();
        panelElements.class.add('attributes-array-elements');
        panelElements.flex = true;
        panelElements.flexGrow = 1;
        panel.append(panelElements);

        var refreshArrayElements = function () {
            timeoutRefreshElements = null;

            // currently curves do not support multiselect
            if (args.type === 'curveset' && args.link.length > 1) {
                return;
            }

            // destroy existing elements
            arrayElements.forEach(function (field) {
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

            var allArrays = args.link.map(function (link, i) {
                return link.get(pathAt(args, i));
            });

            var row = -1;
            var rowExistsEverywhere = true;

            var createRow = function (row) {
                var paths = args.link.map(function (link, i) {return pathAt(args, i) + '.' + row;});

                var fieldArgs = {
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

                var field = editor.call('attributes:addField', fieldArgs);
                arrayElements.push(field);

                // button to remove array element
                var btnRemove = new ui.Button({
                    text: '&#57636;',
                    unsafe: true
                });
                btnRemove.class.add('delete');

                var fieldParent = Array.isArray(field) ? field[0].parent : field.parent;
                fieldParent.append(btnRemove);

                btnRemove.on('click', function () {
                    var prev;

                    var redo = function () {
                        prev = new Array(args.link.length);

                        // store previous array
                        args.link.forEach(function (link, i) {
                            // get link again in case it changed
                            if (link.history.getItemFn) {
                                link = link.history.getItemFn();
                            }

                            if (! link) return;

                            // store previous array
                            var path = pathAt(args, i);
                            var arr = link.get(path);
                            prev[i] = arr && arr.slice();
                        });

                        args.link.forEach(function (link, i) {
                            if (! prev[i]) return;

                            // get link again in case it changed
                            if (link.history.getItemFn) {
                                link = link.history.getItemFn();
                            }

                            if (! link) return;

                            // copy array and remove
                            // the element at the relevant row
                            var arr = prev[i].slice();
                            arr.splice(row, 1);

                            // set new value
                            var history = link.history.enabled;
                            link.history.enabled = false;

                            if (typeof(arr[0]) === 'object') {
                                link.set(pathAt(args, i), []);
                                arr.forEach(function (element) {
                                    link.insert(pathAt(args, i), element);
                                });
                            } else {
                                link.set(pathAt(args, i), arr);
                            }

                            link.history.enabled = history;
                        });
                    };

                    var undo = function () {
                        args.link.forEach(function (link, i) {
                            if (! prev[i]) return;

                            // get link again in case it changed
                            if (link.history.getItemFn) {
                                link = link.history.getItemFn();
                            }

                            if (! link) return;

                            var path = pathAt(args, i);

                            // set previous value
                            var history = link.history.enabled;
                            link.history.enabled = false;

                            var arr = prev[i];
                            if (typeof(arr[0]) === 'object') {
                                link.set(pathAt(args, i), []);
                                arr.forEach(function (element) {
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

                    editor.call('history:add', {
                        name: 'delete array element',
                        undo: undo,
                        redo: redo
                    });
                });
            };

            while (rowExistsEverywhere) {
                row++;

                for (var i = 0; i < allArrays.length; i++) {
                    if (! allArrays[i] || (! (allArrays[i] instanceof Array)) || allArrays[i].length <= row) {
                        rowExistsEverywhere = false;
                        break;
                    }
                }

                if (rowExistsEverywhere) {
                    createRow(row);
                }
            }
        };

        var refreshArrayElementsDeferred = function () {
            if (timeoutRefreshElements) {
                clearTimeout(timeoutRefreshElements);
            }

            timeoutRefreshElements = setTimeout(refreshArrayElements);
        };

        refreshArrayElements();

        // register event listeners for array
        args.link.forEach(function (link, i) {
            var path = pathAt(args, i);

            var updateSize = function () {
                var value = link.get(path);
                var suspend = suspendSizeEvents;
                suspendSizeEvents = true;
                sizeObservers[i].set('size', value ? value.length : 0);
                suspendSizeEvents = suspend;

                refreshArrayElementsDeferred();
            };

            events.push(link.on(path + ':set', updateSize));
            events.push(link.on(path + ':insert', updateSize));
            events.push(link.on(path + ':remove', updateSize));
        });

        // Clean up
        panel.on('destroy', function () {
            events.forEach(function (evt) {
                evt.unbind();
            });

            events.length = 0;
        });

        // Undoable action - change the size of the array of each link
        var changeArraySize = function (size) {
            var prev;

            var redo = function () {
                var suspend = suspendSizeEvents;
                suspendSizeEvents = true;

                prev = new Array(args.link.length);

                // store previous array
                // do this first so that prev has valid
                // values for all entries in case we need to
                // undo a half-completed redo
                args.link.forEach(function (link, i) {
                    // get link again in case it changed
                    if (link.history.getItemFn) {
                        link = link.history.getItemFn();
                    }

                    if (! link) return;

                    // store previous array
                    var path = pathAt(args, i);
                    var arr = link.get(path);
                    prev[i] = arr && arr.slice();
                });

                args.link.forEach(function (link, i) {
                    if (! prev[i]) return;

                    // get link again in case it changed
                    if (link.history.getItemFn) {
                        link = link.history.getItemFn();
                    }

                    if (! link) return;

                    // resize array
                    var arr = prev[i].slice();
                    while (arr.length < size) {
                        arr.push(getDefaultValue(args));
                    }
                    arr.length = size;

                    // set new value
                    var history = link.history.enabled;
                    link.history.enabled = false;

                    if (typeof(arr[0]) === 'object') {
                        link.set(pathAt(args, i), []);
                        arr.forEach(function (element) {
                            link.insert(pathAt(args, i), element);
                        });
                    } else {
                        link.set(pathAt(args, i), arr);
                    }

                    link.history.enabled = history;
                });

                suspendSizeEvents = suspend;
            };

            var undo = function () {
                var suspend = suspendSizeEvents;
                suspendSizeEvents = true;

                args.link.forEach(function (link, i) {
                    if (! prev[i]) return;

                    // get link again in case it changed
                    if (link.history.getItemFn) {
                        link = link.history.getItemFn();
                    }

                    if (! link) return;

                    var path = pathAt(args, i);

                    // set previous value
                    var history = link.history.enabled;
                    link.history.enabled = false;

                    var arr = prev[i];
                    if (typeof(arr[0]) === 'object') {
                        link.set(pathAt(args, i), []);
                        arr.forEach(function (element) {
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

            editor.call('history:add', {
                name: 'edit array size',
                redo: redo,
                undo: undo
            });

            redo();
        };

        return panel;
    });

    // Returns path at index of args.paths if that field exists otherwise
    // returns args.path
    var pathAt = function (args, index) {
        return args.paths ? args.paths[index] : args.path;
    };

    // Returns the default value for a new array element
    // based on the args provided
    var getDefaultValue = function (args) {
        var result = null;

        if (defaults[args.type] !== undefined) {
            result = defaults[args.type];

            if (args.type === 'curveset') {
                result = utils.deepCopy(result);
                if (args.color || args.curves) {
                    var len = args.color ? args.color.length : args.curves.length;
                    if (len > 1) {
                        result.keys = [ ];
                        for(var c = 0; c < len; c++) {
                            result.keys.push([ 0, 0 ]);
                        }

                    }
                }
            }
        }

        return result;
    };

});
