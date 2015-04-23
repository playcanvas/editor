editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[entity]', function(entities) {
        if (entities.length !== 1)
            return;

        var entity = entities[0];

        var panelComponents = editor.call('attributes:entity.panelComponents');
        if (! panelComponents)
            return;


        // audiolistener
        var panel = editor.call('attributes:addPanel', {
            parent: panelComponents,
            name: 'Audio Listener'
        });
        panel.class.add('component');

        // reference
        editor.call('attributes:reference:audiolistener:attach', panel, panel.headerElement);

        if (! entity.get('components.audiolistener')) {
            panel.disabled = true;
            panel.hidden = true;
        }
        var evtComponentSet = entity.on('components.audiolistener:set', function(value) {
            panel.disabled = ! value;
            panel.hidden = ! value;
        });
        var evtComponentUnset = entity.on('components.audiolistener:unset', function() {
            panel.disabled = true;
            panel.hidden = true;
        });
        panel.on('destroy', function() {
            evtComponentSet.unbind();
            evtComponentUnset.unbind();
        });


        // enabled
        var fieldEnabled = new ui.Checkbox();
        fieldEnabled.class.add('component-toggle');
        fieldEnabled.link(entity, 'components.audiolistener.enabled');
        panel.headerElement.appendChild(fieldEnabled.element);
        panel.headerAppend(fieldEnabled);

        // remove
        var fieldRemove = new ui.Button();
        fieldRemove.class.add('component-remove');
        fieldRemove.on('click', function(value) {
            entity.unset('components.audiolistener');
        });
        panel.headerElement.appendChild(fieldRemove.element);
        panel.headerAppend(fieldRemove);
    });
});
