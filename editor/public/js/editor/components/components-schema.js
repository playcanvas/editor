editor.once('load', function() {
    'use strict';

    var schema = {
        animation: {
            title: 'Animation',
            default: {
                enabled: true,
                assets: [ ],
                speed: 1,
                loop: true,
                activate: true
            }
        },

        light: {
            title: 'Light',
            default: {
                enabled: true,
                type: 'directional',
                isStatic: false,
                bake: false,
                affectDynamic: true,
                affectLightMapped: false,
                color: [ 1, 1, 1 ],
                intensity: 1,
                castShadows: false,
                shadowType: 0,
                shadowDistance: 16,
                shadowResolution: 1024,
                shadowBias: 0.04,
                normalOffsetBias: 0.04,
                vsmBlurMode: 1,
                vsmBlurSize: 11,
                vsmBias: 0.01,
                range: 8,
                falloffMode: 0,
                innerConeAngle: 40,
                outerConeAngle: 45,
                cookieAsset: null,
                cookieIntensity: 1.0,
                cookieFalloff: true,
                cookieChannel: 'rgb',
                cookieAngle: 0.0,
                cookieOffset: [ 0.0, 0.0 ],
                cookieScale: [ 1.0, 1.0 ]
            },
            types: {
                color: 'rgb',
                cookieOffset: 'vec2',
                cookieScale: 'vec2'
            }
        },

        audiolistener: {
            title: 'Audio Listener',
            default: {
                enabled: true
            }
        },

        audiosource: {
            title: 'Audio Source',
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

        sound: {
            title: 'Sound',
            default: {
                enabled: true,
                volume: 1,
                pitch: 1,
                positional: true,
                refDistance: 1,
                maxDistance: 10000,
                rollOffFactor: 1,
                distanceModel: 'linear',
                slots: {
                    '1': {
                        name: 'Slot 1',
                        loop: false,
                        autoPlay: false,
                        overlap: false,
                        asset: null,
                        startTime: 0,
                        duration: null,
                        volume: 1,
                        pitch: 1
                    }
                }
            }
        },

        camera: {
            title: 'Camera',
            default: {
                enabled: true,
                clearColorBuffer: true,
                clearColor: [0.118, 0.118, 0.118, 1],
                clearDepthBuffer: true,
                projection: 0,
                fov: 45,
                frustumCulling: true,
                orthoHeight: 4,
                nearClip: 0.1,
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
            title: 'Collision',
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
            title: 'Model',
            default: {
                enabled: true,
                isStatic: false,
                type: 'asset',
                asset: null,
                materialAsset: null,
                castShadows: true,
                castShadowsLightmap: true,
                receiveShadows: true,
                lightMapped: false,
                lightMapSizeMultiplier: 1.0
            }
        },

        particlesystem: {
            title: 'Particle System',
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
                animTilesX: 1,
                animTilesY: 1,
                animNumFrames: 1,
                animSpeed: 1,
                animLoop: true,
                wrap: false,
                wrapBounds: [0,0,0],
                colorMapAsset: null,
                normalMapAsset: null,
                mesh: null,
                localVelocityGraph: {
                    type: 1,
                    keys: [[0, 0], [0, 0], [0, 0]],
                    betweenCurves: false
                },
                localVelocityGraph2: {
                    type: 1,
                    keys: [[0, 0], [0, 0], [0, 0]]
                },
                velocityGraph: {
                    type: 1,
                    keys: [[0, -1], [0, -1], [0, -1]],
                    betweenCurves: true
                },
                velocityGraph2: {
                    type: 1,
                    keys: [[0, 1], [0, 1], [0, 1]]
                },
                rotationSpeedGraph: {
                    type: 1,
                    keys: [0, 0],
                    betweenCurves: false
                },
                rotationSpeedGraph2: {
                    type: 1,
                    keys: [0, 0]
                },
                scaleGraph: {
                    type: 1,
                    keys: [0, 0.1],
                    betweenCurves: false
                },
                scaleGraph2: {
                    type: 1,
                    keys: [0, 0.1]
                },
                colorGraph: {
                    type: 1,
                    keys: [[0, 1], [0, 1], [0, 1]],
                    betweenCurves: false
                },
                alphaGraph: {
                    type: 1,
                    keys: [0, 1],
                    betweenCurves: false
                },
                alphaGraph2: {
                    type: 1,
                    keys: [0, 1]
                }
            },
            types: {
                emitterExtents: 'vec3',
                localVelocityGraph: 'curveset',
                localVelocityGraph2: 'curveset',
                velocityGraph: 'curveset',
                velocityGraph2: 'curveset',
                rotationSpeedGraph: 'curve',
                rotationSpeedGraph2: 'curve',
                scaleGraph: 'curve',
                scaleGraph2: 'curve',
                colorGraph: 'curveset',
                alphaGraph: 'curve',
                alphaGraph2: 'curve'
            }
        },

        rigidbody: {
            title: 'Rigid Body',
            default: {
                enabled: true,
                type: 'static',
                mass: 1,
                linearDamping: 0,
                angularDamping: 0,
                linearFactor: [1, 1, 1],
                angularFactor: [1, 1, 1],
                friction: 0.5,
                restitution: 0.5
            },
            types: {
                linearFactor: 'vec3',
                angularFactor: 'vec3'
            }
        },

        script: {
            title: 'Script',
            default: {
                enabled: true,
                order: [ ],
                scripts: null
            }
        },

        zone: {
            title: 'Zone',
            default: {
                enabled: true,
                size: [ 1, 1, 1 ]
            }
        },

        screen: {
            title: 'Screen',
            default: {
                enabled: true,
                resolution: [640, 320],
                referenceResolution: [640, 320],
                screenSpace: true,
                scaleMode: 'blend',
                scaleBlend: 0.5
            }
        },

        element: {
            title: 'Element',
            default: {
                enabled: true,
                type: 'text',
                anchor: [0, 0, 0, 0],
                pivot: [0, 0],
                text: '',
                fontAsset: null,
                fontSize: 32,
                lineHeight: 32,
                spacing: 1,
                color: [0, 0, 0, 1],
                textureAsset: null,
                width: 32,
                height: 32,
                rect: [0, 0, 0, 0],
                materialAsset: null
            },
            types: {
                anchor: 'vec4',
                pivot: 'vec2',
                color: 'rgba',
                rect: 'vec4'
            }
        }
    };

    if (editor.call('project:settings').get('use_legacy_scripts')) {
        schema.script.default.scripts = [ ];
        delete schema.script.default.order;
    } else {
        schema.script.default.scripts = { };
    }

    var list = Object.keys(schema).sort(function(a, b) {
        if (a > b) {
            return 1;
        } else if (a < b) {
            return -1;
        } else {
            return 0;
        }
    });

    editor.method('components:convertValue', function (component, property, value) {
        var result = value;

        if (value) {
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
                    case 'vec2':
                        result = new pc.Vec2(value[0], value[1]);
                        break;
                    case 'vec3':
                        result = new pc.Vec3(value[0], value[1], value[2]);
                        break;
                    case 'vec4':
                        result = new pc.Vec4(value[0], value[1], value[2], value[3]);
                        break;
                    case 'curveset':
                        result = new pc.CurveSet(value.keys);
                        result.type = value.type;
                        break;
                    case 'curve':
                        result = new pc.Curve(value.keys);
                        result.type = value.type;
                        break;
                }
            }
        }

        return result;
    });

    editor.method('components:list', function () {
        var result = list.slice(0);
        if (! config.self.superUser) {
            result.splice(result.indexOf('screen'), 1);
            result.splice(result.indexOf('element'), 1);
        }
        return result;
    });

    editor.method('components:schema', function () {
        return schema;
    });

    editor.method('components:getDefault', function (component) {
        return utils.deepCopy(schema[component].default);
    });

});
