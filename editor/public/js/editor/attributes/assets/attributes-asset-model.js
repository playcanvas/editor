editor.once('load', function() {
    'use strict';

    var pickMaterial = function(assetId, fn) {
        var asset = editor.call('assets:get', assetId);
        editor.call('picker:asset', 'material', asset);

        var evtPick = editor.once('picker:asset', function(asset) {
            fn(asset.get('id'));
            evtPick = null;
        });

        editor.once('picker:asset:close', function() {
            if (evtPick) {
                evtPick.unbind();
                evtPick = null;
            }
        });
    };

    editor.on('attributes:inspect[asset]', function(assets) {
        if (assets.length !== 1 || assets[0].get('type') !== 'model')
            return;

        var asset = assets[0];

        console.log(asset.json())

        if (asset.get('data.mapping').length) {
            // nodes panel
            var panelNodes = editor.call('attributes:addPanel', {
                name: 'Nodes'
            });
            panelNodes.class.add('component');

            // nodes list
            var nodesList = new ui.List();
            nodesList.selectable = false;
            nodesList.class.add('model-nodes');
            panelNodes.append(nodesList);

            var nodeItems = [ ];

            var createNodeField = function(ind) {
                var fieldNode = new ui.ListItem({
                    text: 'node ' + ind
                });
                nodeItems[ind] = fieldNode;

                // material picker
                var fieldMaterial = new ui.ImageField();

                // once changed, update thumbnail
                fieldMaterial.on('change', function(value) {
                    if (! value)
                        return this.empty = true;

                    this.empty = false;

                    var asset = editor.call('assets:get', value);

                    if (! asset)
                        return this.image = '';

                    if (asset.has('thumbnails')) {
                        this.image = config.url.home + asset.get('thumbnails.m');
                    } else {
                        this.image = '';
                    }
                });

                // call picker
                fieldMaterial.on('click', function() {
                    pickMaterial(fieldMaterial.value, function(assetId) {
                        // set to mapping observer
                        asset.set('data.mapping.' + ind + '.material', assetId);
                    });
                });

                // link field
                fieldMaterial.link(asset, 'data.mapping.' + ind + '.material');
                fieldMaterial.parent = fieldNode;
                fieldNode.element.appendChild(fieldMaterial.element);

                var dropRef = editor.call('drop:target', {
                    ref: fieldMaterial.element,
                    type: 'asset.material',
                    drop: function(type, data) {
                        if (type !== 'asset.material')
                            return;

                        fieldMaterial.value = data.id;
                    }
                });
                fieldMaterial.on('destroy', function() {
                    dropRef.unregister();
                });

                // append to list
                nodesList.append(fieldNode);
            };

            // create node fields
            for(var i = 0; i < asset.get('data.mapping').length; i++) {
                createNodeField(i);
            }

            // template nodes
            var nodesTemplate = function() {
                asset.get('nodes').forEach(function(nodeName, i) {
                    if (! nodeItems[i])
                        return;

                    nodeItems[i].text = nodeName;
                });
                // panelNodes.hidden = false;
            };

            if (asset.has('nodes')) {
                // already loaded
                nodesTemplate();
            } else {
                // loading
                var loading = editor.call('attributes:addField', {
                    type: 'progress'
                });
                loading.on('progress:100', function() {
                    this.destroy();
                });

                // once loaded
                asset.once('nodes:set', nodesTemplate);

                // load data
                Ajax
                .get('{{url.home}}/' + asset.get('file.url'))
                .on('load', function(status, data) {
                    var nodes = [ ];
                    for(var i = 0; i < data.model.nodes.length; i++) {
                        if (data.model.nodes[i].name === 'RootNode')
                            continue;

                        nodes.push(data.model.nodes[i].name);
                    }
                    asset.set('nodes', nodes);

                    loading.progress = 1;
                })
                .on('progress', function(progress) {
                    loading.progress = .1 + progress * .8;
                })
                .on('error', function() {
                    loading.failed = true;

                    var error = new ui.Label({ text: 'failed loading detailed data' });
                    error.textContent = 'failed loading data';
                    error.style.display = 'block';
                    error.style.textAlign = 'center';
                    error.style.fontWeight = '100';
                    error.style.fontSize = '12px';
                    error.style.color = '#f66';
                    editor.call('attributes.rootPanel').append(error);

                    loading.progress = 1;
                })

                loading.progress = .1;
            }
        }
    });

    // selects the specified node index for the specified model
    // - once the user select a material it reselect the entity
    editor.method('attributes:assets:model:select-node', function (modelId, nodeIndex, materialId, entity) {
        var asset = editor.call('assets:get', modelId);
        if (asset) {
            pickMaterial(materialId, function(assetId) {
                // set to mapping observer
                asset.set('data.mapping.' + nodeIndex + '.material', assetId);
            });

            editor.once('picker:asset:close', function() {
                editor.call('selector:add', 'entity', entity);
            });
        }
    });

});
