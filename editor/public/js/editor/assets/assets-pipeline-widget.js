editor.once('load', function() {
    'use strict';

    var root = editor.call('layout.root');
    var assetsPanel = editor.call('layout.assets');
    var viewport = editor.call('layout.viewport');

    var settings = editor.call('settings:projectUser');

    // panel
    var panel = new ui.Panel('ASSET TASKS');
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
        editor.call('selector:set', 'editorSettings', [ editor.call('settings:projectUser') ]);
        setTimeout(function() {
            editor.call('editorSettings:panel:unfold', 'pipeline');
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

        settings.set('editor.pipeline.autoRun', ! settings.get('editor.pipeline.autoRun'));
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
    settings.on('editor.pipeline.autoRun:set', toggleAutoSet);
    panel.append(toggleAuto);

    var tooltipAuto = Tooltip.attach({
        target: toggleAuto.element,
        text: 'Auto-Run',
        align: 'bottom',
        root: root
    });

    toggleAutoSet(settings.get('editor.pipeline.autoRun'));

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
