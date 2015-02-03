editor.once('load', function() {
    'use strict';

    var schema = {
        animation: {
            default: {
                enabled: true,
                assets: [],
                speed: 1,
                loop: true,
                activate: true
            }
        },

        light: {
            default: {
                enabled: true,
                type: 'directional',
                color: [1, 1, 1],
                intensity: 1,
                castShadows: false,
                shadowDistance: 40,
                shadowResolution: 1024,
                shadowBias: 0.05,
                normalOffsetBias: 0,
                range: 10,
                falloffMode: 0,
                innerConeAngle: 40,
                outerConeAngle: 45
            },
            types: {
                color: 'rgb'
            }
        },

        audiolistener: {
            default: {
                enabled: true
            }
        },

        audiosource: {
            default: {
                enabled: true,
                assets: [],
                volume: 1,
                pitch: 1,
                loop: false,
                activate: true,
                '3d': true,
                minDistance: 1,
                maxDistance: 10000,
                rollOffFactor: 1
            }
        },

        camera: {
            default: {
                enabled: true,
                clearColorBuffer: true,
                clearColor: [0.73, 0.73, 0.73],
                clearDepthBuffer: true,
                projection: 0,
                fov: 45,
                orthoHeight: 100,
                nearClip: 0.3,
                farClip: 1000,
                priority: 0,
                rect: [0, 0, 1, 1]
            },
            types: {
                clearColor: 'rgb',
                rect: 'vec4'
            }
        },

        collision: {
            default: {
                enabled: true,
                type: 'box',
                halfExtents: [0.5,  0.5, 0.5],
                radius: 0.5,
                axis: 1,
                height: 2,
                asset: null
            },
            types: {
                halfExtents: 'vec3'
            }
        },

        model: {
            default: {
                enabled: true,
                type: 'asset',
                asset: null,
                materialAsset: null,
                castShadows: false,
                receiveShadows: true,
            }
        },

        particlesystem: {
            default: {
                enabled: true,
                autoPlay: true,
                numParticles: 30,
                lifetime: 5,
                rate: 0.1,
                rate2: 0.1,
                startAngle: 0,
                startAngle2: 0,
                loop: true,
                preWarm: false,
                lighting: false,
                halfLambert: false,
                intensity: 1,
                depthWrite: false,
                depthSoftening: 0,
                sort: 0,
                blendType: 2,
                stretch: 0,
                alignToMotion: false,
                emitterShape: 0,
                emitterExtents: [0, 0, 0],
                emitterRadius: 0,
                initialVelocity: 0,
                wrap: false,
                wrapBounds: [0,0,0],
                colorMapAsset: null,
                normalMapAsset: null,
                mesh: null
            },
            types: {
                emitterExtents: 'vec3'
            }
        },

        rigidbody: {
            default: {
                enabled: true,
                type: 'static',
                mass: 1,
                linearDamping: 0,
                angularDamping: 0,
                linearFactor: [1, 1, 1],
                angularFactor: [1, 1, 1],
                friction: 0.5,
                restitution: 0
            },
            types: {
                linearFactor: 'vec3',
                angularFactor: 'vec3'
            }
        },

        script: {
            default: {
                enabled: true,
                scripts: []
            }
        }

    };

    editor.method('components:convertValue', function (component, property, value) {
        var result = value;

        var data = schema[component];
        if (data && data.types) {
            var type = data.types[property];
            switch (type) {
                case 'rgb':
                    result = new pc.Color(value[0], value[1], value[2]);
                    break;
                case 'rgba':
                    result = new pc.Color(value[0], value[1], value[2], value[3]);
                    break;
                case 'vec3':
                    result = new pc.Vec3(value[0], value[1], value[2]);
                    break;
                case 'vec4':
                    result = new pc.Vec4(value[0], value[1], value[2], value[3]);
                    break;
            }
        }

        return result;
    });

    editor.method('components:list', function () {
        return Object.keys(schema);
    });

    editor.method('components:getDefault', function (component) {
        return schema[component].default;
    });

});


