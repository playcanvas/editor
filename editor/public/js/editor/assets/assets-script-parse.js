editor.once('load', function() {
    'use strict';

    if (editor.call('settings:project').get('useLegacyScripts'))
        return;


    // parse script file and its attributes
    // update attributes accordingly


    editor.method('scripts:parse', function(asset, fn) {
        editor.call('status:text', `Parsing script asset '${asset.get('name')}'...`);

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

                    // early exit if there are parsing errors. user has to fix
                    // errors and reparse
                    if (result.scriptsInvalid && result.scriptsInvalid.length) {
                        editor.call('status:error', `There was an error while parsing script asset '${asset.get('name')}'`);
                        fn(null, result);
                        return;
                    }
                    for (const key in result.scripts)  {
                        if (result.scripts[key].attributesInvalid && result.scripts[key].attributesInvalid.length) {
                            editor.call('status:error', `There was an error while parsing script asset '${asset.get('name')}'`);
                            fn(null, result);
                            return;
                        }
                    }

                    var scripts = asset.get('data.scripts');

                    asset.history.enabled = false;

                    // loading screen?
                    if (result.loading !== asset.get('data.loading'))
                        asset.set('data.loading', result.loading);

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
                        var attributesOrder = result.scripts[key].attributesOrder;

                        if (! script) {
                            // new script
                            asset.set('data.scripts.' + key, {
                                'attributesOrder': attributesOrder || [ ],
                                'attributes': attributes
                            });
                        } else {
                            // change attributes
                            for(var attr in attributes) {
                                if (! attributes.hasOwnProperty(attr) || ! script.attributes.hasOwnProperty(attr))
                                    continue;

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

                                var ind = attributesOrder.indexOf(attr);
                                asset.set('data.scripts.' + key + '.attributes.' + attr, attributes[attr]);
                                asset.insert('data.scripts.' + key + '.attributesOrder', attr, ind);
                            }

                            // TODO scritps2
                            // move attribute
                            var attrIndex = { };
                            for(var i = 0; i < attributesOrder.length; i++)
                                attrIndex[attributesOrder[i]] = i;

                            var scriptAttributeOrder = asset.get('data.scripts.' + key + '.attributesOrder');
                            var i = scriptAttributeOrder.length;
                            while(i--) {
                                var attr = scriptAttributeOrder[i];
                                var indOld = asset.get('data.scripts.' + key + '.attributesOrder').indexOf(attr);
                                var indNew = attrIndex[attr];
                                if (indOld !== indNew)
                                    asset.move('data.scripts.' + key + '.attributesOrder', indOld, indNew);
                            }
                        }
                    }

                    asset.history.enabled = true;

                    editor.call('status:clear');
                    if (fn) fn(null, result);
                    break;
            }
        };

        worker.onerror = function(err) {
            editor.call('status:error', 'There was an error while parsing a script');
            console.log('worker onerror', err);
            if (fn) fn(err);
        };

        worker.postMessage({
            name: 'parse',
            asset: asset.get('id'),
            url: asset.get('file.url'),
            engine: config.url.engine
        });
    });
});
