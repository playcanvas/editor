editor.once('load', function() {
    'use strict';

    var componentsLogos = editor.call('components:logos');

    var applyAdditions = function(object, additions) {
        if (additions) {
            Object.keys(additions).forEach(function(name) {
                object[name] = additions[name];
            });
        }
    };

    var createGroupElementComponentData = function(additions) {
        var data = editor.call('components:getDefault', 'element');
        data.type = 'group';

        applyAdditions(data, additions);

        return data;
    };

    var createImageElementComponentData = function(additions) {
        var data = editor.call('components:getDefault', 'element');
        data.type = 'image';

        applyAdditions(data, additions);

        return data;
    };

    var createTextElementComponentData = function(additions) {
        var data = editor.call('components:getDefault', 'element');
        data.type = 'text';
        data.text = 'Text';
        data.autoWidth = true;
        data.autoHeight = true;

        applyAdditions(data, additions);

        return data;
    };

    var createButtonEntityData = function(additions) {
        var data = {
            components: {
                button: editor.call('components:getDefault', 'button'),
                element: createImageElementComponentData({ useInput: true })
            },
            // The button component needs references to its Image entity, which is
            // only known post-creation. Defining these as a post-creation callback
            // means that they'll also be correctly resolved if the user undoes the
            // button creation and then redoes it.
            postCreationCallback: function(button) {
                button.history.enabled = false;
                button.set('components.button.imageEntity', button.entity.getGuid());
                button.history.enabled = true;
            }
        };

        applyAdditions(data, additions);

        return data;
    };

    var createScrollbarEntityData = function(orientation, additions) {
        var scrollbarComponentData = editor.call('components:getDefault', 'scrollbar');
        scrollbarComponentData.orientation = orientation;

        var containerData = createImageElementComponentData();
        var containerElementDefaults = editor.call('components:scrollbar:getContainerElementDefaultsForOrientation', orientation);
        applyAdditions(containerData, containerElementDefaults);

        var handleData = createButtonEntityData({ name: 'Handle' });
        var handleElementDefaults = editor.call('components:scrollbar:getHandleElementDefaultsForOrientation', orientation);
        applyAdditions(handleData.components.element, handleElementDefaults);

        var data = {
            components: {
                scrollbar: scrollbarComponentData,
                element: containerData
            },
            postCreationCallback: function(scrollbar) {
                scrollbar.history.enabled = false;
                scrollbar.set('components.scrollbar.handleEntity', scrollbar.entity.findByName('Handle').getGuid());
                scrollbar.history.enabled = true;
            },
            children: [
                handleData
            ]
        };

        applyAdditions(data, additions);

        return data;
    };

    editor.method('menu:entities:new', function (getParentFn) {
        if (! getParentFn)
            getParentFn = function () {return editor.call('entities:selectedFirst');};

        return {
            'add-new-entity': {
                title: 'Entity',
                className: 'menu-item-add-entity',
                icon: '&#57632;',
                select: function() {
                    editor.call('entities:new', {parent: getParentFn()});
                }
            },
            'audio-sub-menu': {
                title: 'Audio',
                className: 'menu-item-audio-sub-menu',
                icon: componentsLogos.sound,
                items: {
                    'add-new-listener': {
                        title: 'Audio Listener',
                        className: 'menu-item-add-audio-listener',
                        icon: componentsLogos.audiolistener,
                        select: function() {
                            editor.call('entities:new', {
                                name: 'Audio Listener',
                                parent: getParentFn(),
                                components: {
                                    audiolistener: editor.call('components:getDefault', 'audiolistener')
                                }
                            });
                        }
                    },
                    'add-new-audiosource': {
                        title: 'Audio Source',
                        className: 'menu-item-add-audio-source',
                        icon: componentsLogos.audiosource,
                        hide: function () {
                            return ! editor.call('settings:project').get('useLegacyAudio');
                        },
                        select: function() {
                            editor.call('entities:new', {
                                name: 'Audio Source',
                                parent: getParentFn(),
                                components: {
                                    audiosource: editor.call('components:getDefault', 'audiosource')
                                }
                            });
                        }
                    },
                    'add-new-sound': {
                        title: 'Sound',
                        className: 'menu-item-add-sound',
                        icon: componentsLogos.sound,
                        select: function() {
                            editor.call('entities:new', {
                                name: 'Sound',
                                parent: getParentFn(),
                                components: {
                                    sound: editor.call('components:getDefault', 'sound')
                                }
                            });
                        }
                    }
                }
            },
            'add-new-camera': {
                title: 'Camera',
                className: 'menu-item-add-camera',
                icon: componentsLogos.camera,
                select: function() {
                    editor.call('entities:new', {
                        name: 'Camera',
                        parent: getParentFn(),
                        components: {
                            camera: editor.call('components:getDefault', 'camera')
                        }
                    });
                }
            },
            'light-sub-menu': {
                title: 'Light',
                className: 'menu-item-light-sub-menu',
                icon: componentsLogos.point,
                items: {
                    'add-new-directional': {
                        title: 'Directional Light',
                        className: 'menu-item-add-directional-light',
                        icon: componentsLogos.directional,
                        select: function() {
                            var component = editor.call('components:getDefault', 'light');
                            component.type = 'directional';

                            editor.call('entities:new', {
                                name: 'Directional Light',
                                parent: getParentFn(),
                                components: {
                                    light: component
                                }
                            });
                        }
                    },
                    'add-new-point': {
                        title: 'Point Light',
                        className: 'menu-item-add-point-light',
                        icon: componentsLogos.point,
                        select: function() {
                            var component = editor.call('components:getDefault', 'light');
                            component.type = 'point';
                            component.shadowResolution = 256;

                            editor.call('entities:new', {
                                name: 'Point Light',
                                parent: getParentFn(),
                                components: {
                                    light: component
                                }
                            });
                        }
                    },
                    'add-new-spot': {
                        title: 'Spot Light',
                        className: 'menu-item-add-spot-light',
                        icon: componentsLogos.spot,
                        select: function() {
                            var component = editor.call('components:getDefault', 'light');
                            component.type = 'spot';

                            editor.call('entities:new', {
                                name: 'Spot Light',
                                parent: getParentFn(),
                                components: {
                                    light: component
                                }
                            });
                        }
                    }
                }
            },
            'add-new-model': {
                title: 'Model',
                className: 'menu-item-add-model',
                icon: componentsLogos.model,
                select: function() {
                    var component = editor.call('components:getDefault', 'model');
                    component.type = 'asset';

                    editor.call('entities:new', {
                        name: 'Model',
                        parent: getParentFn(),
                        components: {
                            model: component
                        }
                    });
                }
            },
            'add-new-particles': {
                title: 'Particle System',
                className: 'menu-item-add-particle-system',
                icon: componentsLogos.particlesystem,
                select: function() {
                    editor.call('entities:new', {
                        name: 'Particle System',
                        parent: getParentFn(),
                        components: {
                            particlesystem: editor.call('components:getDefault', 'particlesystem')
                        }
                    });
                }
            },
            'primitive-sub-menu': {
                title: 'Primitive',
                className: 'menu-item-primitive-sub-menu',
                icon: componentsLogos.model,
                items: {
                    'add-new-box': {
                        title: 'Box',
                        className: 'menu-item-add-box-primitive',
                        icon: componentsLogos.model,
                        select: function() {
                            var component = editor.call('components:getDefault', 'model');
                            component.type = 'box';

                            editor.call('entities:new', {
                                name: 'Box',
                                parent: getParentFn(),
                                components: {
                                    model: component
                                }
                            });
                        }
                    },
                    'add-new-capsule': {
                        title: 'Capsule',
                        className: 'menu-item-add-capsule-primitive',
                        icon: componentsLogos.model,
                        select: function() {
                            var component = editor.call('components:getDefault', 'model');
                            component.type = 'capsule';

                            editor.call('entities:new', {
                                name: 'Capsule',
                                parent: getParentFn(),
                                components: {
                                    model: component
                                }
                            });
                        }
                    },
                    'add-new-cone': {
                        title: 'Cone',
                        className: 'menu-item-add-cone-primitive',
                        icon: componentsLogos.model,
                        select: function() {
                            var component = editor.call('components:getDefault', 'model');
                            component.type = 'cone';

                            editor.call('entities:new', {
                                name: 'Cone',
                                parent: getParentFn(),
                                components: {
                                    model: component
                                }
                            });
                        }
                    },
                    'add-new-cylinder': {
                        title: 'Cylinder',
                        className: 'menu-item-add-cylinder-primitive',
                        icon: componentsLogos.model,
                        select: function() {
                            var component = editor.call('components:getDefault', 'model');
                            component.type = 'cylinder';

                            editor.call('entities:new', {
                                name: 'Cylinder',
                                parent: getParentFn(),
                                components: {
                                    model: component
                                }
                            });
                        }
                    },

                    'add-new-plane': {
                        title: 'Plane',
                        className: 'menu-item-add-plane-primitive',
                        icon: componentsLogos.model,
                        select: function() {
                            var component = editor.call('components:getDefault', 'model');
                            component.type = 'plane';

                            editor.call('entities:new', {
                                name: 'Plane',
                                parent: getParentFn(),
                                components: {
                                    model: component
                                }
                            });
                        }
                    },
                    'add-new-sphere': {
                        title: 'Sphere',
                        className: 'menu-item-add-sphere-primitive',
                        icon: componentsLogos.model,
                        select: function() {
                            var component = editor.call('components:getDefault', 'model');
                            component.type = 'sphere';

                            editor.call('entities:new', {
                                name: 'Sphere',
                                parent: getParentFn(),
                                components: {
                                    model: component
                                }
                            });
                        }
                    }
                }
            },
            'sprite-sub-menu': {
                title: 'Sprite',
                className: 'menu-item-sprite-sub-menu',
                icon: componentsLogos.sprite,
                items: {
                    'add-new-sprite': {
                        title: 'Sprite',
                        className: 'menu-item-add-sprite',
                        icon: componentsLogos.sprite,
                        select: function() {
                            var data = editor.call('components:getDefault', 'sprite');
                            editor.call('entities:new', {
                                name: 'Sprite',
                                parent: getParentFn(),
                                components: {
                                    sprite: data
                                }
                            });
                        }
                    },
                    'add-new-animated-sprite': {
                        title: 'Animated Sprite',
                        className: 'menu-item-add-animated-sprite',
                        icon: componentsLogos.sprite,
                        select: function() {
                            var data = editor.call('components:getDefault', 'sprite');
                            data.type = 'animated';
                            data.clips = {
                                '0': {
                                    name: 'Clip 1',
                                    fps: 10,
                                    loop: true,
                                    autoPlay: true,
                                    spriteAsset: null
                                }
                            };
                            data.autoPlayClip = 'Clip 1';
                            editor.call('entities:new', {
                                name: 'Animated Sprite',
                                parent: getParentFn(),
                                components: {
                                    sprite: data
                                }
                            });
                        }
                    }
                }
            },
            'ui-sub-menu': {
                title: 'User Interface',
                className: 'menu-item-ui-sub-menu',
                icon: componentsLogos.userinterface,
                items: {
                    'add-new-2d-screen': {
                        title: '2D Screen',
                        className: 'menu-item-add-2d-screen-ui',
                        icon: componentsLogos['2d-screen'],
                        select: function() {
                            var data = editor.call('components:getDefault', 'screen');
                            data.screenSpace = true;

                            editor.call('entities:new', {
                                name: '2D Screen',
                                parent: getParentFn(),
                                components: {
                                    screen: data
                                }
                            });
                        }
                    },
                    'add-new-3d-screen': {
                        title: '3D Screen',
                        className: 'menu-item-add-3d-screen-ui',
                        icon: componentsLogos['3d-screen'],
                        select: function() {
                            var data = editor.call('components:getDefault', 'screen');
                            data.screenSpace = false;

                            editor.call('entities:new', {
                                name: '3D Screen',
                                parent: getParentFn(),
                                scale: [0.01, 0.01, 0.01],
                                components: {
                                    screen: data
                                }
                            });
                        }
                    },
                    'add-new-text': {
                        title: 'Text Element',
                        className: 'menu-item-add-text-element-ui',
                        icon: componentsLogos['text-element'],
                        select: function() {
                            editor.call('entities:new', {
                                name: 'Text',
                                parent: getParentFn(),
                                components: {
                                    element: createTextElementComponentData()
                                }
                            });
                        }
                    },
                    'add-new-image': {
                        title: 'Image Element',
                        className: 'menu-item-add-image-element-ui',
                        icon: componentsLogos['image-element'],
                        select: function() {
                            editor.call('entities:new', {
                                name: 'Image',
                                parent: getParentFn(),
                                components: {
                                    element: createImageElementComponentData()
                                }
                            });
                        }
                    },
                    'add-new-group': {
                        title: 'Element Group',
                        className: 'menu-item-add-element-group-ui',
                        icon: componentsLogos['group-element'],
                        select: function() {
                            var data = editor.call('components:getDefault', 'element');
                            data.type = 'group';
                            editor.call('entities:new', {
                                name: 'Group',
                                parent: getParentFn(),
                                components: {
                                    element: createGroupElementComponentData()
                                }
                            });
                        }
                    },
                    'add-new-button': {
                        title: 'Button Element',
                        className: 'menu-item-add-button-element-ui',
                        icon: componentsLogos.button,
                        select: function() {
                            editor.call('entities:new', createButtonEntityData({
                                name: 'Button',
                                parent: getParentFn(),
                                children: [
                                    {
                                        name: 'Text',
                                        components: {
                                            element: createTextElementComponentData()
                                        }
                                    }
                                ]
                            }));
                        }
                    },
                    'add-new-scroll-view': {
                        title: 'Scroll View Element',
                        className: 'menu-item-add-scroll-view-element-ui',
                        icon: componentsLogos.scrollview,
                        select: function() {
                            var viewportSize = 200;
                            var scrollbarSize = 20;

                            editor.call('entities:new', {
                                name: 'ScrollView',
                                parent: getParentFn(),
                                components: {
                                    scrollview: editor.call('components:getDefault', 'scrollview'),
                                    element: createGroupElementComponentData({
                                        width: viewportSize,
                                        height: viewportSize,
                                        pivot: [0, 1]
                                    })
                                },
                                postCreationCallback: function(scrollView) {
                                    scrollView.history.enabled = false;
                                    scrollView.set('components.scrollview.viewportEntity', scrollView.entity.findByName('Viewport').getGuid());
                                    scrollView.set('components.scrollview.contentEntity', scrollView.entity.findByName('Content').getGuid());
                                    scrollView.set('components.scrollview.verticalScrollbarEntity', scrollView.entity.findByName('VerticalScrollbar').getGuid());
                                    scrollView.set('components.scrollview.horizontalScrollbarEntity', scrollView.entity.findByName('HorizontalScrollbar').getGuid());
                                    scrollView.history.enabled = true;
                                },
                                children: [
                                    {
                                        name: 'Viewport',
                                        components: {
                                            element: createImageElementComponentData({
                                                anchor: [0, 0, 1, 1],
                                                margin: [0, scrollbarSize, scrollbarSize, 0],
                                                pivot: [0, 1],
                                                color: [.2, .2, .2],
                                                mask: true
                                            })
                                        },
                                        children: [
                                            {
                                                name: 'Content',
                                                components: {
                                                    element: createGroupElementComponentData({
                                                        anchor: [0, 1, 0, 1],
                                                        margin: [0, 0, 0, 0],
                                                        width: viewportSize * 2,
                                                        height: viewportSize * 2,
                                                        pivot: [0, 1],
                                                        useInput: true
                                                    })
                                                }
                                            }
                                        ]
                                    },
                                    createScrollbarEntityData(ORIENTATION_HORIZONTAL, {
                                        name: 'HorizontalScrollbar'
                                    }),
                                    createScrollbarEntityData(ORIENTATION_VERTICAL, {
                                        name: 'VerticalScrollbar'
                                    })
                                ]
                            });
                        }
                    },
                    'add-new-scrollbar': {
                        title: 'Scrollbar Element',
                        className: 'menu-item-add-scrollbar-element-ui',
                        icon: componentsLogos.scrollbar,
                        select: function() {
                            editor.call('entities:new', createScrollbarEntityData(ORIENTATION_VERTICAL, {
                                name: 'Scrollbar',
                                parent: getParentFn()
                            }));
                        }
                    }
                }
            }
        };
    });
});
