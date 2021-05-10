editor.once('load', function () {
    'use strict';

    function convertEnum(enumData) {
        // parse enum to different format
        const result = {
            order: [],
            options: {}
        };

        for (let i = 0; i < enumData.length; i++) {
            const key = Object.keys(enumData[i])[0];
            result.order.push(key);
            result.options[key] = enumData[i][key];
        }

        return result;
    }

    // parse script file and its attributes
    // update attributes accordingly
    editor.method('scripts:parse', function (asset, fn) {
        const worker = new Worker('/editor/scene/js/editor/assets/assets-script-parse-worker.js');
        worker.asset = asset;
        worker.progress = 0;

        worker.onmessage = function (evt) {
            if (! evt.data.name)
                return;

            switch (evt.data.name) {
                case 'results':
                    worker.terminate();
                    var result = evt.data.data;

                    var scripts = asset.get('data.scripts');

                    // loading screen?
                    if (result.loading !== asset.get('data.loading'))
                        asset.set('data.loading', result.loading);

                    // remove scripts
                    for (const key in scripts) {
                        if (! scripts.hasOwnProperty(key) || result.scripts.hasOwnProperty(key))
                            continue;

                        asset.unset('data.scripts.' + key);
                    }

                    // add scripts
                    for (const key in result.scripts) {
                        if (! result.scripts.hasOwnProperty(key))
                            continue;

                        var attributes = { };

                        // TODO scripts2
                        // attributes validation

                        for (const attr in result.scripts[key].attributes) {
                            if (! result.scripts[key].attributes.hasOwnProperty(attr))
                                continue;

                            attributes[attr] = Object.assign({}, result.scripts[key].attributes[attr]);

                            if (attributes[attr].enum) {
                                attributes[attr].enum = convertEnum(attributes[attr].enum);
                            }

                            if (Array.isArray(attributes[attr].schema)) {
                                let schemaCopy = null;
                                attributes[attr].schema.forEach((field, index) => {
                                    if (field.enum) {
                                        if (!schemaCopy) {
                                            schemaCopy = attributes[attr].schema.slice();
                                        }
                                        schemaCopy[index] = Object.assign({}, schemaCopy[index]);
                                        schemaCopy[index].enum = convertEnum(field.enum);
                                    }
                                });
                                if (schemaCopy) {
                                    attributes[attr].schema = schemaCopy;
                                }
                            }
                        }

                        var script = asset.get('data.scripts.' + key);
                        var attributesOrder = result.scripts[key].attributesOrder;

                        if (! script) {
                            // new script
                            asset.set('data.scripts.' + key, {
                                'attributesOrder': attributesOrder || [],
                                'attributes': attributes
                            });
                        } else {
                            // change attributes
                            for (const attr in attributes) {
                                if (! attributes.hasOwnProperty(attr) || ! script.attributes.hasOwnProperty(attr))
                                    continue;

                                asset.set('data.scripts.' + key + '.attributes.' + attr, attributes[attr]);
                            }

                            // remove attributes
                            for (const attr in script.attributes) {
                                if (! script.attributes.hasOwnProperty(attr) || attributes.hasOwnProperty(attr))
                                    continue;

                                asset.unset('data.scripts.' + key + '.attributes.' + attr);
                                asset.removeValue('data.scripts.' + key + '.attributesOrder', attr);
                            }

                            // add attributes
                            for (const attr in attributes) {
                                if (! attributes.hasOwnProperty(attr) || script.attributes.hasOwnProperty(attr))
                                    continue;

                                const ind = attributesOrder.indexOf(attr);
                                asset.set('data.scripts.' + key + '.attributes.' + attr, attributes[attr]);
                                asset.insert('data.scripts.' + key + '.attributesOrder', attr, ind);
                            }

                            // TODO scripts2
                            // move attribute
                            const attrIndex = { };
                            for (let i = 0; i < attributesOrder.length; i++) {
                                attrIndex[attributesOrder[i]] = i;
                            }

                            const scriptAttributeOrder = asset.get('data.scripts.' + key + '.attributesOrder');
                            let i = scriptAttributeOrder.length;
                            while (i--) {
                                const attr = scriptAttributeOrder[i];
                                const indOld = asset.get('data.scripts.' + key + '.attributesOrder').indexOf(attr);
                                const indNew = attrIndex[attr];
                                if (indOld !== indNew)
                                    asset.move('data.scripts.' + key + '.attributesOrder', indOld, indNew);
                            }
                        }
                    }

                    if (fn) fn(null, result);
                    break;
            }
        };

        worker.onerror = function (err) {
            console.log('worker onerror', err);
            if (fn) fn(err);
        };

        worker.postMessage({
            name: 'parse',
            asset: asset.get('id'),
            url: '/api/assets/' + asset.get('id') + '/file/' + encodeURIComponent(asset.get('file.filename')).appendQuery('branchId=' + config.self.branch.id),
            engine: config.url.engine
        });
    });
});
