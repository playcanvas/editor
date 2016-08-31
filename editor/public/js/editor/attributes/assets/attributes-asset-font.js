editor.once('load', function() {
    'use strict';

    // get characters between range (inclusive)
    var characterRange = function (from, to) {
        var chars = [];
        for (var i = from; i <= to; i++) {
            chars.push(String.fromCharCode(i));
        }

        return chars.join('');
    };

    // character presets
    var LATIN = characterRange(0x20, 0x7e);
    var LATIN_SUPPLEMENT = characterRange(0xA0, 0xFF);
    var CYRILLIC = characterRange(0x400, 0x4ff);
    var GREEK = characterRange(0x370, 0x3FF);

    editor.on('attributes:inspect[asset]', function(assets) {
        var root = editor.call('attributes.rootPanel');

        for(var i = 0; i < assets.length; i++) {
            if (assets[i].get('type') !== 'font' || assets[i].get('source'))
                return;
        }

        var events = [ ];

        if (assets.length > 1)
            editor.call('attributes:header', assets.length + ' Fonts');

        // Character Presets
        var panelCharacterSets = editor.call('attributes:addPanel', {
            name: 'Character Presets'
        });
        panelCharacterSets.class.add('component');

        // reference
        editor.call('attributes:reference:attach', 'asset:font:presets', panelCharacterSets, panelCharacterSets.headerElement);

        // buttons to add character sets
        var names = [
            'Latin',
            'Latin Supplement',
            'Cyrillic',
            'Greek'
        ];

        var sets = [
            LATIN,
            LATIN_SUPPLEMENT,
            CYRILLIC,
            GREEK
        ];

        // Add a button for each preset
        // which adds the respected preset to the selected
        // assets's characters
        sets.forEach(function (set, index) {
            var btn = new ui.Button({
                text: names[index]
            });

            panelCharacterSets.append(btn);

            btn.on('click', function () {
                proxyObservers.forEach(function (proxy) {
                    var val = proxy.get('chars');
                    val += set;
                    proxy.set('chars', val);
                });

                setCharsValue();

                fieldFrom.value = '0x' + set.charCodeAt(0).toString(16);
                fieldTo.value = '0x' + set.charCodeAt(set.length-1).toString(16);
            });
        });

        // Custom Range
        var panelCustomRange = editor.call('attributes:addPanel', {
            name: 'Custom Character Range'
        });
        panelCustomRange.class.add('component');

        // reference
        editor.call('attributes:reference:attach', 'asset:font:customRange', panelCustomRange, panelCustomRange.headerElement);

        // Range buttons
        var panelRange = editor.call('attributes:addField', {
            parent: panelCustomRange,
            name: 'Range (hex)'
        });
        var label = panelRange;
        panelRange = panelRange.parent;
        label.destroy();

        var fieldFrom = editor.call('attributes:addField', {
            panel: panelRange,
            type: 'string',
            placeholder: 'From',
            value: '0x20'
        });

        // fieldFrom.style.width = '32px';

        fieldFrom.renderChanges = false;

        var fieldTo = editor.call('attributes:addField', {
            panel: panelRange,
            type: 'string',
            placeholder: 'To',
            value: '0x7E'
        });

        fieldTo.renderChanges = false;

        // fieldTo.style.width = '32px';

        var btnAddRange = new ui.Button({
            text: '&#57632;',
        });
        btnAddRange.class.add('font-icon');

        panelRange.append(btnAddRange);

        btnAddRange.on('click', function () {
            var from = parseInt(fieldFrom.value, 16);
            if (! from )
                return;
            var to = parseInt(fieldTo.value, 16);
            if (! to )
                return;

            if (from > to)
                return;

            var range = characterRange(from, to);

            proxyObservers.forEach(function (proxy) {
                var val = proxy.get('chars');
                val += range;
                proxy.set('chars', val);
            });

            setCharsValue();
        });


        // Characters
        var paramsPanel = editor.call('attributes:addPanel', {
            name: 'Font'
        });
        paramsPanel.class.add('component');
        // reference
        editor.call('attributes:reference:attach', 'asset:font:asset', paramsPanel, paramsPanel.headerElement);

        // preview
        if (assets.length === 1) {
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            canvas.classList.add('asset-preview');

            canvas.addEventListener('click', function() {
                if (root.element.classList.contains('large')) {
                    root.element.classList.remove('large');
                } else {
                    root.element.classList.add('large');
                }
            }, false);

            root.class.add('asset-preview');
            root.element.insertBefore(canvas, root.innerElement);

            var renderPreview = function () {
                // resize canvas
                canvas.width = root.element.clientWidth;
                canvas.height = canvas.width;
                editor.call('preview:render:font', assets[0], canvas.width, function (sourceCanvas) {
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
            var evtMaterialChanged = editor.on('preview:font:changed', function (id) {
                if (id === assets[0].get('id'))
                    renderPreview();
            });

            paramsPanel.once('destroy', function() {
                canvas.remove();
                root.class.remove('asset-preview', 'animate');
            });
        }

        // characters
        var fieldChars = editor.call('attributes:addField', {
            parent: paramsPanel,
            type: 'string',
            name: 'Characters'
        });

        // reference
        editor.call('attributes:reference:attach', 'asset:font:characters', fieldChars.parent.innerElement.firstChild.ui);

        // Gets the characters of each asset and if the value
        // is the same returns it otherwise returns '...'
        var getCharsValue = function () {
            var value = null;
            for (var i = 0; i < proxyObservers.length; i++) {
                if (value === null) {
                    value = proxyObservers[i].get('chars');
                }
                else if (value !== proxyObservers[i].get('chars')) {
                    value = '...';
                    break;
                }
            }

            return value;
        };

        // Gets the characters of each asset
        // and sets it to the character input field
        var setCharsValue = function () {
            changingChars = true;

            var value = getCharsValue();
            if (value !== null)
                fieldChars.value = value;

            toggleSaveButton();

            changingChars = false;
        };

        // set up proxy observer list which is used
        // to allow the user to edit the characters of each font
        // without changing the meta.chars field which is changed
        // by the pipeline job. This also allows validation of the user
        // input.
        var changingChars = false;
        var proxyObservers = [];

        var createProxy = function (asset) {
            var proxy = new Observer({
                'id': asset.get('id'),
                'chars': asset.get('meta.chars')
            });

            proxyObservers.push(proxy);

            events.push(asset.on('meta.chars:set', function (value) {
                setCharsValue();
            }));
        };

        // Subscribe to meta.chars:set to update the character field
        assets.forEach(function (asset) {
            if (!asset.get('meta.chars')) {
                events.push(asset.once('meta.chars:set', function () {
                    createProxy(asset);
                    setCharsValue();
                }));

                return;
            }

            createProxy(asset);
        });

        // Change handler
        fieldChars.on('change', function (value) {
            // set the value to all proxies
            if (value !== '...') {
                proxyObservers.forEach(function (proxy) {
                    proxy.set('chars', value);
                });
            }

            if (changingChars || !value)
                return;

            // remove duplicate chars but keep same order
            var unique = '';
            var chars = {};

            for (var i = 0, len = value.length; i < len; i++) {
                if (chars[value[i]]) continue;
                chars[value[i]] = true;
                unique += value[i];
            }

            if (value !== unique) {
                value = unique;
                var prev = changingChars;
                changingChars = true;
                fieldChars.value = unique;
                changingChars = prev;
            }

            toggleSaveButton();
        });

        var panelSave = editor.call('attributes:addPanel', {
            parent: paramsPanel
        });
        panelSave.class.add('buttons');

        // save button
        var btnSave = new ui.Button({
            text: 'Process Font' + (assets.length > 1 ? 's' : '')
        });
        btnSave.style.flexGrow = 1;
        btnSave.style.width = '100%';
        btnSave.style.textAlign = 'center';

        panelSave.append(btnSave);

        // Enables or disabled the SAVE button
        var toggleSaveButton = function () {
            var value = getCharsValue();
            if (value === '...') {
                btnSave.disabled = true;
                return;
            }

            var tasksInProgress = false;

            for (var i = 0; i < assets.length; i++) {
                if (assets[i].get('task') === 'running') {
                    tasksInProgress = true;
                    break;
                }
            }

            btnSave.disabled = tasksInProgress;
        };


        toggleSaveButton();

        // subscribe to asset task updates to disable / enable the button
        assets.forEach(function (asset) {
            events.push(asset.on('task:set', toggleSaveButton));
        });

        // Trigger pipeline job
        btnSave.on('click', function () {
            var value = fieldChars.value;

            if (! value || value === '...')
                return;

            proxyObservers.forEach(function (proxy) {
                var asset = editor.call('assets:get', proxy.get('id'));
                if (! asset) return;

                var sourceId = asset.get('source_asset_id');
                if (! sourceId) return;

                var source = editor.call('assets:get', sourceId);
                if (! source) return;

                var task = {
                    source: parseInt(source.get('id'), 10),
                    target: parseInt(asset.get('id'), 10),
                    chars: value
                };

                editor.call('realtime:send', 'pipeline', {
                    name: 'convert',
                    data: task
                });
            });
        });

        // set initial value of character field
        changingChars = true;
        setCharsValue();
        changingChars = false;


        paramsPanel.once('destroy', function() {
            for(var i = 0; i < events.length; i++)
                events[i].unbind();
        });
    });
});
