editor.once('load', function() {
    'use strict';

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

    editor.method('menu:entities:new', function (getParentFn) {
        if (! getParentFn)
            getParentFn = function () {return editor.call('entities:selectedFirst');};

        return {
            'add-new-entity': {
                title: 'Entity',
                icon: '&#58468;',
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
                icon: componentsLogos.light,
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
                icon: componentsLogos.light,
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
                icon: componentsLogos.light,
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
            }
        };
    });
});