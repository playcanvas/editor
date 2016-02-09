editor.once('load', function() {
    'use strict';

    if (! config.owner.superUser)
        return;

    var app;
    var root = editor.call('layout.root');
    var toolbar = editor.call('layout.toolbar');

    // coordinate system
    var buttonBake = new ui.Button({
        text: '&#57745;'
    });
    buttonBake.class.add('pc-icon', 'light-mapper');
    toolbar.append(buttonBake);

    buttonBake.on('click', function () {
        editor.call('lightmapper:bake');
    });
    editor.on('lightmapper:uv1Missing', function(state) {
        if (state) {
            buttonBake.class.add('active');
        } else {
            buttonBake.class.remove('active');
        }
    });


    // tooltip
    var tooltipBake = Tooltip.attach({
        target: buttonBake.element,
        align: 'left',
        root: root
    });
    tooltipBake.class.add('light-mapper');
    tooltipBake.hoverable = true;


    // header
    var elHeader = document.createElement('span');
    elHeader.classList.add('header');
    elHeader.textContent = 'Light Mapper';
    tooltipBake.innerElement.appendChild(elHeader);


    // auto toggle
    var elAuto = document.createElement('div');
    elAuto.classList.add('auto-toggle');
    tooltipBake.innerElement.appendChild(elAuto);

    var checkAuto = new ui.Checkbox();
    checkAuto.class.add('tick');
    checkAuto.parent = tooltipBake;
    elAuto.appendChild(checkAuto.element);
    editor.on('lightmapper:auto', function(state) {
        checkAuto.value = state;
    });
    checkAuto.on('change', function(value) {
        editor.call('lightmapper:auto', value);
    });

    var labelAuto = new ui.Label({ text: 'Auto Rebake' });
    labelAuto.parent = tooltipBake;
    elAuto.appendChild(labelAuto.element);



    // uv1 missing
    var elUV1 = document.createElement('div');
    elUV1.classList.add('uv1');
    elUV1.textContent = 'UV1 is missing on some models. Please upload models with UV1 or use ';
    tooltipBake.innerElement.appendChild(elUV1);

    var btnAutoUnwrap = new ui.Button({
        text: 'Auto-Unwrap'
    });
    btnAutoUnwrap.parent = tooltipBake;
    elUV1.appendChild(btnAutoUnwrap.element);
    btnAutoUnwrap.on('click', function() {
        if (! uv1Missing)
            return;

        var assetIds = Object.keys(uv1MissingAssets);
        for(var i = 0; i < assetIds.length; i++) {
            if (! uv1MissingAssets.hasOwnProperty(assetIds[i]))
                continue;

            var asset = uv1MissingAssets[assetIds[i]];
            editor.call('assets:model:unwrap', asset);
        }
    });


    // hotkey ctrl+b
    editor.call('hotkey:register', 'lightmapper:bake', {
        key: 'b',
        ctrl: true,
        callback: function() {
            editor.call('lightmapper:bake');
        }
    });


    // manage if uv1 is missing
    var uv1Missing = false;
    var uv1MissingAssets = { };

    editor.on('assets:model:unwrap', function(asset) {
        if (! uv1MissingAssets[asset.get('id')])
            return;

        delete uv1MissingAssets[asset.get('id')];
        editor.call('lightmapper:uv1missing', uv1MissingAssets);
    })

    editor.method('lightmapper:uv1missing', function(assets) {
        if (assets === undefined)
            return uv1Missing;

        uv1MissingAssets = assets;

        var state = Object.keys(assets).length !== 0

        if (uv1Missing === state)
            return;

        uv1Missing = state;
        editor.emit('lightmapper:uv1Missing', uv1Missing);
    });

    tooltipBake.on('show', function() {
        if (uv1Missing) {
            elUV1.classList.remove('hidden');
        } else {
            elUV1.classList.add('hidden');
        }
    });
});
