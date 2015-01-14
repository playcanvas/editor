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

        // audiolistener.enabled
        var fieldEnabled = editor.call('attributes:addField', {
            parent: panel,
            name: 'Enabled',
            type: 'checkbox',
            link: entity,
            path: 'components.audiolistener.enabled'
        });
    });
});
