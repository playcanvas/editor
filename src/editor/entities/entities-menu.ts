import { COMPONENT_LOGOS, ORIENTATION_HORIZONTAL, ORIENTATION_VERTICAL } from '@/core/constants';

editor.once('load', () => {
    const applyAdditions = (object, additions) => {
        if (additions) {
            Object.keys(additions).forEach((name) => {
                object[name] = additions[name];
            });
        }
    };

    const createGroupElementComponentData = (additions?) => {
        const data = editor.call('components:getDefault', 'element');
        data.type = 'group';

        applyAdditions(data, additions);

        return data;
    };

    const createImageElementComponentData = (additions?) => {
        const data = editor.call('components:getDefault', 'element');
        data.type = 'image';

        applyAdditions(data, additions);

        return data;
    };

    const createTextElementComponentData = (additions?) => {
        const data = editor.call('components:getDefault', 'element');
        data.type = 'text';
        data.text = 'Text';
        data.autoWidth = true;
        data.autoHeight = true;

        applyAdditions(data, additions);

        return data;
    };

    const createButtonTextElementComponentData = (additions?) => {
        const data = editor.call('components:getDefault', 'element');
        data.type = 'text';
        data.text = 'Text';
        data.autoWidth = false;
        data.autoHeight = false;
        data.autoFitWidth = true;
        data.autoFitHeight = true;
        data.anchor = [0, 0, 1, 1];
        data.margin = [0, 0, 0, 0];
        data.color = [0, 0, 0];

        applyAdditions(data, additions);

        return data;
    };

    const createButtonEntityData = (additions?) => {
        const data = {
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

    const createScrollbarEntityData = (orientation, additions) => {
        const scrollbarComponentData = editor.call('components:getDefault', 'scrollbar');
        scrollbarComponentData.orientation = orientation;

        const containerData = createImageElementComponentData();
        const containerElementDefaults = editor.call('components:scrollbar:getContainerElementDefaultsForOrientation', orientation);
        applyAdditions(containerData, containerElementDefaults);

        const handleData = createButtonEntityData({ name: 'Handle' });
        const handleElementDefaults = editor.call('components:scrollbar:getHandleElementDefaultsForOrientation', orientation);
        applyAdditions(handleData.components.element, handleElementDefaults);

        const data = {
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

    const createPrimitiveEntityData = (type, additions) => {
        const data = {
            components: {}
        };

        const component = 'render';
        data.components[component] = editor.call('components:getDefault', component);
        data.components[component].type = type;
        data.components.render.materialAssets = [null];

        applyAdditions(data, additions);

        return data;
    };

    editor.method('menu:entities:new', (getParentFn) => {
        if (!getParentFn) {
            getParentFn = () => {
                return editor.call('entities:selectedFirst');
            };
        }

        return [{
            // add new entity
            text: 'Entity',
            icon: 'E120',
            onSelect: () => {
                editor.call('entities:new', { parent: getParentFn() });
            }
        }, {
            text: '2D',
            icon: COMPONENT_LOGOS.sprite,
            items: [{
                text: 'Sprite',
                icon: COMPONENT_LOGOS.sprite,
                onSelect: () => {
                    const data = editor.call('components:getDefault', 'sprite');
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
                icon: COMPONENT_LOGOS.animatedsprite,
                onSelect: () => {
                    const data = editor.call('components:getDefault', 'sprite');
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
            text: '3D',
            icon: COMPONENT_LOGOS.render,
            items: [{
                text: 'Render',
                icon: COMPONENT_LOGOS.render,
                onSelect: () => {
                    const component = editor.call('components:getDefault', 'render');
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
                text: 'Box',
                icon: COMPONENT_LOGOS.model,
                onSelect: () => {
                    const data = createPrimitiveEntityData('box', {
                        name: 'Box',
                        parent: getParentFn()
                    });
                    editor.call('entities:new', data);
                }
            }, {
                text: 'Capsule',
                icon: COMPONENT_LOGOS.capsule,
                onSelect: () => {
                    const data = createPrimitiveEntityData('capsule', {
                        name: 'Capsule',
                        parent: getParentFn()
                    });
                    editor.call('entities:new', data);
                }
            }, {
                text: 'Cone',
                icon: COMPONENT_LOGOS.cone,
                onSelect: () => {
                    const data = createPrimitiveEntityData('cone', {
                        name: 'Cone',
                        parent: getParentFn()
                    });
                    editor.call('entities:new', data);
                }
            }, {
                text: 'Cylinder',
                icon: COMPONENT_LOGOS.cylinder,
                onSelect: () => {
                    const data = createPrimitiveEntityData('cylinder', {
                        name: 'Cylinder',
                        parent: getParentFn()
                    });
                    editor.call('entities:new', data);
                }
            }, {
                text: 'Plane',
                icon: COMPONENT_LOGOS.plane,
                onSelect: () => {
                    const data = createPrimitiveEntityData('plane', {
                        name: 'Plane',
                        parent: getParentFn()
                    });
                    editor.call('entities:new', data);
                }
            }, {
                text: 'Sphere',
                icon: COMPONENT_LOGOS.render,
                onSelect: () => {
                    const data = createPrimitiveEntityData('sphere', {
                        name: 'Sphere',
                        parent: getParentFn()
                    });
                    editor.call('entities:new', data);
                }
            }, {
                text: 'GSplat',
                icon: COMPONENT_LOGOS.gsplat,
                onSelect: () => {
                    const component = editor.call('components:getDefault', 'gsplat');

                    editor.call('entities:new', {
                        name: 'GSplat',
                        parent: getParentFn(),
                        components: {
                            gsplat: component
                        }
                    });
                }
            }, {
                text: 'Model (legacy)',
                icon: COMPONENT_LOGOS.model,
                onSelect: () => {
                    const component = editor.call('components:getDefault', 'model');

                    editor.call('entities:new', {
                        name: 'Model',
                        parent: getParentFn(),
                        components: {
                            model: component
                        }
                    });
                }
            }]
        }, {
            text: 'Audio',
            icon: COMPONENT_LOGOS.sound,
            items: [{
                text: 'Audio Listener',
                icon: COMPONENT_LOGOS.audiolistener,
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
                text: 'Sound',
                icon: COMPONENT_LOGOS.sound,
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
            icon: COMPONENT_LOGOS.camera,
            items: [{
                text: 'Perspective',
                icon: COMPONENT_LOGOS.camera,
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
                text: 'Orthographic',
                icon: COMPONENT_LOGOS.camera,
                onSelect: () => {
                    const component = editor.call('components:getDefault', 'camera');
                    component.projection = 1;

                    editor.call('entities:new', {
                        name: 'Camera',
                        parent: getParentFn(),
                        components: {
                            camera: component
                        }
                    });
                }
            }]
        }, {
            text: 'Light',
            icon: COMPONENT_LOGOS.point,
            items: [{
                text: 'Directional Light',
                icon: COMPONENT_LOGOS.directional,
                onSelect: () => {
                    const component = editor.call('components:getDefault', 'light');
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
                text: 'Omni Light',
                icon: COMPONENT_LOGOS.point,
                onSelect: () => {
                    const component = editor.call('components:getDefault', 'light');
                    component.type = 'point';
                    component.shadowResolution = 256;

                    editor.call('entities:new', {
                        name: 'Omni Light',
                        parent: getParentFn(),
                        components: {
                            light: component
                        }
                    });
                }
            }, {
                text: 'Spot Light',
                icon: COMPONENT_LOGOS.spot,
                onSelect: () => {
                    const component = editor.call('components:getDefault', 'light');
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
            text: 'Particle System',
            icon: COMPONENT_LOGOS.particlesystem,
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
            text: 'User Interface',
            icon: COMPONENT_LOGOS.userinterface,
            items: [{
                text: '2D Screen',
                icon: COMPONENT_LOGOS['2d-screen'],
                onSelect: () => {
                    const data = editor.call('components:getDefault', 'screen');
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
                icon: COMPONENT_LOGOS['3d-screen'],
                onSelect: () => {
                    const data = editor.call('components:getDefault', 'screen');
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
                text: 'Button',
                icon: COMPONENT_LOGOS.button,
                onSelect: () => {
                    editor.call('entities:new', createButtonEntityData({
                        name: 'Button',
                        parent: getParentFn(),
                        children: [
                            {
                                name: 'Text',
                                components: {
                                    element: createButtonTextElementComponentData()
                                }
                            }
                        ]
                    }));
                }
            }, {
                text: 'Layout Group',
                icon: COMPONENT_LOGOS.layoutgroup,
                onSelect: () => {
                    editor.call('entities:new', {
                        name: 'Layout Group',
                        parent: getParentFn(),
                        components: {
                            layoutgroup: editor.call('components:getDefault', 'layoutgroup'),
                            element: createGroupElementComponentData()
                        }
                    });
                }
            }, {
                text: 'Layout Child',
                icon: COMPONENT_LOGOS.layoutchild,
                onSelect: () => {
                    editor.call('entities:new', {
                        name: 'Layout Child',
                        parent: getParentFn(),
                        components: {
                            layoutchild: editor.call('components:getDefault', 'layoutchild'),
                            element: createGroupElementComponentData()
                        }
                    });
                }
            }, {
                text: 'Group Element',
                icon: COMPONENT_LOGOS['group-element'],
                onSelect: () => {
                    const data = editor.call('components:getDefault', 'element');
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
                text: 'Text Element',
                icon: COMPONENT_LOGOS['text-element'],
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
                icon: COMPONENT_LOGOS['image-element'],
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
                text: 'Scrollbar',
                icon: COMPONENT_LOGOS.scrollbar,
                onSelect: () => {
                    editor.call('entities:new', createScrollbarEntityData(ORIENTATION_VERTICAL, {
                        name: 'Scrollbar',
                        parent: getParentFn()
                    }));
                }
            }, {
                text: 'Scroll View',
                icon: COMPONENT_LOGOS.scrollview,
                onSelect: () => {
                    const viewportSize = 200;
                    const scrollbarSize = 20;

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
            }]
        }];
    });
});
