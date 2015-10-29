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

    var panelNodes = null;

    editor.method('attributes:asset:model:nodesPanel', function () {
        return panelNodes;
    });

    editor.on('attributes:inspect[asset]', function(assets) {
        if (assets.length !== 1 || assets[0].get('type') !== 'model' || assets[0].get('source'))
            return;

        var asset = assets[0];

        if (asset.has('data.mapping') && asset.get('data.mapping').length) {
            var root = editor.call('attributes.rootPanel');

            // preview
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            canvas.classList.add('asset-preview');

            root.element.insertBefore(canvas, root.innerElement);
            root.class.add('asset-preview');

            requestAnimationFrame(function() {
                root.class.add('animate');
            });

            canvas.addEventListener('click', function() {
                if (root.element.classList.contains('large')) {
                    root.element.classList.remove('large');
                } else {
                    root.element.classList.add('large');
                }
            }, false);

            var renderPreview = function () {
                // resize canvas
                canvas.width = root.element.clientWidth;
                canvas.height = canvas.width;
                editor.call('preview:render:model', asset, canvas.width, function (sourceCanvas) {
                    ctx.drawImage(sourceCanvas, 0, 0);
                });
            };
            renderPreview();

            var renderTimeout;

            var evtPanelResize = root.on('resize', function () {
                if (renderTimeout)
                    clearTimeout(renderTimeout);

                renderTimeout = setTimeout(renderPreview, 100);
            });

            // nodes panel
            panelNodes = editor.call('attributes:addPanel', {
                name: 'Mesh Instances'
            });
            panelNodes.class.add('component');

            // reference
            editor.call('attributes:reference:asset:model:meshInstances:attach', panelNodes, panelNodes.headerElement);

            var nodeItems = [ ];

            var addField = function(ind) {
                var engineAsset = editor.call('viewport:framework').assets.get(asset.get('id'));
                var valueBefore = null;

                nodeItems[ind] = editor.call('attributes:addField', {
                    parent: panelNodes,
                    type: 'asset',
                    kind: 'material',
                    name: 'node ' + ind,
                    link: asset,
                    path: 'data.mapping.' + ind + '.material',
                    over: function(type, data) {
                        valueBefore = asset.get('data.mapping.' + ind + '.material') || null;
                        if (engineAsset) {
                            engineAsset.data.mapping[ind].material = parseInt(data.id, 10);
                            engineAsset.fire('change', engineAsset, 'data', engineAsset.data, engineAsset.data);
                            editor.call('viewport:render');
                        }
                    },
                    leave: function() {
                        if (valueBefore) {
                            engineAsset.data.mapping[ind].material = valueBefore;
                            engineAsset.fire('change', engineAsset, 'data', engineAsset.data, engineAsset.data);
                            editor.call('viewport:render');
                        }
                    }
                });

                nodeItems[ind].parent.class.add('node-' + ind);

                nodeItems[ind].parent.on('click', function() {
                    this.class.remove('active');
                });
            };

            // create node fields
            var mapping = asset.get('data.mapping');
            for(var i = 0; i < mapping.length; i++)
                addField(i);

            panelNodes.on('destroy', function () {
                root.class.remove('asset-preview', 'animate');
                if (canvas.parentNode)
                    canvas.parentNode.removeChild(canvas);
                evtPanelResize.unbind();
                if (evtHide)
                    evtHide.unbind();
                panelNodes = null;
            });

            // hide preview when asset info is hidden
            var evtHide = editor.once('attributes:assets:toggleInfo', function (toggle) {
                evtHide = null;
                root.class.remove('asset-preview', 'animate');
                canvas.parentNode.removeChild(canvas);
                evtPanelResize.unbind();
            });

            // template nodes
            var nodesTemplate = function() {
                for(var i = 0; i < asset._nodes.length; i++) {
                    if (! nodeItems[i])
                        continue;

                    nodeItems[i]._label.text = asset._nodes[i];
                }
            };

            if (asset._nodes) {
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

                // load data
                var loadData = function() {
                    Ajax
                    .get('{{url.home}}/' + asset.get('file.url'))
                    .on('load', function(status, data) {
                        asset._nodes = [ ];
                        for(var i = 0; i < data.model.meshInstances.length; i++) {
                            asset._nodes[data.model.meshInstances[i].mesh] = data.model.nodes[data.model.meshInstances[i].node].name;
                        }
                        nodesTemplate();

                        loading.progress = 1;
                    })
                    .on('progress', function(progress) {
                        loading.progress = 0.1 + progress * 0.8;
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
                    });

                    loading.progress = 0.1;
                }

                if (asset.has('file.url'))
                    loadData();

                var evtReload = asset.on('file.hash:set', function() {
                    loadData();
                });

                panelNodes.once('destroy', function() {
                    evtReload.unbind();
                });
            }

            return panelNodes;
        }
    });
});
