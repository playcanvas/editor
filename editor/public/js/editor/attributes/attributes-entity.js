editor.once('load', function() {
    'use strict';

    var panelComponents;

    editor.method('attributes:entity.panelComponents', function() {
        return panelComponents;
    });

    // add component menu
    var menuAddComponent = new ui.Menu();
    var currentEntity = null;
    var components = editor.call('components:schema');
    var list = editor.call('components:list');
    for(var i = 0; i < list.length; i++) {
        menuAddComponent.append(new ui.MenuItem({
            text: components[list[i]].title,
            value: list[i]
        }));
    }
    menuAddComponent.on('open', function() {
        for(var i = 0; i < list.length; i++)
            this.findByPath([ list[i] ]).disabled = currentEntity.has('components.' + list[i]);
    });
    menuAddComponent.on('select', function(path) {
        if (! currentEntity) return;

        var componentData = editor.call('components:getDefault', path[0]);
        currentEntity.set('components.' + path[0], componentData);

        // if it's a collision or rigidbody component then enable physics
        if (path[0] === 'collision' || path[0] === 'rigidbody')
            editor.call('project:enablePhysics');
    });
    editor.call('layout.root').append(menuAddComponent);


    editor.on('attributes:inspect[entity]', function(entities) {
        if (entities.length !== 1)
            return;

        var entity = entities[0];
        currentEntity = entity;

        // panel
        var panel = editor.call('attributes:addPanel');
        panel.class.add('component');

        // enabled
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Enabled',
            type: 'checkbox',
            link: entity,
            path: 'enabled'
        });

        // name
        editor.call('attributes:addField', {
            parent: panel,
            name: 'Name',
            type: 'string',
            link: entity,
            path: 'name'
        });

        // position
        var fieldPosition = editor.call('attributes:addField', {
            parent: panel,
            name: 'Position',
            placeholder: [ 'X', 'Y', 'Z' ],
            precision: 3,
            step: .05,
            type: 'vec3',
            link: entity,
            path: 'position'
        });

        // rotation
        var fieldRotation = editor.call('attributes:addField', {
            parent: panel,
            name: 'Rotation',
            placeholder: [ 'X', 'Y', 'Z' ],
            precision: 2,
            step: .1,
            type: 'vec3',
            link: entity,
            path: 'rotation'
        });

        // scale
        var fieldScale = editor.call('attributes:addField', {
            parent: panel,
            name: 'Scale',
            placeholder: [ 'X', 'Y', 'Z' ],
            precision: 3,
            step: .05,
            type: 'vec3',
            link: entity,
            path: 'scale'
        });


        // components
        panelComponents = editor.call('attributes:addPanel');

        // add component
        var btnAddComponent = new ui.Button();
        btnAddComponent.text = 'Add Component';
        btnAddComponent.class.add('add-component');
        btnAddComponent.on('click', function(evt) {
            menuAddComponent.position(evt.clientX, evt.clientY);
            menuAddComponent.open = true;
        });
        panel.append(btnAddComponent);


        // // json panel
        // var panelJson = editor.call('attributes:addPanel', {
        //     name: 'JSON'
        // });

        // // code
        // var fieldJson = editor.call('attributes:addField', {
        //     parent: panelJson,
        //     type: 'code'
        // });

        // fieldJson.text = JSON.stringify(entity.json(), null, 4);

        // // changes
        // var evtSet = entity.on('*:set', function() {
        //     // console.log('set', arguments)
        //     fieldJson.text = JSON.stringify(entity.json(), null, 4);
        // });
        // var evtUnset = entity.on('*:unset', function() {
        //     // console.log('unset', arguments)
        //     fieldJson.text = JSON.stringify(entity.json(), null, 4);
        // });
        // var evtInsert = entity.on('*:insert', function() {
        //     // console.log('insert', arguments)
        //     fieldJson.text = JSON.stringify(entity.json(), null, 4);
        // });
        // var evtRemove = entity.on('*:remove', function() {
        //     // console.log('remove', arguments)
        //     fieldJson.text = JSON.stringify(entity.json(), null, 4);
        // });
        // var evtMove = entity.on('*:move', function() {
        //     // console.log('move', arguments)
        //     fieldJson.text = JSON.stringify(entity.json(), null, 4);
        // });

        // fieldJson.on('destroy', function() {
        //     evtSet.unbind();
        //     evtUnset.unbind();
        //     evtInsert.unbind();
        //     evtRemove.unbind();
        //     evtMove.unbind();
        // });
    });
});
