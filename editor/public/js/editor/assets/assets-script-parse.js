editor.once('load', function() {
    'use strict';

    if (editor.call('project:settings').get('use_legacy_scripts'))
        return;


    // parse script file and its attributes
    // update attributes accordingly


    editor.method('scripts:parse', function(asset, fn) {
        var worker = new Worker('/editor/scene/js/editor/assets/assets-script-parse-worker.js');
        worker.asset = asset;
        worker.progress = 0;

        worker.onmessage = function(evt) {
            if (! evt.data.name)
                return;

            switch(evt.data.name) {
                case 'results':
                    worker.terminate();
                    var result = evt.data.data;

                    var scripts = asset.get('data.scripts');

                    asset.history.enabled = false;

                    // remove scripts
                    for(var key in scripts) {
                        if (! scripts.hasOwnProperty(key) || result.scripts.hasOwnProperty(key))
                            continue;

                        asset.unset('data.scripts.' + key);
                    }

                    // add scripts
                    for(var key in result.scripts) {
                        if (! result.scripts.hasOwnProperty(key))
                            continue;

                        var attributes = { };

                        // TODO scripts2
                        // attributes validation

                        for(var attr in result.scripts[key].attributes) {
                            if (! result.scripts[key].attributes.hasOwnProperty(attr))
                                continue;

                            attributes[attr] = result.scripts[key].attributes[attr];
                        }

                        var script = asset.get('data.scripts.' + key);

                        if (! script) {
                            // new script
                            asset.set('data.scripts.' + key, {
                                'attributesOrder': result.scripts[key].attributesOrder || [ ],
                                'attributes': attributes
                            });
                        } else {
                            // change attributes
                            for(var attr in attributes) {
                                if (! attributes.hasOwnProperty(attr) || ! script.attributes.hasOwnProperty(attr))
                                    continue;

                                console.log(key, attr, attributes[attr])
                                asset.set('data.scripts.' + key + '.attributes.' + attr, attributes[attr]);
                            }

                            // remove attributes
                            for(var attr in script.attributes) {
                                if (! script.attributes.hasOwnProperty(attr) || attributes.hasOwnProperty(attr))
                                    continue;

                                asset.unset('data.scripts.' + key + '.attributes.' + attr);
                                asset.removeValue('data.scripts.' + key + '.attributesOrder', attr);
                            }

                            // add attributes
                            for(var attr in attributes) {
                                if (! attributes.hasOwnProperty(attr) || script.attributes.hasOwnProperty(attr))
                                    continue;

                                asset.set('data.scripts.' + key + '.attributes.' + attr, attributes[attr]);
                                asset.insert('data.scripts.' + key + '.attributesOrder', attr);
                            }
                        }
                    }

                    asset.history.enabled = true;

                    if (fn) fn(null, result);
                    break;
            }
        };

        worker.onerror = function(err) {
            console.log('worker onerror', err);
            if (fn) fn(err);
        };

        worker.postMessage({
            name: 'parse',
            asset: asset.get('id'),
            url: asset.get('file.url')
        });
    });
});
