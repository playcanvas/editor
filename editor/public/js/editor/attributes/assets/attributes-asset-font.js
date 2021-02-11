editor.once('load', function () {
    'use strict';

    // get characters between range (inclusive)
    var characterRange = function (from, to) {
        var chars = [];
        for (let i = from; i <= to; i++) {
            chars.push(String.fromCharCode(i));
        }

        return chars.join('');
    };

    // character presets
    var LATIN = characterRange(0x20, 0x7e);
    var LATIN_SUPPLEMENT = characterRange(0xA0, 0xFF);
    var CYRILLIC = characterRange(0x400, 0x4ff);
    var GREEK = characterRange(0x370, 0x3FF);

    editor.on('attributes:inspect[asset]', function (assets) {
        const hasPcuiAssetInspectors = editor.call('users:hasFlag', 'hasPcuiAssetInspectors');
        if (hasPcuiAssetInspectors)
            return;
        var root = editor.call('attributes.rootPanel');

        for (let i = 0; i < assets.length; i++) {
            if (assets[i].get('type') !== 'font' || assets[i].get('source'))
                return;
        }

        var events = [];

        if (assets.length > 1)
            editor.call('attributes:header', assets.length + ' Fonts');

        // Properties
        var panelProperties = editor.call('attributes:addPanel', {
            name: "Properties"
        });
        panelProperties.class.add('component');

        var fontIntensity = editor.call('attributes:addField', {
            parent: panelProperties,
            name: 'Intensity',
            type: 'number',
            min: 0,
            max: 1,
            link: assets,
            path: 'data.intensity'
        });
        fontIntensity.style.width = '32px';

        // reference
        editor.call('attributes:reference:attach', 'asset:font:intensity', fontIntensity.parent.innerElement.firstChild.ui);

        var fontIntensitySlider = editor.call('attributes:addField', {
            panel: fontIntensity.parent,
            slider: true,
            type: 'number',
            min: 0,
            max: 1,
            link: assets,
            path: 'data.intensity'
        });

        fontIntensitySlider.flexGrow = 4;

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

                fieldFrom.value = '0x' + set.charCodeAt(0).toString(16);
                fieldTo.value = '0x' + set.charCodeAt(set.length - 1).toString(16);
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
            text: '&#57632;'
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
            var previewContainer = new pcui.Container({
                class: 'asset-preview-container'
            });

            var preview = document.createElement('canvas');
            var ctx = preview.getContext('2d');
            preview.width = 256;
            preview.height = 256;
            preview.classList.add('asset-preview');
            preview.classList.add('flipY');
            previewContainer.append(preview);

            var previewRenderer = new pcui.FontThumbnailRenderer(assets[0], preview);

            preview.addEventListener('click', function () {
                if (root.class.contains('large')) {
                    root.class.remove('large');
                } else {
                    root.class.add('large');
                }

                queueRender();
            }, false);

            root.class.add('asset-preview');
            root.prepend(previewContainer);

            var renderQueued;

            var renderPreview = function () {
                if (renderQueued)
                    renderQueued = false;

                // render
                preview.width = previewContainer.width;
                preview.height = previewContainer.height;
                previewRenderer.render();
            };
            renderPreview();

            // queue up the rendering to prevent too oftern renders
            var queueRender = function () {
                if (renderQueued) return;
                renderQueued = true;
                requestAnimationFrame(renderPreview);
            };

            // render on resize
            var evtPanelResize = root.on('resize', queueRender);

            paramsPanel.once('destroy', function () {
                root.class.remove('asset-preview', 'animate');

                if (previewRenderer) {
                    previewRenderer.destroy();
                    previewRenderer = null;
                }

                evtPanelResize.unbind();

                paramsPanel = null;
            });
        }

        // set up proxy observer list which is used
        // to allow the user to edit meta data of each font only locally
        // Then when process font is clicked the pipeline takes care of
        // saving those meta fields in the db
        var proxyObservers = [];

        var createProxy = function (asset) {
            var proxy = new Observer({
                'id': asset.get('id'),
                'chars': asset.get('meta.chars'),
                'invert': !!asset.get('meta.invert'),
                'pxrange': asset.get('meta.pxrange')
            });

            proxyObservers.push(proxy);

            events.push(asset.on('meta.chars:set', function (value) {
                proxy.set('chars', value);
            }));

            events.push(asset.on('meta.invert:set', function (value) {
                proxy.set('invert', value);
            }));

            events.push(asset.on('meta.pxrange:set', function (value) {
                proxy.set('pxrange', value);
            }));
        };

        // create proxy observer for each asset
        assets.forEach(createProxy);

        // characters
        var fieldChars = editor.call('attributes:addField', {
            parent: paramsPanel,
            type: 'string',
            name: 'Characters',
            link: proxyObservers,
            path: 'chars'
        });

        // Change handler
        fieldChars.on('change', toggleSaveButton);

        // reference
        editor.call('attributes:reference:attach', 'asset:font:characters', fieldChars.parent.innerElement.firstChild.ui);

        // invert
        var fieldInvert = editor.call('attributes:addField', {
            parent: paramsPanel,
            type: 'checkbox',
            name: 'Invert',
            link: proxyObservers,
            path: 'invert'
        });
        // fieldInvert.parent.hidden = true;

        // reference
        editor.call('attributes:reference:attach', 'asset:font:invert', fieldInvert.parent.innerElement.firstChild.ui);

        // signed distance range
        var fieldRange = editor.call('attributes:addField', {
            parent: paramsPanel,
            type: 'number',
            name: 'MSDF Range',
            link: proxyObservers,
            path: 'pxrange',
            min: 0,
            max: 15,
            step: 1,
            precision: 0
        });

        fieldRange.style.width = '32px';

        // hide for now
        fieldRange.parent.hidden = true;

        // reference
        editor.call('attributes:reference:attach', 'asset:font:pxrange', fieldRange.parent.innerElement.firstChild.ui);


        var fieldRangeSlider = editor.call('attributes:addField', {
            panel: fieldRange.parent,
            type: 'number',
            link: proxyObservers,
            path: 'pxrange',
            min: 0,
            max: 15,
            step: 1,
            slider: true,
            precision: 0
        });

        fieldRangeSlider.flexGrow = 4;

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
            var sameChars = true;
            var lastChars = proxyObservers[0].get('chars');
            for (let i = 1; i < proxyObservers.length; i++) {
                if (proxyObservers[i].get('chars') !== lastChars) {
                    sameChars = false;
                    break;
                }
            }

            if (! sameChars) {
                btnSave.disabled = true;
                return;
            }

            var tasksInProgress = false;

            for (let i = 0; i < assets.length; i++) {
                if (!editor.call('assets:get', assets[i].get('source_asset_id'))) {
                    btnSave.disabled = true;
                    return;
                }

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

                // remove duplicate chars
                // remove duplicate chars but keep same order
                var unique = '';
                var chars = {};

                for (let i = 0, len = value.length; i < len; i++) {
                    if (chars[value[i]]) continue;
                    chars[value[i]] = true;
                    unique += value[i];
                }

                var task = {
                    source: parseInt(source.get('uniqueId'), 10),
                    target: parseInt(asset.get('uniqueId'), 10),
                    chars: unique,
                    invert: fieldInvert.value
                };

                // if (fieldRange.value !== null)
                //     task.pxrange = fieldRange.value;

                editor.call('realtime:send', 'pipeline', {
                    name: 'convert',
                    data: task
                });
            });
        });

        paramsPanel.once('destroy', function () {
            for (let i = 0; i < events.length; i++)
                events[i].unbind();
        });
    });
});
