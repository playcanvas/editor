editor.once('load', function() {
    'use strict';

    var toolbar = editor.call('layout.toolbar');

    var logo = new ui.Button();
    logo.class.add('logo');
    toolbar.append(logo);


    logo.on('click', function() {
        menu.open = true;
    });

    var menuData = {
        'edit': {
            title: 'Edit',
            items: {
                'undo': {
                    title: 'Undo',
                    icon: '&#57654;',
                    filter: function() {
                        return editor.call('history:canUndo');
                    },
                    select: function() {
                        editor.call('history:undo');
                    }
                },
                'redo': {
                    title: 'Redo',
                    icon: '&#57655;',
                    filter: function() {
                        return editor.call('history:canRedo');
                    },
                    select: function() {
                        editor.call('history:redo');
                    }
                },
                'delete': {
                    title: 'Delete',
                    icon: '&#58657;',
                    filter: function() {
                        return !! editor.call('selector:type');
                    },
                    select: function() {
                        var type = editor.call('selector:type');
                        if (! type) return;
                        var items = editor.call('selector:items');

                        if (type === 'entity') {
                            for(var i = 0; i < items.length; i++)
                                editor.call('entities:delete', items[i]);
                        } else if (type === 'asset') {
                            for(var i = 0; i < items.length; i++)
                                editor.call('assets:delete', items[i]);
                        }
                    }
                },
                'duplicate': {
                    title: 'Duplicate',
                    icon: '&#57908;',
                    filter: function() {
                        return editor.call('selector:type') === 'entity';
                    },
                    select: function() {
                        var type = editor.call('selector:type');
                        if (! type) return;
                        var items = editor.call('selector:items');

                        if (type === 'entity') {
                            editor.call('entities:duplicate', items[0]);
                        } else if (type === 'asset') {
                            // TODO
                            // duplicate asset
                        }
                    }
                }
            }
        },
        'entity': {
            title: 'Entity',
            items: {
                'new-entity': {
                    title: 'New Entity',
                    icon: '&#58468;',
                    select: function() {
                        var parent = null;
                        if (editor.call('selector:type') === 'entity')
                            parent = editor.call('selector:items')[0];

                        editor.call('entities:new', parent);
                    },
                    items: { }
                },
                'add-component': {
                    title: 'Add Component',
                    icon: '&#58468;',
                    filter: function() {
                        return editor.call('selector:type') === 'entity';
                    },
                    items: { }
                }
            }
        },
        'launch': {
            title: 'Launch',
            icon: '&#57922;',
            select: function() {
                var url = window.location.href.replace(/^https/, 'http') + '/launch';
                window.open(url, 'pc.launch.' + config.scene.id);
            }
        },
    };

    var componentsLogos = {
        'animation': '&#57972;',
        'audiolistener': '&#57959;',
        'audiosource': '&#57940;',
        'camera': '&#58756;',
        'collision': '&#58151;',
        'light': '&#58136;',
        'model': '&#58391;',
        'particlesystem': '&#58456;',
        'rigidbody': '&#58152;',
        'script': '&#57988;'
    };

    var makeMenuComponentItem = function(key) {
        return {
            title: components[key].title,
            icon: componentsLogos[key],
            filter: function() {
                if (editor.call('selector:type') !== 'entity')
                    return false;

                var entity = editor.call('selector:items')[0];
                return ! entity.has('components.' + key);
            },
            select: function() {
                if (editor.call('selector:type') !== 'entity')
                    return;

                var entity = editor.call('selector:items')[0];
                var component = this._value;

                var componentData = editor.call('components:getDefault', component);
                entity.set('components.' + component, componentData);

                // if it's a collision or rigidbody component then enable physics
                if (component === 'collision' || component === 'rigidbody')
                    editor.call('project:enablePhysics');
            }
        }
    };

    var components = editor.call('components:schema');
    var list = editor.call('components:list');
    for(var i = 0; i < list.length; i++) {
        var key = list[i];
        menuData['entity'].items['add-component'].items[key] = makeMenuComponentItem(key);
    }

    var root = editor.call('layout.root');

    var menu = ui.Menu.fromData(menuData);
    menu.position(48, 0);
    root.append(menu);
});
