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

        if (asset.has('data.mapping') && asset.get('data.mapping').length) {

            var root = editor.call('attributes.rootPanel');

            // preview
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            canvas.classList.add('asset-preview');

            root.element.insertBefore(canvas, root.innerElement);
            root.class.add('asset-preview');

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
            var panelNodes = editor.call('attributes:addPanel', {
                name: 'Mesh Instances'
            });
            panelNodes.class.add('component');

            // reference
            editor.call('attributes:reference:asset:model:meshInstances:attach', panelNodes, panelNodes.headerElement);

            var nodeItems = [ ];

            // create node fields
            for(var i = 0; i < asset.get('data.mapping').length; i++) {
                nodeItems[i] = editor.call('attributes:addField', {
                    parent: panelNodes,
                    type: 'asset',
                    kind: 'material',
                    name: 'node ' + i,
                    link: asset,
                    path: 'data.mapping.' + i + '.material'
                });

                nodeItems[i].parent.class.add('node-' + i);

                (function (index) {
                    nodeItems[index].parent.element.addEventListener('click', function () {
                        if (nodeItems[index].parent) {
                            nodeItems[index].parent.class.remove('active');
                        }
                    });

                })(i);
            }

            panelNodes.on('destroy', function () {
                root.class.remove('asset-preview');
                canvas.parentNode.removeChild(canvas);
                evtPanelResize.unbind();
            });

            // template nodes
            var nodesTemplate = function() {
                asset._nodes.forEach(function(nodeName, i) {
                    if (! nodeItems[i])
                        return;

                    nodeItems[i]._label.text = nodeName;
                });
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
                Ajax
                .get('{{url.home}}/' + asset.get('file.url'))
                .on('load', function(status, data) {
                    var nodes = [ ];
                    for(var i = 0; i < data.model.nodes.length; i++) {
                        if (data.model.nodes[i].name === 'RootNode')
                            continue;

                        nodes.push(data.model.nodes[i].name);
                    }
                    asset._nodes = nodes;
                    nodesTemplate();

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
});
