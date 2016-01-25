editor.once('load', function() {
    'use strict';

    if (! config.owner.superUser)
        return;

    var root = editor.call('layout.root');
    var toolbar = editor.call('layout.toolbar');

    // coordinate system
    var buttonBake = new ui.Button({
        text: '&#57745;'
    });
    buttonBake.class.add('pc-icon', 'light-mapper');
    toolbar.append(buttonBake);

    buttonBake.on('click', function () {
        editor.call('viewport:framework').lightMapper.bake();
    });


    // tooltip
    var tooltipBake = Tooltip.attach({
        target: buttonBake.element,
        align: 'left',
        root: root
    });
    tooltipBake.class.add('light-mapper');
    tooltipBake.hoverable = true;

    var elHeader = document.createElement('span');
    elHeader.classList.add('header');
    elHeader.textContent = 'Light Mapper';
    tooltipBake.innerElement.appendChild(elHeader);

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
        console.log('call auto-unwrap');
    });


    // manage if uv1 is missing
    var uv1Missing = false;

    editor.method('lightMapper:uv1missing', function(state) {
        if (state === undefined)
            return uv1Missing;

        if (uv1Missing === state)
            return;

        uv1Missing = state;
        editor.emit('lightMapper:uv1Missing', uv1Missing);
    });

    tooltipBake.on('show', function() {
        if (uv1Missing) {
            elUV1.classList.remove('hidden');
        } else {
            elUV1.classList.add('hidden');
        }
    });
});


