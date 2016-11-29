editor.once('load', function() {
    'use strict';

    var componentsLogos = {
        'animation': '&#57875;',
        'audiolistener': '&#57750;',
        'audiosource': '&#57751;',
        'sound': '&#57751;',
        'camera': '&#57874;',
        'collision': '&#57735;',
        'directional': '&#57746;',
        'point': '&#57745;',
        'spot': '&#57747;',
        'model': '&#57736;',
        'particlesystem': '&#57753;',
        'rigidbody': '&#57737;',
        'script': '&#57910;',
        'zone': '&#57910;',
        'screen': '&#57665;',
        'element': '&#58232;'
    };

    editor.method('menu:entities:new', function (getParentFn) {
        if (! getParentFn)
            getParentFn = function () {return editor.call('entities:selectedFirst');};

        return {
            'add-new-entity': {
                title: 'Entity',
                icon: '&#57632;',
                select: function() {
                    editor.call('entities:new', {parent: getParentFn()});
                }
            },
            'add-new-listener': {
                title: 'Audio Listener',
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
                icon: componentsLogos.audiosource,
                hide: function () {
                    return ! editor.call('project:settings').get('use_legacy_audio');
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
            },
            'add-new-camera': {
                title: 'Camera',
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
            'add-new-box': {
                title: 'Box',
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
            'add-new-model': {
                title: 'Model',
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
            'add-new-plane': {
                title: 'Plane',
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
            },
            'add-new-directional': {
                title: 'Directional Light',
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
            },
            'add-new-particles': {
                title: 'Particle System',
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
            'add-new-zone': {
                title: 'Zone',
                icon: componentsLogos.zone,
                select: function() {
                    editor.call('entities:new', {
                        name: 'Zone',
                        parent: getParentFn(),
                        components: {
                            zone: editor.call('components:getDefault', 'zone')
                        }
                    });
                }
            },
            'add-new-2d-screen': {
                title: '2D Screen',
                icon: componentsLogos.screen,
                hide: function () {
                    return !config.self.superUser && !config.self.uiTester;
                },
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
                icon: componentsLogos.screen,
                hide: function () {
                    return !config.self.superUser && !config.self.uiTester;
                },
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
                icon: componentsLogos.element,
                hide: function () {
                    return !config.self.superUser && !config.self.uiTester;
                },
                select: function() {
                    var data = editor.call('components:getDefault', 'element');
                    data.type = 'text';
                    data.text = 'Text';
                    editor.call('entities:new', {
                        name: 'Text',
                        parent: getParentFn(),
                        components: {
                            element: data
                        }
                    });
                }
            },
            'add-new-image': {
                title: 'Image Element',
                icon: componentsLogos.element,
                hide: function () {
                    return !config.self.superUser && !config.self.uiTester;
                },
                select: function() {
                    var data = editor.call('components:getDefault', 'element');
                    data.type = 'image';
                    editor.call('entities:new', {
                        name: 'Image',
                        parent: getParentFn(),
                        components: {
                            element: data
                        }
                    });
                }
            },
            'add-new-group': {
                title: 'Element Group',
                icon: componentsLogos.element,
                hide: function () {
                    return !config.self.superUser && !config.self.uiTester;
                },
                select: function() {
                    var data = editor.call('components:getDefault', 'element');
                    data.type = 'group';
                    editor.call('entities:new', {
                        name: 'Group',
                        parent: getParentFn(),
                        components: {
                            element: data
                        }
                    });
                }
            }
        };
    });
});
