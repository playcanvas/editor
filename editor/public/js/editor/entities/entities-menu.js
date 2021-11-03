editor.once('load', () => {
    'use strict';

    var componentsLogos = editor.call('components:logos');

    var applyAdditions = function (object, additions) {
        if (additions) {
            Object.keys(additions).forEach(function (name) {
                object[name] = additions[name];
            });
        }
    };

    var createGroupElementComponentData = function (additions) {
        var data = editor.call('components:getDefault', 'element');
        data.type = 'group';

        applyAdditions(data, additions);

        return data;
    };

    var createImageElementComponentData = function (additions) {
        var data = editor.call('components:getDefault', 'element');
        data.type = 'image';

        applyAdditions(data, additions);

        return data;
    };

    var createTextElementComponentData = function (additions) {
        var data = editor.call('components:getDefault', 'element');
        data.type = 'text';
        data.text = 'Text';
        data.autoWidth = true;
        data.autoHeight = true;

        applyAdditions(data, additions);

        return data;
    };

    var createButtonEntityData = function (additions) {
        var data = {
            components: {
                button: editor.call('components:getDefault', 'button'),
                element: createImageElementComponentData({ useInput: true })
            },
            // The button component needs references to its Image entity, which is
            // only known post-creation. Defining these as a post-creation callback
            // means that they'll also be correctly resolved if the user undoes the
            // button creation and then redoes it.
            postCreationCallback: function (button) {
                const history = button.history.enabled;
                button.history.enabled = false;
                button.set('components.button.imageEntity', button.get('resource_id'));
                button.history.enabled = history;
            }
        };

        applyAdditions(data, additions);

        return data;
    };

    var createScrollbarEntityData = function (orientation, additions) {
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
            postCreationCallback: function (scrollbar) {
                const history = scrollbar.history.enabled;
                scrollbar.history.enabled = false;
                scrollbar.set('components.scrollbar.handleEntity', scrollbar.findByName('Handle').get('resource_id'));
                scrollbar.history.enabled = history;
            },
            children: [
                handleData
            ]
        };

        applyAdditions(data, additions);

        return data;
    };

    var createPrimitiveEntityData = function (type, additions) {
        var data = {
            components: {}
        };

        var component = 'render';
        data.components[component] = editor.call('components:getDefault', component);
        data.components[component].type = type;
        data.components.render.materialAssets = [null];

        applyAdditions(data, additions);

        return data;
    };

    editor.method('menu:entities:new', function (getParentFn) {
        if (! getParentFn)
            getParentFn = () => { return editor.call('entities:selectedFirst'); };

        return [{
            // add new entity
            text: 'Entity',
            icon: 'E120',
            onSelect: () => {
                editor.call('entities:new', { parent: getParentFn() });
            }
        }, {
            text: 'Audio',
            icon: componentsLogos.sound,
            items: [{
                text: 'Audio Listener',
                icon: componentsLogos.audiolistener,
                onSelect: () => {
                    editor.call('entities:new', {
                        name: 'Audio Listener',
                        parent: getParentFn(),
                        components: {
                            audiolistener: editor.call('components:getDefault', 'audiolistener')
                        }
                    });
                }
            }, {
                text: 'Audio Source',
                icon: componentsLogos.audiosource,
                onIsVisible: () => {
                    return editor.call('settings:project').get('useLegacyAudio');
                },
                onSelect: () => {
                    editor.call('entities:new', {
                        name: 'Audio Source',
                        parent: getParentFn(),
                        components: {
                            audiosource: editor.call('components:getDefault', 'audiosource')
                        }
                    });
                }
            }, {
                text: 'Sound',
                icon: componentsLogos.sound,
                onSelect: () => {
                    editor.call('entities:new', {
                        name: 'Sound',
                        parent: getParentFn(),
                        components: {
                            sound: editor.call('components:getDefault', 'sound')
                        }
                    });
                }
            }]
        }, {
            text: 'Camera',
            icon: componentsLogos.camera,
            onSelect: () => {
                editor.call('entities:new', {
                    name: 'Camera',
                    parent: getParentFn(),
                    components: {
                        camera: editor.call('components:getDefault', 'camera')
                    }
                });
            }
        }, {
            text: 'Light',
            icon: componentsLogos.point,
            items: [{
                text: 'Directional Light',
                icon: componentsLogos.directional,
                onSelect: () => {
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
            }, {
                text: 'Point Light',
                icon: componentsLogos.point,
                onSelect: () => {
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
            }, {
                text: 'Spot Light',
                icon: componentsLogos.spot,
                onSelect: () => {
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
            }]
        }, {
            text: 'Render',
            icon: componentsLogos.render,
            onSelect: () => {
                var component = editor.call('components:getDefault', 'render');
                component.type = 'asset';

                editor.call('entities:new', {
                    name: 'Render',
                    parent: getParentFn(),
                    components: {
                        render: component
                    }
                });
            }
        }, {
            text: 'Particle System',
            icon: componentsLogos.particlesystem,
            onSelect: () => {
                editor.call('entities:new', {
                    name: 'Particle System',
                    parent: getParentFn(),
                    components: {
                        particlesystem: editor.call('components:getDefault', 'particlesystem')
                    }
                });
            }
        }, {
            text: 'Primitive',
            icon: componentsLogos.render,
            items: [{
                text: 'Box',
                icon: componentsLogos.render,
                onSelect: () => {
                    var data = createPrimitiveEntityData('box', {
                        name: 'Box',
                        parent: getParentFn()
                    });
                    editor.call('entities:new', data);
                }
            }, {
                text: 'Capsule',
                icon: componentsLogos.render,
                onSelect: () => {
                    var data = createPrimitiveEntityData('capsule', {
                        name: 'Capsule',
                        parent: getParentFn()
                    });
                    editor.call('entities:new', data);
                }
            }, {
                text: 'Cone',
                icon: componentsLogos.render,
                onSelect: () => {
                    var data = createPrimitiveEntityData('cone', {
                        name: 'Cone',
                        parent: getParentFn()
                    });
                    editor.call('entities:new', data);
                }
            }, {
                text: 'Cylinder',
                icon: componentsLogos.render,
                onSelect: () => {
                    var data = createPrimitiveEntityData('cylinder', {
                        name: 'Cylinder',
                        parent: getParentFn()
                    });
                    editor.call('entities:new', data);
                }
            }, {
                text: 'Plane',
                icon: componentsLogos.render,
                onSelect: () => {
                    var data = createPrimitiveEntityData('plane', {
                        name: 'Plane',
                        parent: getParentFn()
                    });
                    editor.call('entities:new', data);
                }
            }, {
                text: 'Sphere',
                icon: componentsLogos.render,
                onSelect: () => {
                    var data = createPrimitiveEntityData('sphere', {
                        name: 'Sphere',
                        parent: getParentFn()
                    });
                    editor.call('entities:new', data);
                }
            }]
        }, {
            text: 'Sprite',
            icon: componentsLogos.sprite,
            items: [{
                text: 'Sprite',
                icon: componentsLogos.sprite,
                onSelect: () => {
                    var data = editor.call('components:getDefault', 'sprite');
                    editor.call('entities:new', {
                        name: 'Sprite',
                        parent: getParentFn(),
                        components: {
                            sprite: data
                        }
                    });
                }
            }, {
                text: 'Animated Sprite',
                icon: componentsLogos.sprite,
                onSelect: () => {
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
            }]
        }, {
            text: 'User Interface',
            icon: componentsLogos.userinterface,
            items: [{
                text: '2D Screen',
                icon: componentsLogos['2d-screen'],
                onSelect: () => {
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
            }, {
                text: '3D Screen',
                icon: componentsLogos['3d-screen'],
                onSelect: () => {
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
            }, {
                text: 'Text Element',
                icon: componentsLogos['text-element'],
                onSelect: () => {
                    editor.call('entities:new', {
                        name: 'Text',
                        parent: getParentFn(),
                        components: {
                            element: createTextElementComponentData()
                        }
                    });
                }
            }, {
                text: 'Image Element',
                icon: componentsLogos['image-element'],
                onSelect: () => {
                    editor.call('entities:new', {
                        name: 'Image',
                        parent: getParentFn(),
                        components: {
                            element: createImageElementComponentData()
                        }
                    });
                }
            }, {
                text: 'Element Group',
                icon: componentsLogos['group-element'],
                onSelect: () => {
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
            }, {
                text: 'Button Element',
                icon: componentsLogos.button,
                onSelect: () => {
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
            }, {
                text: 'Scroll View Element',
                icon: componentsLogos.scrollview,
                onSelect: () => {
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
                        postCreationCallback: function (scrollView) {
                            const history = scrollView.history.enabled;
                            scrollView.history.enabled = false;
                            scrollView.set('components.scrollview.viewportEntity', scrollView.findByName('Viewport').get('resource_id'));
                            scrollView.set('components.scrollview.contentEntity', scrollView.findByName('Content').get('resource_id'));
                            scrollView.set('components.scrollview.verticalScrollbarEntity', scrollView.findByName('VerticalScrollbar').get('resource_id'));
                            scrollView.set('components.scrollview.horizontalScrollbarEntity', scrollView.findByName('HorizontalScrollbar').get('resource_id'));
                            scrollView.history.enabled = history;
                        },
                        children: [
                            {
                                name: 'Viewport',
                                components: {
                                    element: createImageElementComponentData({
                                        anchor: [0, 0, 1, 1],
                                        margin: [0, scrollbarSize, scrollbarSize, 0],
                                        pivot: [0, 1],
                                        color: [0.2, 0.2, 0.2],
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
            }, {
                text: 'Scrollbar Element',
                icon: componentsLogos.scrollbar,
                onSelect: () => {
                    editor.call('entities:new', createScrollbarEntityData(ORIENTATION_VERTICAL, {
                        name: 'Scrollbar',
                        parent: getParentFn()
                    }));
                }
            }]
        }];
    });
});
