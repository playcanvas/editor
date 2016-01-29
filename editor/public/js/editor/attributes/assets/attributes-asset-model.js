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

    var panelToggles = {
        'meta': true,
        'pipeline': true,
        'nodes': false
    };

    editor.on('attributes:inspect[asset]', function(assets) {
        for(var i = 0; i < assets.length; i++) {
            if (assets[i].get('type') !== 'model' || assets[i].get('source'))
                return;
        }

        if (assets.length > 1)
            editor.call('attributes:header', assets.length + ' Models');

        var events = [ ];

        var nodesTemplate;
        if (assets.length === 1 && assets[0]._loading && assets[0]._hash !== assets[0].get('file.hash')) {
            assets[0]._loading = 0;
            // assets[0]._uv1 = false;
            assets[0]._nodes = null;
        }

        // load data
        var loadingData = false;
        var loadData = function() {
            if (assets.length !== 1 || assets[0]._loading)
                return;

            assets[0]._hash = assets[0].get('file.hash');
            assets[0]._loading = 1;
            // assets[0]._uv1 = false;
            assets[0]._nodes = null;
            loading.hidden = false;

            Ajax
            .get('{{url.home}}/' + assets[0].get('file.url'))
            .on('load', function(status, data) {
                assets[0]._loading = 2;

                // assets[0]._uv1 = data.model.vertices[0] && data.model.vertices[0].hasOwnProperty('texCoord1');
                // fieldUV1.value = assets[0]._uv1 ? 'available' : 'unavailable';
                autoUnwrap.enabled = true;

                assets[0]._nodes = [ ];
                for(var i = 0; i < data.model.meshInstances.length; i++)
                    assets[0]._nodes[i] = data.model.nodes[data.model.meshInstances[i].node].name;

                if (nodesTemplate)
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
        };

        // loading
        var loading
        if (assets.length === 1) {
            loading = editor.call('attributes:addField', {
                type: 'progress'
            });
            loading.on('progress:100', function() {
                this.hidden = true;
            });
            if (assets[0]._loading)
                loading.hidden = true;

            if (assets[0].has('file.url') && ! assets[0]._loading)
                loadData();

            events.push(assets[0].on('file.hash:set', function(value) {
                assets[0]._loading = 0;
                loadData();
            }));
        }


        var panelMeta = editor.call('attributes:addPanel', {
            name: 'Meta'
        });
        panelMeta.class.add('component');
        panelMeta.foldable = true;
        panelMeta.folded = panelToggles['meta'];
        panelMeta.on('fold', function() {
            panelToggles['meta'] = true;
        });
        panelMeta.on('unfold', function() {
            panelToggles['meta'] = false;
        });

        var btnGetMeta = new ui.Button({
            text: 'Calculate Meta'
        });
        btnGetMeta.class.add('calculate-meta');
        var btnGetMetaVisibility = function() {
            var visible = false;
            for(var i = 0; i < assets.length; i++) {
                if (! visible && ! assets[i].get('meta'))
                    visible = true;
            }
            btnGetMeta.hidden = ! visible;
        };
        btnGetMeta.on('click', function() {
            if (! editor.call('permissions:write'))
                return;

            for(var i = 0; i < assets.length; i++) {
                if (assets[i].get('meta'))
                    continue;

                editor.call('realtime:send', 'pipeline', {
                    name: 'meta',
                    id: assets[i].get('id')
                });
            }
            this.enabled = false;
        });
        panelMeta.append(btnGetMeta);

        btnGetMetaVisibility();
        for(var i = 0; i < assets.length; i++) {
            if (btnGetMeta.hidden && ! assets[i].get('meta'))
                btnGetMeta.hidden = false;

            events.push(assets[i].on('meta:set', function() {
                btnGetMetaVisibility();
            }));
            events.push(assets[i].on('meta:unset', function() {
                btnGetMeta.hidden = false;
            }));
        }

        var recalculateMeta = function(key) {
            var value = 0;
            var noValue = true;
            for(var i = 0; i < assets.length; i++) {
                if (! assets[i].has('meta.' + key))
                    continue;
                value += assets[i].get('meta.' + key);
                noValue = false;
            }
            metaFields[key].field.value = noValue ? '' : value.toLocaleString();
        };

        var metaFields = {
            vertices: {
                title: 'Vertices',
            },
            triangles: {
                title: 'Triangles',
            },
            meshes: {
                title: 'Meshes',
            },
            meshInstances: {
                title: 'Mesh Instances',
            },
            nodes: {
                title: 'Nodes',
            },
            skins: {
                title: 'Skins',
            }
        };

        var keys = Object.keys(metaFields);

        var addMetaField = function(key) {
            metaFields[key].field = editor.call('attributes:addField', {
                parent: panelMeta,
                name: metaFields[key].title
            });
            recalculateMeta(key);

            for(var a = 0; a < assets.length; a++) {
                events.push(assets[a].on('meta:unset', function() {
                    recalculateMeta(key);
                }));
                events.push(assets[a].on('meta:set', function() {
                    recalculateMeta(key);
                }));
                events.push(assets[a].on('meta.' + key + ':set', function() {
                    recalculateMeta(key);
                }));
                events.push(assets[a].on('meta.' + key + ':unset', function() {
                    recalculateMeta(key);
                }));
            }
        };

        for(var i = 0; i < keys.length; i++) {
            if (! metaFields.hasOwnProperty(keys[i]))
                continue;

            addMetaField(keys[i]);
        }

        var calculateAttributes = function() {
            var attributes = { };
            for(var i = 0; i < assets.length; i++) {
                var attr = assets[i].get('meta.attributes');
                if (! attr)
                    continue;

                var keys = Object.keys(attr);
                for(var n = 0; n < keys.length; n++) {
                    if (! attr.hasOwnProperty(keys[n]))
                        continue;

                    attributes[keys[n]] = attributes[keys[n]] || 0;
                    attributes[keys[n]]++;
                }
            }

            var attributesValue = '';
            var keys = Object.keys(attributes);
            for(var i = 0; i < keys.length; i++) {
                if (! attributes.hasOwnProperty(keys[i]))
                    continue;

                if (attributesValue)
                    attributesValue += ', ';

                attributesValue += keys[i];

                if (attributes[keys[i]] !== assets.length)
                    attributesValue += '*';
            }

            fieldMetaAttributes.value = attributesValue;
        };


        var fieldMetaAttributes = editor.call('attributes:addField', {
            parent: panelMeta,
            name: 'Attributes'
        });
        calculateAttributes();
        for(var i = 0; i < assets.length; i++)
            events.push(assets[i].on('meta:set', calculateAttributes));


        var panelPipeline = editor.call('attributes:addPanel', {
            name: 'Pipeline'
        });
        panelPipeline.class.add('component');
        panelPipeline.foldable = true;
        panelPipeline.folded = panelToggles['pipeline'];
        panelPipeline.on('fold', function() {
            panelToggles['pipeline'] = true;
        });
        panelPipeline.on('unfold', function() {
            panelToggles['pipeline'] = false;
        });

        if (config.owner.plan.id !== 3)
            panelPipeline.hidden = true;

        var uv1Options = [ 'unavailable', 'available', 'various' ];
        var checkUV1 = function() {
            var uv1 = assets[0].has('meta.attributes.texCoord1') ? 1 : 0;
            for(var i = 1; i < assets.length; i++) {
                var t1 = assets[i].get('meta.attributes.texCoord1');

                if ((t1 ? 1 : 0) !== uv1) {
                    uv1 = 2;
                    break;
                }
            }
            fieldUV1.value = uv1Options[uv1];
        }

        var fieldUV1 = editor.call('attributes:addField', {
            parent: panelPipeline,
            name: 'UV1'
        });
        checkUV1();

        for(var i = 0; i < assets.length; i++) {
            events.push(assets[i].on('meta.attributes.texCoord1:set', checkUV1));
            events.push(assets[i].on('meta.attributes.texCoord1:unset', checkUV1));
        }

        // padding
        var fieldPadding = editor.call('attributes:addField', {
            parent: panelPipeline,
            name: 'Padding',
            type: 'number',
            value: 2.0,
            precision: 2
        });
        fieldPadding.style.width = '32px';

        // TODO
        // estimate good padding
        // padding = (2 / getResolutionFromArea(assetArea)) * 1024

        // unwrap
        var autoUnwrap = new ui.Button({
            text: 'Auto-Unwrap'
        });
        autoUnwrap.on('click', function() {
            if (! editor.call('permissions:write'))
                return;

            for(var i = 0; i < assets.length; i++) {
                editor.call('assets:model:unwrap', assets[i], {
                    padding: fieldPadding.value
                });
            }

            unwrapState();
        });
        autoUnwrap.class.add('generate-uv1');
        fieldPadding.parent.append(autoUnwrap);

        // unwrap progress
        var progressUnwrap = new ui.Progress();
        progressUnwrap.class.add('field-progress');
        fieldPadding.parent.append(progressUnwrap);

        // unwrap cancel
        var autoUnwrapCancel = new ui.Button({
            text: 'Cancel'
        });
        autoUnwrapCancel.on('click', function() {
            if (! editor.call('permissions:write'))
                return;

            for(var i = 0; i < assets.length; i++)
                editor.call('assets:model:unwrap:cancel', assets[i]);

            unwrapState();
        });
        autoUnwrapCancel.class.add('generate-uv1');
        fieldPadding.parent.append(autoUnwrapCancel);

        var unwrapState = function() {
            var worker = editor.call('assets:model:unwrapping', assets[0]);
            progressUnwrap.hidden = ! worker;
            autoUnwrapCancel.hidden = ! worker;
            autoUnwrap.hidden = ! progressUnwrap.hidden;
            fieldPadding.hidden = ! progressUnwrap.hidden;

            if (worker)
                progressUnwrap.progress = worker.progress / 100;
        };
        unwrapState();

        events.push(editor.on('assets:model:unwrap', function(asset) {
            if (assets.indexOf(asset) === -1)
                return;

            unwrapState();
        }));
        events.push(editor.on('assets:model:unwrap:progress:' + assets[0].get('id'), function(progress) {
            progressUnwrap.progress = progress / 100;
        }));

        // area
        var fieldArea = editor.call('attributes:addField', {
            parent: panelPipeline,
            name: 'Area',
            link: assets,
            path: 'data.area'
        });

        // uv1Area
        var fieldUv1Area = editor.call('attributes:addField', {
            parent: panelPipeline,
            name: 'UV1 Area',
            link: assets,
            path: 'data.uv1Area'
        });

        // multiArea
        editor.call('attributes:addField', {
            parent: panelPipeline,
            name: 'Multi Area X',
            link: assets,
            path: 'data.multiArea.x'
        });
        editor.call('attributes:addField', {
            parent: panelPipeline,
            name: 'Multi Area Y',
            link: assets,
            path: 'data.multiArea.y'
        });
        editor.call('attributes:addField', {
            parent: panelPipeline,
            name: 'Multi Area Z',
            link: assets,
            path: 'data.multiArea.z'
        });


        if (assets.length === 1 && assets[0].has('data.mapping') && assets[0].get('data.mapping').length) {
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
                editor.call('preview:render:model', assets[0], canvas.width, function (sourceCanvas) {
                    ctx.drawImage(sourceCanvas, 0, 0);
                });
            };
            renderPreview();

            var renderTimeout;

            events.push(root.on('resize', function () {
                if (renderTimeout)
                    clearTimeout(renderTimeout);

                renderTimeout = setTimeout(renderPreview, 100);
            }));

            // nodes panel
            panelNodes = editor.call('attributes:addPanel', {
                name: 'Mesh Instances'
            });
            panelNodes.class.add('component');
            panelNodes.foldable = true;
            panelNodes.folded = panelToggles['nodes'];
            panelNodes.on('fold', function() {
                panelToggles['nodes'] = true;
            });
            panelNodes.on('unfold', function() {
                panelToggles['nodes'] = false;
            });

            // reference
            editor.call('attributes:reference:asset:model:meshInstances:attach', panelNodes, panelNodes.headerElement);

            var nodeItems = [ ];

            var addField = function(ind) {
                var engineAsset = editor.call('viewport:framework').assets.get(assets[0].get('id'));
                var valueBefore = null;

                nodeItems[ind] = editor.call('attributes:addField', {
                    parent: panelNodes,
                    type: 'asset',
                    kind: 'material',
                    name: '[' + ind + '] node',
                    link: assets[0],
                    path: 'data.mapping.' + ind + '.material',
                    over: function(type, data) {
                        valueBefore = assets[0].get('data.mapping.' + ind + '.material') || null;
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
            var mapping = assets[0].get('data.mapping');
            for(var i = 0; i < mapping.length; i++)
                addField(i);

            panelNodes.on('destroy', function () {
                root.class.remove('asset-preview', 'animate');
                if (canvas.parentNode)
                    canvas.parentNode.removeChild(canvas);
                panelNodes = null;
            });

            // hide preview when asset info is hidden
            events.push(editor.once('attributes:assets:toggleInfo', function (toggle) {
                panelMeta.hidden = true;
                panelPipeline.hidden = true;

                root.class.remove('asset-preview', 'animate');
                if (canvas.parentNode)
                    canvas.parentNode.removeChild(canvas);
            }));

            // template nodes
            nodesTemplate = function() {
                if (! panelNodes)
                    return;

                panelNodes.header = 'Mesh Instances [' + assets[0]._nodes.length + ']'

                for(var i = 0; i < assets[0]._nodes.length; i++) {
                    if (! nodeItems[i])
                        continue;

                    nodeItems[i]._label.text = '[' + i + '] ' + assets[0]._nodes[i];
                }
            };

            if (assets[0]._nodes)
                // already loaded
                nodesTemplate();

            return panelNodes;
        }

        panelMeta.once('destroy', function() {
            for(var i = 0; i < events.length; i++)
                events[i].unbind();
        });
    });
});
