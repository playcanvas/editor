editor.once('load', function() {
    'use strict';

    var projectSettings = editor.call('settings:project');

    var foldStates = {
        'loading': true
    };

    editor.on('attributes:inspect[editorSettings]', function() {
        var root = editor.call('layout.root');

        // loading screen
        var panelLoadingScreen = editor.call('attributes:addPanel', {
            name: 'Loading Screen'
        });
        panelLoadingScreen.foldable = true;
        panelLoadingScreen.folded = foldStates['loading'];
        panelLoadingScreen.on('fold', function() { foldStates['loading'] = true; });
        panelLoadingScreen.on('unfold', function() { foldStates['loading'] = false; });
        panelLoadingScreen.class.add('component', 'loading-screen');

        if (!editor.call("users:isSuperUser") && config.owner.plan.type !== 'org' && config.owner.plan.type !== 'organization') {
            var labelUpgrade = new ui.Label({
                text: 'This is an ORGANIZATION account feature. <a href="/upgrade?plan=organization&account=' + config.owner.username + '" target="_blank">UPGRADE</a> to create custom loading screens.',
                unsafe: true
            });
            labelUpgrade.style.fontSize = '12px';
            labelUpgrade.style.color = '#fff';
            panelLoadingScreen.append(labelUpgrade);
            return;
        }


        var panelButtons = new ui.Panel();
        panelButtons.class.add('flex', 'component');
        panelLoadingScreen.append(panelButtons);

        var btnDefaultScript = new ui.Button({
            text: 'Create default'
        });
        btnDefaultScript.class.add('add');
        btnDefaultScript.class.add('loading-screen');

        panelButtons.append(btnDefaultScript);

        var tooltipText = 'Create a default loading screen script.';

        if (projectSettings.get('useLegacyScripts')) {
            var repositories = editor.call('repositories');
            // disable create button for non directory repos
            btnDefaultScript.disabled = repositories.get('current') !== 'directory';

            if (btnDefaultScript.disabled) {
                tooltipText += '<br/><small><em>(Disabled because you are synced to an external code repository)</em></small>';
            }

            btnDefaultScript.on('click', function () {
                editor.call('selector:enabled', false);
                editor.call('sourcefiles:new', editor.call('sourcefiles:loadingScreen:skeleton'));
                var evtNew = editor.once('sourcefiles:add', function (file) {
                    setLoadingScreen(file.get('filename'));
                    evtNew = null;
                });

                editor.once('sourcefiles:new:close', function () {
                    editor.call('selector:enabled', true);
                    if (evtNew) {
                        evtNew.unbind();
                        evtNew = null;
                    }
                });
            });

            var setLoadingScreen = function (data) {
                var loadingScreen = data && data.get ? data.get('filename') : data;
                projectSettings.set('loadingScreenScript', loadingScreen);
                fieldScriptPicker.text = loadingScreen ? loadingScreen : 'Select loading screen script';
                if (loadingScreen) {
                    btnRemove.class.remove('not-visible');
                } else {
                    btnRemove.class.add('not-visible');
                }
            };
        } else {

            var setLoadingScreen = function (asset) {
                if (asset) {
                    if (! asset.get('data.loading'))
                        return;

                    asset.set('preload', false);
                }

                projectSettings.set('loadingScreenScript', asset ? asset.get('id') + '' : null);
                fieldScriptPicker.text = asset ? asset.get('name') : 'Select loading screen script';
                if (asset) {
                    btnRemove.class.remove('not-visible');
                } else {
                    btnRemove.class.add('not-visible');
                }
            };

            btnDefaultScript.on('click', function () {
                // editor.call('selector:enabled', false);

                editor.call('picker:script-create', function(filename) {
                    editor.call('assets:create:script', {
                        filename: filename,
                        content: editor.call('sourcefiles:loadingScreen:skeleton'),
                        callback: function (err, asset) {
                            if (err)
                                return;

                            setLoadingScreen(asset);
                        }
                    });

                });

            });
        }

        Tooltip.attach({
            target: btnDefaultScript.element,
            html:  tooltipText,
            align: 'right',
            root: root
        });

        var btnSelectScript = new ui.Button({
            text: 'Select existing'
        });
        btnSelectScript.class.add('loading-screen');
        panelButtons.append(btnSelectScript);

        btnSelectScript.on('click', function () {
            var evtPick = editor.once("picker:asset", function (asset) {
                setLoadingScreen(asset);
                evtPick = null;
            });

            // show asset picker
            editor.call("picker:asset", { type: "script" });

            editor.once('picker:asset:close', function () {
                if (evtPick) {
                    evtPick.unbind();
                    evtPick = null;
                }
            });
        });

        Tooltip.attach({
            target: btnSelectScript.element,
            text: 'Select an existing loading screen script',
            align: 'bottom',
            root: root
        });

        var fieldScriptPicker = editor.call('attributes:addField', {
            parent: panelLoadingScreen,
            name: 'Script',
            type: 'button'
        });
        fieldScriptPicker.class.add('script-picker');

        fieldScriptPicker.style['font-size'] = '11px';
        fieldScriptPicker.parent.hidden = true;

        var btnRemove = new ui.Button();
        btnRemove.class.add('remove');
        fieldScriptPicker.parent.append(btnRemove);
        btnRemove.on("click", function () {
            setLoadingScreen(null);
        });


        var onLoadingScreen = function (loadingScreen) {
            var text;
            var missing = false;
            if (projectSettings.get('useLegacyScripts')) {
                text = loadingScreen;
            } else if (loadingScreen) {
                var asset = editor.call('assets:get', loadingScreen);
                if (asset) {
                    text = asset.get('name');
                } else {
                    missing = true;
                    text = 'Missing';
                }
            }

            if (text) {
                fieldScriptPicker.text = text;
                fieldScriptPicker.parent.hidden = false;
                panelButtons.hidden = true;
            } else {
                fieldScriptPicker.parent.hidden = true;
                panelButtons.hidden = false;
            }

            if (missing) {
                fieldScriptPicker.class.add('error');
            } else {
                fieldScriptPicker.class.remove('error');
            }
        };

        var evtLoadingScreen = projectSettings.on('loadingScreenScript:set', onLoadingScreen);

        panelLoadingScreen.on('destroy', function () {
            evtLoadingScreen.unbind();
        });

        onLoadingScreen(projectSettings.get('loadingScreenScript'));

        fieldScriptPicker.on('click', function () {
            var evtPick = editor.once("picker:asset", function (asset) {
                setLoadingScreen(asset);
                evtPick = null;
            });

            // show asset picker
            editor.call("picker:asset", { type: "script" });

            editor.once('picker:asset:close', function () {
                if (evtPick) {
                    evtPick.unbind();
                    evtPick = null;
                }
            });
        });

        // reference
        editor.call('attributes:reference:attach', 'settings:loadingScreenScript', fieldScriptPicker.parent.innerElement.firstChild.ui);

        // drag drop
        var dropRef = editor.call('drop:target', {
            ref: panelLoadingScreen.element,
            filter: function(type, data) {
                var rectA = root.innerElement.getBoundingClientRect();
                var rectB = panelLoadingScreen.element.getBoundingClientRect();
                if (type === 'asset.script' && rectB.top > rectA.top && rectB.bottom < rectA.bottom) {

                    if (projectSettings.get('useLegacyScripts')) {
                        return data.filename !== fieldScriptPicker.text;
                    } else {
                        var asset = editor.call('assets:get', data.id);
                        return asset && asset.get('data.loading');
                    }
                }

                return false;
            },
            drop: function(type, data) {
                if (type !== 'asset.script')
                    return;

                if (projectSettings.get('useLegacyScripts')) {
                    setLoadingScreen(data.filename);
                } else {
                    var asset = editor.call('assets:get', data.id);
                    if (asset && asset.get('data.loading'))
                        setLoadingScreen(asset);
                }
            }
        });
    });
});
