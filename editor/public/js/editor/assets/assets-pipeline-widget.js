editor.once('load', function() {
    'use strict';

    var root = editor.call('layout.root');
    var assetsPanel = editor.call('layout.assets');
    var viewport = editor.call('layout.viewport');

    // panel
    var panel = new ui.Panel('ASSET TASKS (beta)');
    panel.class.add('pipeline-widget');
    panel.flexShrink = false;
    panel.foldable = true;
    panel.folded = true;
    panel.scroll = true;
    panel.hidden = ! editor.call('permissions:write') || editor.call('viewport:expand:state');
    editor.on('permissions:writeState', function(state) {
        panel.hidden = ! state || editor.call('viewport:expand:state');
    });
    viewport.append(panel);

    editor.on('viewport:expand', function(state) {
        panel.hidden = ! editor.call('permissions:write') || state;
    });

    // number
    var number = document.createElement('span');
    number.classList.add('number');
    number.textContent = '0';
    panel.headerAppend(number);

    // list
    var list = new ui.List();
    list.disabled = true;
    list.class.add('jobs');
    panel.append(list);


    // settings
    var btnSettings = new ui.Button({
        text: '&#57652;'
    });
    btnSettings.class.add('settings');
    btnSettings.on('click', function () {
        editor.call('selector:set', 'designerSettings', [ editor.call('designerSettings') ]);
        setTimeout(function() {
            editor.call('designerSettings:panel:unfold', 'pipeline');
        }, 0);
    });
    panel.append(btnSettings);

    var tooltipSettings = Tooltip.attach({
        target: btnSettings.element,
        text: 'Settings',
        align: 'bottom',
        root: root
    });


    // auto toggle
    var toggleAuto = new ui.Button({
        text: '&#57640;'
    });
    toggleAuto.class.add('toggle', 'auto', 'active');
    toggleAuto.on('click', function () {
        if (! editor.call('permissions:write'))
            return;

        editor.call('assets:pipeline:settings', 'auto', ! editor.call('assets:pipeline:settings', 'auto'));
    });
    var toggleAutoSet = function(state) {
        if (state) {
            list.disabled = true;
            toggleAuto.class.add('active');
            tooltipAuto.class.remove('innactive');
        } else {
            list.disabled = false;
            toggleAuto.class.remove('active');
            tooltipAuto.class.add('innactive');
        }
    };
    editor.on('assets:pipeline:settings:auto', toggleAutoSet);
    panel.append(toggleAuto);

    var tooltipAuto = Tooltip.attach({
        target: toggleAuto.element,
        text: 'Auto-Run',
        align: 'bottom',
        root: root
    });

    toggleAutoSet(editor.call('assets:pipeline:settings', 'auto'));


    var nearestPow2 = function(size) {
        return Math.pow(2, Math.round(Math.log(size) / Math.log(2)));
    };

    var jobs = { };


    editor.method('assets:jobs:remove', function(id) {
        if (! jobs[id])
            return;

        jobs[id].destroy();
        delete jobs[id];

        number.textContent = list.innerElement.childNodes.length;
    });


    editor.method('assets:jobs:texture-convert-options', function(meta) {
        var options = {
            new: false
        };

        // normalize jpeg format
        if (meta.format === 'jpg')
            meta.format = 'jpeg';

        // target format
        options.format = 'jpeg';
        if (meta.format === 'png' || meta.alpha || meta.depth > 8)
            options.format = 'png';

        // rgbm
        if (options.format === 'png' && meta.depth > 8 && [ 'hdr', 'exr', 'tiff' ].indexOf(meta.format) !== -1)
            options.rgbm = true;

        // check if resizing to nearest power of 2 required
        if (editor.call('assets:pipeline:settings', 'texturePot') && (((meta.width & (meta.width - 1)) !== 0) || ((meta.height & (meta.height - 1)) !== 0))) {
            options.size = {
                width: nearestPow2(meta.width),
                height: nearestPow2(meta.height)
            };
        }

        // check for different format
        if (meta.format !== options.format)
            options.new = true;

        if (! options.new && meta.depth > 8)
            options.depthConvert = true;

        return options;
    });


    editor.method('assets:jobs:thumbnails', function(source, target) {
        source = source || target;

        var task = {
            source: {
                asset: {
                    id: source.get('id'),
                    filename: source.get('file.filename'),
                    region: source.get('region')
                }
            }
        };

        if (target) {
            task.target = {
                asset: {
                    id: target.get('id'),
                    filename: target.get('file.filename'),
                    region: target.get('region')
                }
            };
        } else {
            task.target = task.source;
        }

        if (! task.source.asset.filename || ! task.target.asset.filename)
            return;

        editor.call('realtime:send', 'pipeline', {
            name: 'thumbnails',
            data: task
        });
    });


    editor.method('assets:jobs:convert', function(asset, options) {
        if (options) {
            editor.call('realtime:send', 'pipeline', {
                name: 'convert',
                data: options
            });
        } else {
            // auto convert
            var item = jobs[asset.get('id')];
            var meta = asset.get('meta');

            var events = [ ];

            if (item) {
                events = item.events;
                item.class.add('processing');
            } else {
                asset.once('destroy', function() {
                    for(var i = 0; i < events.length; i++)
                        events[i].unbind();
                });
            }

            if (asset.get('type') === 'texture') {
                var task = {
                    source: {
                        asset: {
                            id: asset.get('id'),
                            type: asset.get('type'),
                            filename: asset.get('file.filename'),
                            scope: asset.get('scope'),
                            user_id: asset.get('user_id'),
                            region: asset.get('region')
                        },
                    },
                    target: { }
                };

                task.options = editor.call('assets:jobs:texture-convert-options', meta);

                if (! task.options.new) {
                    task.target = task.source;

                    editor.call('realtime:send', 'pipeline', {
                        name: 'convert',
                        data: task
                    });

                    events.push(asset.once('file:set', function() {
                        editor.call('assets:jobs:remove', asset.get('id'));
                        setTimeout(function() {
                            editor.call('assets:jobs:thumbnails', null, asset);
                        }, 0);
                    }));

                    // no changes to asset
                    if (Object.keys(task.options).length === 2 && task.options.format === meta.format) {
                        editor.call('assets:jobs:remove', asset.get('id'));
                        setTimeout(function() {
                            editor.call('assets:jobs:thumbnails', null, asset);
                        }, 0);
                    }
                } else {
                    var filename = asset.get('file.filename').split('.');
                    filename = filename.slice(0, filename.length - 1).join() + '.' + task.options.format;
                    var path = asset.get('path');

                    var target = editor.call('assets:findOne', function(a) {
                        if (a.get('name') !== filename || a.get('source_asset_id') !== asset.get('id'))
                            return false;

                        if (! editor.call('assets:pipeline:settings', 'searchRelatedAssets') && ! a.get('path').equals(path))
                            return false;

                        return true;
                    });
                    if (target)
                        target = target[1];

                    var onTargetAvailable = function(target) {
                        task.target = {
                            asset: {
                                id: target.get('id'),
                                type: target.get('type'),
                                filename: filename,
                                scope: target.get('scope'),
                                user_id: target.get('user_id'),
                                region: target.get('region')
                            }
                        };

                        editor.call('realtime:send', 'pipeline', {
                            name: 'convert',
                            data: task
                        });

                        events.push(target.once('file:set', function() {
                            editor.call('assets:jobs:remove', asset.get('id'));
                            setTimeout(function() {
                                if (target.get('data.rgbm')) {
                                    editor.call('assets:jobs:thumbnails', asset, target);
                                } else {
                                    editor.call('assets:jobs:thumbnails', null, target);
                                }
                            }, 0);
                        }));
                    };

                    if (target) {
                        onTargetAvailable(target);
                    } else {
                        var data = null;

                        if (task.options.rgbm) {
                            data = {
                                rgbm: true
                            };
                        }
                        var assetNew = {
                            name: filename,
                            type: 'texture',
                            source: false,
                            source_asset_id: asset.get('id'),
                            preload: true,
                            data: data,
                            region: asset.get('region'),
                            parent: path.length ? path[path.length - 1] : null,
                            scope: asset.get('scope')
                        };

                        editor.call('assets:create', assetNew, function(err, id) {
                            var target = editor.call('assets:get', id);

                            if (target) {
                                onTargetAvailable(target)
                            } else {
                                events.push(editor.once('assets:add[' + id + ']', onTargetAvailable));
                            }
                        });
                    }
                }
            } else if (asset.get('type') === 'scene') {
                var path = asset.get('path');
                var model = { };
                var animation = null;
                var materials = asset.get('meta.materials') || [ ];
                var textures = asset.get('meta.textures') || [ ];

                var nameModel = asset.get('name').split('.');
                nameModel = nameModel.slice(0, nameModel.length - 1).join('.') + '.json';

                // model
                var modelTarget = editor.call('assets:findOne', function(a) {
                    if (a.get('source_asset_id') !== asset.get('id') || a.get('name') !== nameModel || a.get('type') !== 'model')
                        return false;

                    if (! editor.call('assets:pipeline:settings', 'searchRelatedAssets') && ! a.get('path').equals(path))
                        return false;

                    return true;
                });
                if (modelTarget) {
                    model.asset = parseInt(modelTarget[1].get('id'), 10);
                    model.override = editor.call('assets:pipeline:settings', 'overwriteModel');
                }

                // animation
                if (asset.get('meta.animation.available')) {
                    animation = { };

                    var animationTarget = editor.call('assets:findOne', function(a) {
                        if (a.get('source_asset_id') !== asset.get('id') || a.get('name') !== nameModel || a.get('type') !== 'animation')
                            return false;

                        if (! editor.call('assets:pipeline:settings', 'searchRelatedAssets') && ! a.get('path').equals(path))
                            return false;

                        return true;
                    });

                    if (animationTarget) {
                        animation.asset = parseInt(animationTarget[1].get('id'), 10);
                        animation.override = editor.call('assets:pipeline:settings', 'overwriteAnimation');;
                    }
                }

                // materials
                for(var i = 0; i < materials.length; i++) {
                    var target = editor.call('assets:findOne', function(a) {
                        if (a.get('source_asset_id') !== asset.get('id') || a.get('name') !== materials[i].name || a.get('type') !== 'material')
                            return false;

                        if (! editor.call('assets:pipeline:settings', 'searchRelatedAssets') && ! a.get('path').equals(path))
                            return false;

                        return true;
                    });

                    if (target) {
                        materials[i].asset = parseInt(target[1].get('id'), 10);
                        materials[i].override = editor.call('assets:pipeline:settings', 'overwriteMaterial');;
                    }
                }

                // textures
                for(var i = 0; i < textures.length; i++) {
                    var name = textures[i].name.toLowerCase();
                    if (name.endsWith('.jpg'))
                        name = name.slice(0, -4) + '.jpeg';

                    var target = editor.call('assets:findOne', function(a) {
                        if (a.get('source_asset_id') !== asset.get('id') || a.get('name').toLowerCase() !== name || a.get('type') !== 'texture' || a.get('source'))
                            return false;

                        if (! editor.call('assets:pipeline:settings', 'searchRelatedAssets') && ! a.get('path').equals(path))
                            return false;

                        return true;
                    });

                    if (target) {
                        textures[i].asset = parseInt(target[1].get('id'), 10);
                        textures[i].override = editor.call('assets:pipeline:settings', 'overwriteTexture');;
                    }

                    textures[i].options = editor.call('assets:jobs:texture-convert-options', textures[i].meta);
                }

                var task = {
                    source: {
                        asset: {
                            id: asset.get('id'),
                            source: true,
                            type: 'scene',
                            filename: asset.get('file.filename'),
                            scope: asset.get('scope'),
                            user_id: asset.get('user_id'),
                            region: asset.get('region')
                        }
                    },
                    options: {
                        textures: textures,
                        materials: materials,
                        mappings: asset.get('meta.mappings'),
                        animation: animation,
                        model: model
                    }
                };

                editor.call('realtime:send', 'pipeline', {
                    name: 'convert',
                    data: task
                });

                editor.call('assets:jobs:remove', asset.get('id'));
            } else if (asset.get('type') === 'font') {
                var task = {
                    source: {
                        asset: {
                            id: asset.get('id'),
                            type: asset.get('type'),
                            filename: asset.get('file.filename'),
                            scope: asset.get('scope'),
                            user_id: asset.get('user_id'),
                            region: asset.get('region')
                        },
                    },
                    target: { }
                };

                var filename = asset.get('file.filename');
                var path = asset.get('path');

                var target = editor.call('assets:findOne', function(a) {
                    return a.get('name') === filename && a.get('source_asset_id') === asset.get('id');
                });

                if (target)
                    target = target[1];

                var onTargetAvailable = function(target) {
                    task.target = {
                        asset: {
                            id: target.get('id'),
                            type: target.get('type'),
                            filename: filename,
                            scope: target.get('scope'),
                            user_id: target.get('user_id'),
                            region: target.get('region'),
                            meta: {
                                chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 !@£$%^&*()_+-=[];\'\\:",./<>?#€'
                            }
                        }
                    };

                    console.log(task);

                    editor.call('realtime:send', 'pipeline', {
                        name: 'convert',
                        data: task
                    });

                    events.push(target.once('file:set', function() {
                        editor.call('assets:jobs:remove', asset.get('id'));
                        // setTimeout(function() {
                        //     if (target.get('data.rgbm')) {
                        //         editor.call('assets:jobs:thumbnails', asset, target);
                        //     } else {
                        //         editor.call('assets:jobs:thumbnails', null, target);
                        //     }
                        // }, 0);
                    }));
                };

                if (target) {
                    onTargetAvailable(target);
                } else {
                    var data = null;

                    var assetNew = {
                        name: filename,
                        type: 'font',
                        source: false,
                        source_asset_id: asset.get('id'),
                        preload: true,
                        data: data,
                        region: asset.get('region'),
                        parent: path.length ? path[path.length - 1] : null,
                        scope: asset.get('scope')
                    };

                    editor.call('assets:create', assetNew, function(err, id) {
                        var target = editor.call('assets:get', id);

                        if (target) {
                            onTargetAvailable(target);
                        } else {
                            events.push(editor.once('assets:add[' + id + ']', onTargetAvailable));
                        }
                    });
                }
            }
        }
    });


    editor.method('assets:jobs:add', function(asset) {
        if (jobs[asset.get('id')])
            return;

        var type = asset.get('type');
        if ([ 'texture', 'scene', 'font' ].indexOf(type) === -1)
            return;

        var events = [ ];

        var item = jobs[asset.get('id')] = new ui.ListItem();
        item.events = events;
        item.asset = asset;
        item.text = asset.get('name');

        events.push(asset.on('name:set', function(value) {
            item.text = asset.get('name');
        }));
        events.push(asset.once('destroy', function() {
            editor.call('assets:jobs:remove', asset.get('id'));
        }));

        list.append(item);

        // remove on right click
        item.element.addEventListener('contextmenu', function() {
            if (! editor.call('permissions:write'))
                return;

            editor.call('assets:jobs:remove', asset.get('id'));
        }, false);

        var auto = new ui.Button({
            text: '&#57649;'
        });
        auto.class.add('auto');
        auto.parent = item;
        item.element.appendChild(auto.element);

        number.textContent = list.innerElement.childNodes.length;

        item.once('destroy', function() {
            for(var i = 0; i < events.length; i++)
                events[i].unbind();
        });

        var convertAuto = function() {
            if (! editor.call('permissions:write'))
                return;

            editor.call('assets:jobs:convert', asset);
        };

        auto.on('click', convertAuto);

        if (editor.call('assets:pipeline:settings', 'auto')) {
            if (type === 'font') {
                // convert fonts once the source file has been set
                var filename = asset.get('file.filename');
                if (filename) {
                    convertAuto();
                } else {
                    events.push(asset.once('file.filename:set', function (value) {
                        if (! editor.call('assets:pipeline:settings', 'auto'))
                            return;

                        convertAuto();
                    }));
                }

            } else {
                // convert asset once it has meta set
                var meta = asset.get('meta');

                if (meta) {
                    convertAuto();
                } else {
                    events.push(asset.once('meta:set', function(value) {
                        if (! editor.call('assets:pipeline:settings', 'auto'))
                            return;

                        convertAuto();
                    }));
                }
            }

        } else {
            if (asset.get('type') === 'texture' && ! asset.get('source')) {
                var filename = asset.get('file.filename');

                if (filename) {
                    editor.call('assets:jobs:thumbnails', null, asset);
                } else {
                    events.push(asset.once('file.filename:set', function() {
                        editor.call('assets:jobs:thumbnails', null, asset);
                    }));
                }
            }
        }

        return item;
    });



    // offset panel if assets panel header overlaps
    var canvas = null;

    var reflow = function() {
        if (! canvas)
            return;

        if ((8 + assetsPanel.headerElement.clientWidth + panel.element.clientWidth) > canvas.width) {
            panel.class.add('offset');
            panel.style.left = (assetsPanel.headerElement.clientWidth + 4) + 'px';
        } else {
            panel.class.remove('offset');
            panel.style.left = '';
        }
    };

    setTimeout(function() {
        canvas = editor.call('viewport:canvas');
        if (canvas)
            canvas.on('resize', reflow);
    });
});
