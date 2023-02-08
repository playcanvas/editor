import { Panel, Container } from '@playcanvas/pcui';

Object.assign(pcui, (function () {
    const TextureTypes = {
        Normal: 'Normal',
        Color: 'Color',
        Scalar: 'Scalar'
    };
    function _textureAttribute(label, attributeName, type) {

        const scalarColorChannel =
        {
            label: 'Color Channel',
            path: `data.${attributeName}MapChannel`,
            type: 'select',
            args: {
                type: 'string',
                options: [{
                    v: 'r', t: 'R'
                }, {
                    v: 'g', t: 'G'
                }, {
                    v: 'b', t: 'B'
                }, {
                    v: 'a', t: 'A'
                }]
            },
            reference: `asset:material:${attributeName}MapChannel`
        };
        const rgbColorChannel =
        {
            label: 'Color Channel',
            path: `data.${attributeName}MapChannel`,
            type: 'select',
            args: {
                type: 'string',
                options: [{
                    v: 'r', t: 'R'
                }, {
                    v: 'g', t: 'G'
                }, {
                    v: 'b', t: 'B'
                }, {
                    v: 'a', t: 'A'
                }, {
                    v: 'rgb', t: 'RGB'
                }]
            },
            reference: `asset:material:${attributeName}MapChannel`
        };
        return [{
            label: label,
            type: 'asset',
            path: `data.${attributeName}Map`,
            args: {
                assetType: 'texture'
            },
            reference: `asset:material:${attributeName}Map`
        }, {
            label: 'UV Channel',
            path: `data.${attributeName}MapUv`,
            type: 'select',
            args: {
                type: 'number',
                options: [{
                    v: 0, t: 'UV0'
                }, {
                    v: 1, t: 'UV1'
                }]
            },
            reference: `asset:material:${attributeName}MapUv`
        },
        ...(type === TextureTypes.Color ? [rgbColorChannel] : []),
        ...(type === TextureTypes.Scalar ? [scalarColorChannel] : []),
        {
            label: 'Offset',
            path: `data.${attributeName}MapOffset`,
            type: 'vec2',
            args: {
                placeholder: ['U', 'V']
            },
            reference: `asset:material:${attributeName}MapOffset`
        }, {
            label: 'Tiling',
            path: `data.${attributeName}MapTiling`,
            type: 'vec2',
            args: {
                placeholder: ['U', 'V']
            },
            reference: `asset:material:${attributeName}MapTiling`
        }, {
            label: 'Rotation',
            path: `data.${attributeName}MapRotation`,
            type: 'number',
            args: {
                precision: 3,
                step: 10,
                min: 0,
                max: 360,
                placeholder: 'degrees'
            },
            reference: `asset:material:${attributeName}MapRotation`
        }];
    }

    const CLASS_ROOT = 'asset-material-inspector';

    const DOM = parent => [{
        root: {
            materialPanel: new Panel({
                headerText: 'MATERIAL'
            })
        },
        children: [{
            materialInspector: new pcui.AttributesInspector({
                assets: parent._args.assets,
                history: parent._args.history,
                attributes: [{
                    label: 'Shading',
                    type: 'select',
                    path: 'data.shader',
                    args: {
                        type: 'string',
                        options: [{
                            v: 'phong', t: 'Phong'
                        }, {
                            v: 'blinn', t: 'Physical'
                        }]
                    },
                    reference: 'asset:material:shadingModel'
                }]
            })
        }]
    }, {
        root: {
            offsetTilingPanel: new Panel({
                headerText: 'TEXTURE TRANSFORM',
                collapsible: true,
                collapsed: true
            })
        },
        children: [{
            offsetTilingInspector: new pcui.AttributesInspector({
                assets: parent._args.assets,
                history: parent._args.history,
                attributes: [{
                    label: 'Apply To All Maps',
                    type: 'boolean',
                    alias: 'applyToAllMaps'
                }, {
                    label: 'Offset',
                    type: 'vec2',
                    alias: 'offset',
                    args: {
                        placeholder: ['U', 'V']
                    },
                    reference: 'asset:material:offset'
                }, {
                    label: 'Tiling',
                    type: 'vec2',
                    alias: 'tiling',
                    args: {
                        placeholder: ['U', 'V']
                    },
                    reference: 'asset:material:tiling'
                }, {
                    label: 'Rotation',
                    type: 'number',
                    alias: 'rotation',
                    args: {
                        precision: 3,
                        step: 10,
                        min: 0,
                        max: 360,
                        placeholder: 'degrees'
                    },
                    reference: 'asset:material:rotation'
                }]
            })
        }]
    }, {
        root: {
            ambientPanel: new Panel({
                headerText: 'AMBIENT',
                collapsible: true,
                collapsed: true
            })
        },
        children: [{
            ambientInspector: new pcui.AttributesInspector({
                assets: parent._args.assets,
                history: parent._args.history,
                attributes: [..._textureAttribute('Ambient Occlusion', 'ao', TextureTypes.Scalar), {
                    label: 'Occlude Specular',
                    type: 'select',
                    path: 'data.occludeSpecular',
                    args: {
                        type: 'number',
                        options: [{
                            v: 0, t: 'Off'
                        }, {
                            v: 1, t: 'Multiply'
                        }, {
                            v: 2, t: 'Gloss Based'
                        }]
                    },
                    reference: 'asset:material:occludeSpecular'
                }, {
                    label: 'Vertex Color',
                    type: 'boolean',
                    path: 'data.aoVertexColor',
                    reference: 'asset:material:aoMapVertexColor'
                }, {
                    label: 'Tint',
                    type: 'boolean',
                    path: 'data.ambientTint',
                    reference: 'asset:material:ambientTint'
                }, {
                    label: 'Color',
                    type: 'rgb',
                    path: 'data.ambient',
                    reference: 'asset:material:ambient'
                }]
            })
        }]
    }, {
        root: {
            diffusePanel: new Panel({
                headerText: 'DIFFUSE',
                collapsible: true,
                collapsed: true
            })
        },
        children: [{
            diffuseInspector: new pcui.AttributesInspector({
                assets: parent._args.assets,
                history: parent._args.history,
                attributes: [..._textureAttribute('Diffuse', 'diffuse', TextureTypes.Color), {
                    label: 'Vertex Color',
                    type: 'boolean',
                    path: 'data.diffuseVertexColor',
                    reference: 'asset:material:diffuseMapVertexColor'
                }, {
                    label: 'Tint',
                    path: 'data.diffuseTint',
                    type: 'boolean',
                    reference: 'asset:material:diffuseMapTint'
                }, {
                    label: 'Color',
                    path: 'data.diffuse',
                    type: 'rgb',
                    reference: 'asset:material:diffuse'
                }]
            })
        }]
    }, {
        root: {
            specularPanel: new Panel({
                headerText: 'SPECULAR',
                collapsible: true,
                collapsed: true
            })
        },
        children: [{
            specularInspector: new pcui.AttributesInspector({
                assets: parent._args.assets,
                history: parent._args.history,
                attributes: [{
                    label: 'Enable GGX Specular',
                    path: 'data.enableGGXSpecular',
                    type: 'boolean',
                    reference: 'asset:material:enableGGXSpecular'
                }, {
                    label: 'Anisotropy',
                    path: 'data.anisotropy',
                    type: 'slider',
                    args: {
                        precision: 3,
                        step: 0.05,
                        min: -1,
                        max: 1
                    },
                    reference: 'asset:material:anisotropy'
                }, {
                    label: 'Use Metalness',
                    path: 'data.useMetalness',
                    type: 'boolean',
                    reference: 'asset:material:useMetalness'
                }]
            })
        }, {
            metalnessWorkflowInspector: new pcui.AttributesInspector({
                assets: parent._args.assets,
                history: parent._args.history,
                attributes: [..._textureAttribute('Metalness', 'metalness', TextureTypes.Scalar), {
                    label: 'Vertex Color',
                    path: 'data.metalnessVertexColor',
                    type: 'boolean',
                    reference: 'asset:material:metalnessMapVertexColor'
                }, {
                    label: 'Metalness',
                    path: 'data.metalness',
                    type: 'slider',
                    args: {
                        precision: 3,
                        step: 0.05,
                        min: 0,
                        max: 1
                    },
                    reference: 'asset:material:metalness'
                }, {
                    label: "Use Specular Color and Factor",
                    path: 'data.useMetalnessSpecularColor',
                    type: 'boolean',
                    reference: 'asset:material:useMetalnessSpecularColor'
                }, ..._textureAttribute('Specular', 'specular', TextureTypes.Color), {
                    label: 'Vertex Color',
                    path: 'data.specularVertexColor',
                    type: 'boolean',
                    reference: 'asset:material:specularMapVertexColor'
                }, {
                    label: 'Tint',
                    path: 'data.specularTint',
                    type: 'boolean',
                    reference: 'asset:material:specularMapTint'
                }, {
                    label: 'Color',
                    path: 'data.specular',
                    type: 'rgb',
                    reference: 'asset:material:specular'
                }, ..._textureAttribute('Specularity Factor', 'specularityFactor', TextureTypes.Scalar), {
                    label: 'Vertex Color',
                    path: 'data.specularityFactorVertexColor',
                    type: 'boolean',
                    reference: 'asset:material:specularityFactorVertexColor'
                }, {
                    label: 'Tint',
                    path: 'data.specularityFactorTint',
                    type: 'boolean',
                    reference: 'asset:material:specularityFactorTint'
                }, {
                    label: 'Specularity Factor',
                    path: 'data.specularityFactor',
                    type: 'slider',
                    args: {
                        precision: 3,
                        step: 0.05,
                        min: 0,
                        max: 1
                    },
                    reference: 'asset:material:specularityFactor'
                }]
            })
        }, {
            specularWorkflowInspector: new pcui.AttributesInspector({
                assets: parent._args.assets,
                history: parent._args.history,
                attributes: [..._textureAttribute('Specular', 'specular', TextureTypes.Color), {
                    label: 'Vertex Color',
                    path: 'data.specularVertexColor',
                    type: 'boolean',
                    reference: 'asset:material:specularMapVertexColor'
                }, {
                    label: 'Tint',
                    path: 'data.specularTint',
                    type: 'boolean',
                    reference: 'asset:material:specularMapTint'
                }, {
                    label: 'Color',
                    path: 'data.specular',
                    type: 'rgb',
                    reference: 'asset:material:specular'
                }]
            })
        }, {
            glossInspector: new pcui.AttributesInspector({
                assets: parent._args.assets,
                history: parent._args.history,
                attributes: [{
                    type: 'divider'
                }, ..._textureAttribute('Glossiness', 'gloss', TextureTypes.Scalar), {
                    label: 'Vertex Color',
                    path: 'data.glossVertexColor',
                    type: 'boolean',
                    reference: 'asset:material:glossMapVertexColor'
                }, {
                    label: 'Glossiness',
                    path: 'data.shininess',
                    type: 'slider',
                    args: {
                        precision: 2,
                        step: 0.5,
                        min: 0,
                        max: 100
                    },
                    reference: 'asset:material:shininess'
                }, {
                    label: 'Invert',
                    path: 'data.glossInvert',
                    type: 'boolean',
                    reference: 'asset:material:glossInvert'
                }]
            })
        }]
    }, {
        root: {
            emissivePanel: new Panel({
                headerText: 'EMISSIVE',
                collapsible: true,
                collapsed: true
            })
        },
        children: [{
            emissiveInspector: new pcui.AttributesInspector({
                assets: parent._args.assets,
                history: parent._args.history,
                attributes: [..._textureAttribute('Emissive', 'emissive', TextureTypes.Color), {
                    label: 'Vertex Color',
                    path: 'data.emissiveVertexColor',
                    type: 'boolean',
                    reference: 'asset:material:emissiveMapVertexColor'
                }, {
                    label: 'Tint',
                    path: 'data.emissiveTint',
                    type: 'boolean',
                    reference: 'asset:material:emissiveMapTint'
                }, {
                    label: 'Color',
                    path: 'data.emissive',
                    type: 'rgb',
                    reference: 'asset:material:emissive'
                }, {
                    label: 'Intensity',
                    type: 'slider',
                    path: 'data.emissiveIntensity',
                    args: {
                        precision: 2,
                        step: 0.1,
                        min: 0,
                        max: 10
                    },
                    reference: 'asset:material:emissiveIntensity'
                }]
            })
        }]
    }, {
        root: {
            opacityPanel: new Panel({
                headerText: 'OPACITY',
                collapsible: true,
                collapsed: true
            })
        },
        children: [{
            opacityInspector: new pcui.AttributesInspector({
                assets: parent._args.assets,
                history: parent._args.history,
                attributes: [{
                    label: 'Blend Type',
                    path: 'data.blendType',
                    type: 'select',
                    args: {
                        type: 'number',
                        options: [{
                            v: 3, t: 'None'
                        }, {
                            v: 2, t: 'Alpha'
                        }, {
                            v: 1, t: 'Additive'
                        }, {
                            v: 6, t: 'Additive Alpha'
                        }, {
                            v: 8, t: 'Screen'
                        }, {
                            v: 4, t: 'Premultiplied Alpha'
                        }, {
                            v: 5, t: 'Multiply'
                        }, {
                            v: 7, t: 'Modulate 2x'
                        }, {
                            v: 9, t: 'Min (Partial Support)'
                        }, {
                            v: 10, t: 'Max (Partial Support)'
                        }]
                    },
                    reference: 'asset:material:blendType'
                }, ..._textureAttribute('Opacity', 'opacity', TextureTypes.Scalar), {
                    label: 'Vertex Color',
                    path: 'data.opacityVertexColor',
                    type: 'boolean',
                    reference: 'asset:material:opacityMapVertexColor'
                }, {
                    label: 'Intensity',
                    path: 'data.opacity',
                    type: 'slider',
                    args: {
                        precision: 3,
                        step: 0.05,
                        min: 0,
                        max: 1
                    },
                    reference: 'asset:material:opacity'
                }, {
                    label: 'Alpha Test',
                    path: 'data.alphaTest',
                    type: 'slider',
                    args: {
                        precision: 3,
                        step: 0.05,
                        min: 0,
                        max: 1
                    },
                    reference: 'asset:material:alphaTest'
                }, {
                    label: 'Alpha To Coverage',
                    path: 'data.alphaToCoverage',
                    type: 'boolean',
                    reference: 'asset:material:alphaToCoverage'
                }, {
                    label: 'Opacity Fades Specular',
                    path: 'data.opacityFadesSpecular',
                    type: 'boolean',
                    reference: 'asset:material:opacityFadesSpecular'
                }, {
                    label: 'Alpha Fade',
                    path: 'data.alphaFade',
                    type: 'slider',
                    args: {
                        precision: 3,
                        step: 0.05,
                        min: 0,
                        max: 1
                    },
                    reference: 'asset:material:alphaFade'
                }]
            })
        }]
    }, {
        root: {
            normalsPanel: new Panel({
                headerText: 'NORMALS',
                collapsible: true,
                collapsed: true
            })
        },
        children: [{
            normalsInspector: new pcui.AttributesInspector({
                assets: parent._args.assets,
                history: parent._args.history,
                attributes: [..._textureAttribute('Normals', 'normal', TextureTypes.Normal), {
                    label: 'Bumpiness',
                    path: 'data.bumpMapFactor',
                    type: 'slider',
                    args: {
                        precision: 3,
                        step: 0.05,
                        min: 0,
                        max: 2
                    },
                    reference: 'asset:material:bumpiness'
                }]
            })
        }]
    }, {
        root: {
            parallaxPanel: new Panel({
                headerText: 'PARALLAX',
                collapsible: true,
                collapsed: true
            })
        },
        children: [{
            parallaxInspector: new pcui.AttributesInspector({
                assets: parent._args.assets,
                history: parent._args.history,
                attributes: [..._textureAttribute('Heightmap', 'height', TextureTypes.Scalar), {
                    label: 'Strength',
                    path: 'data.heightMapFactor',
                    type: 'slider',
                    args: {
                        precision: 3,
                        step: 0.05,
                        min: 0,
                        max: 2
                    },
                    reference: 'asset:material:heightMapFactor'
                }]
            })
        }]
    }, {
        root: {
            clearCoatPanel: new Panel({
                headerText: 'CLEARCOAT',
                collapsible: true,
                collapsed: true
            })
        },
        children: [{
            clearCoatFactorInspector: new pcui.AttributesInspector({
                assets: parent._args.assets,
                history: parent._args.history,
                attributes: [{
                    label: 'Clear Coat Factor',
                    path: 'data.clearCoat',
                    type: 'slider',
                    args: {
                        precision: 3,
                        step: 0.05,
                        min: 0,
                        max: 1
                    },
                    reference: 'asset:material:clearCoat'
                }]
            })
        }, {
            clearCoatInspector: new pcui.AttributesInspector({
                assets: parent._args.assets,
                history: parent._args.history,
                attributes: [..._textureAttribute('Clear Coat', 'clearCoat', TextureTypes.Color), {
                    label: 'Vertex Color',
                    path: 'data.clearCoatVertexColor',
                    type: 'boolean',
                    reference: 'asset:material:clearCoatVertexColor'
                }, {
                    label: 'Vertex Color Channel',
                    path: 'data.clearCoatVertexColorChannel',
                    type: 'select',
                    args: {
                        type: 'string',
                        options: [{
                            v: 'r', t: 'R'
                        }, {
                            v: 'g', t: 'G'
                        }, {
                            v: 'b', t: 'B'
                        }, {
                            v: 'a', t: 'A'
                        }]
                    },
                    reference: 'asset:material:clearCoatVertexColorChannel'
                }]
            })
        }, {
            clearCoatGlossInspector: new pcui.AttributesInspector({
                assets: parent._args.assets,
                history: parent._args.history,
                attributes: [{
                    type: 'divider'
                }, ..._textureAttribute('Clear Coat Gloss', 'clearCoatGloss', TextureTypes.Scalar), {
                    label: 'Vertex Color',
                    path: 'data.clearCoatGlossVertexColor',
                    type: 'boolean',
                    reference: 'asset:material:clearCoatGlossVertexColor'
                }, {
                    label: 'Vertex Color Channel',
                    path: 'data.clearCoatGlossVertexColorChannel',
                    type: 'select',
                    args: {
                        type: 'string',
                        options: [{
                            v: 'r', t: 'R'
                        }, {
                            v: 'g', t: 'G'
                        }, {
                            v: 'b', t: 'B'
                        }, {
                            v: 'a', t: 'A'
                        }]
                    },
                    reference: 'asset:material:clearCoatGlossVertexColorChannel'
                }, {
                    label: 'Glossiness',
                    path: 'data.clearCoatGloss',
                    type: 'slider',
                    args: {
                        precision: 3,
                        step: 0.05,
                        min: 0,
                        max: 1
                    },
                    reference: 'asset:material:clearCoatGloss'
                }, {
                    label: 'Invert',
                    path: 'data.clearCoatGlossInvert',
                    type: 'boolean',
                    reference: 'asset:material:clearCoatGlossInvert'
                }]
            })
        }, {
            clearCoatNormalInspector: new pcui.AttributesInspector({
                assets: parent._args.assets,
                history: parent._args.history,
                attributes: [..._textureAttribute('Clear Coat Normals', 'clearCoatNormal', TextureTypes.Normal), {
                    label: 'Bumpiness',
                    path: 'data.clearCoatBumpiness',
                    type: 'slider',
                    args: {
                        precision: 3,
                        step: 0.05,
                        min: 0,
                        max: 2
                    },
                    reference: 'asset:material:clearCoatBumpiness'
                }]
            })
        }]
    }, {
        root: {
            sheenPanel: new Panel({
                headerText: 'SHEEN',
                collapsible: true,
                collapsed: true
            })
        },
        children: [{
            sheenInspector: new pcui.AttributesInspector({
                assets: parent._args.assets,
                history: parent._args.history,
                attributes: [{
                    label: 'Use Sheen',
                    path: 'data.useSheen',
                    type: 'boolean',
                    reference: 'asset:material:useSheen'
                }, ..._textureAttribute('Sheen', 'sheen', TextureTypes.Color), {
                    label: 'Vertex Color',
                    path: 'data.sheenVertexColor',
                    type: 'boolean',
                    reference: 'asset:material:sheenVertexColor'
                }, {
                    label: 'Tint',
                    path: 'data.sheenTint',
                    type: 'boolean',
                    reference: 'asset:material:sheenTint'
                }, {
                    label: 'Color',
                    path: 'data.sheen',
                    type: 'rgb',
                    reference: 'asset:material:sheen'
                }, ..._textureAttribute('Sheen Glossiness', 'sheenGloss', TextureTypes.Scalar), {
                    label: 'Vertex Color',
                    path: 'data.sheenGlossVertexColor',
                    type: 'boolean',
                    reference: 'asset:material:sheenGlossVertexColor'
                }, {
                    label: 'Vertex Color Channel',
                    path: 'data.sheenGlossVertexColorChannel',
                    type: 'select',
                    reference: 'asset:material:sheenGlossVertexColorChannel',
                    args: {
                        type: 'string',
                        options: [{
                            v: 'r', t: 'R'
                        }, {
                            v: 'g', t: 'G'
                        }, {
                            v: 'b', t: 'B'
                        }, {
                            v: 'a', t: 'A'
                        }]
                    }
                }, {
                    label: 'Tint',
                    path: 'data.sheenGlossTint',
                    type: 'boolean',
                    reference: 'asset:material:sheenGlossTint'
                }, {
                    label: 'Glossiness',
                    path: 'data.sheenGloss',
                    type: 'slider',
                    reference: 'asset:material:sheenGloss'
                }, {
                    label: 'Invert',
                    path: 'data.sheenGlossInvert',
                    type: 'boolean',
                    reference: 'asset:material:sheenGlossInvert'
                }]
            })
        }]
    }, {
        root: {
            refractionPanel: new Panel({
                headerText: 'REFRACTION',
                collapsible: true,
                collapsed: true
            })
        },
        children: [{
            refractionInspector: new pcui.AttributesInspector({
                assets: parent._args.assets,
                history: parent._args.history,
                attributes: [{
                    label: 'Dynamic Refractions',
                    path: 'data.useDynamicRefraction',
                    type: 'boolean',
                    reference: 'asset:material:useDynamicRefraction'
                }, ..._textureAttribute('Refraction', 'refraction', TextureTypes.Scalar), {
                    label: 'Vertex Color',
                    path: 'data.refractionVertexColor',
                    type: 'boolean',
                    reference: 'asset:material:refractionVertexColor'
                }, {
                    label: 'Vertex Color Channel',
                    path: 'data.refractionVertexColorChannel',
                    type: 'select',
                    reference: 'asset:material:refractionVertexColorChannel',
                    args: {
                        type: 'string',
                        options: [{
                            v: 'r', t: 'R'
                        }, {
                            v: 'g', t: 'G'
                        }, {
                            v: 'b', t: 'B'
                        }, {
                            v: 'a', t: 'A'
                        }]
                    }
                }, {
                    label: 'Refraction',
                    path: 'data.refraction',
                    type: 'slider',
                    reference: 'asset:material:refraction'
                },  {
                    label: 'Index Of Refraction',
                    path: 'data.refractionIndex',
                    type: 'slider',
                    args: {
                        precision: 3,
                        step: 0.01,
                        min: 0,
                        max: 1
                    },
                    reference: 'asset:material:refractionIndex'
                }, ..._textureAttribute('Thickness', 'thickness', TextureTypes.Scalar), {
                    label: 'Vertex Color',
                    path: 'data.thicknessVertexColor',
                    type: 'boolean',
                    reference: 'asset:material:thicknessVertexColor'
                }, {
                    label: 'Vertex Color Channel',
                    path: 'data.thicknessVertexColorChannel',
                    type: 'boolean',
                    reference: 'asset:material:thicknessVertexColor',
                    args: {
                        type: 'string',
                        options: [{
                            v: 'r', t: 'R'
                        }, {
                            v: 'g', t: 'G'
                        }, {
                            v: 'b', t: 'B'
                        }, {
                            v: 'a', t: 'A'
                        }]
                    }
                }, {
                    label: 'Scale',
                    path: 'data.thickness',
                    type: 'number',
                    reference: 'asset:material:thickness',
                    args: {
                        precision: 3,
                        step: 10.0,
                        min: 0,
                        max: 1000
                    }
                }, {
                    label: 'Attenuation',
                    path: 'data.attenuation',
                    type: 'rgb',
                    reference: 'asset:material:attenuation'
                }, {
                    label: 'Attenuation Distance',
                    path: 'data.attenuationDistance',
                    type: 'number',
                    reference: 'asset:material:attenuationDistance',
                    args: {
                        precision: 3,
                        step: 10.0,
                        min: 0,
                        max: 1000
                    }
                }]
            })
        }]
    }, {
        root: {
            iridescencePanel: new Panel({
                headerText: 'IRIDESCENCE',
                collapsible: true,
                collapsed: true
            })
        },
        children: [{
            iridescenceInspector: new pcui.AttributesInspector({
                assets: parent._args.assets,
                history: parent._args.history,
                attributes: [{
                    label: 'Use Iridescence',
                    path: 'data.useIridescence',
                    type: 'boolean',
                    reference: 'asset:material:useIridescence'
                }, ..._textureAttribute('Iridescence', 'iridescence', TextureTypes.Scalar), {
                    label: 'Iridescence',
                    path: 'data.iridescence',
                    type: 'slider',
                    reference: 'asset:material:iridescence'
                }, ..._textureAttribute('Iridescence Thickness', 'iridescenceThickness', TextureTypes.Scalar), {
                    label: 'Thickness Minimum',
                    path: 'data.iridescenceThicknessMin',
                    type: 'number',
                    reference: 'asset:material:iridescenceThicknessMin',
                    args: {
                        precision: 3,
                        step: 10.0,
                        min: 0,
                        max: 1000
                    }
                }, {
                    label: 'Thickness Maximum',
                    path: 'data.iridescenceThicknessMax',
                    type: 'number',
                    reference: 'asset:material:iridescenceThicknessMax',
                    args: {
                        precision: 3,
                        step: 10.0,
                        min: 0,
                        max: 1000
                    }
                }, {
                    label: 'Index of Refraction',
                    path: 'data.iridescenceRefractionIndex',
                    type: 'slider',
                    reference: 'asset:material:iridescenceRefractionIndex',
                    args: {
                        precision: 3,
                        step: 0.1,
                        min: 0,
                        max: 7
                    }
                }]
            })
        }]
    }, {
        root: {
            envPanel: new Panel({
                headerText: 'ENVIRONMENT',
                collapsible: true,
                collapsed: true
            })
        },
        children: [{
            envInspector: new pcui.AttributesInspector({
                assets: parent._args.assets,
                history: parent._args.history,
                attributes: [{
                    label: 'Sphere Map',
                    path: 'data.sphereMap',
                    type: 'asset',
                    args: {
                        assetType: 'texture'
                    },
                    reference: 'asset:material:sphereMap'
                }, {
                    label: 'Cube Map',
                    path: 'data.cubeMap',
                    type: 'asset',
                    args: {
                        assetType: 'cubemap'
                    },
                    reference: 'asset:material:cubeMap'
                }, {
                    label: 'Reflectivity',
                    path: 'data.reflectivity',
                    type: 'slider',
                    args: {
                        precision: 3,
                        step: 0.01,
                        min: 0,
                        sliderMax: 8
                    },
                    reference: 'asset:material:reflectivity'
                }, {
                    type: 'divider'
                }, {
                    label: 'Projection',
                    path: 'data.cubeMapProjection',
                    type: 'select',
                    args: {
                        type: 'number',
                        options: [{
                            v: 0, t: 'Normal'
                        }, {
                            v: 1, t: 'Box'
                        }]
                    },
                    reference: 'asset:material:cubeMapProjection'
                }, {
                    label: 'Center',
                    path: 'data.cubeMapProjectionBox.center',
                    type: 'vec3',
                    args: {
                        placeholder: ['x', 'y', 'z']
                    },
                    reference: 'asset:material:cubeMapProjectionBoxCenter'
                }, {
                    label: 'Half Extents',
                    path: 'data.cubeMapProjectionBox.halfExtents',
                    type: 'vec3',
                    args: {
                        placeholder: ['w', 'h', 'd']
                    },
                    reference: 'asset:material:cubeMapProjectionBoxHalfExtents'
                }]
            })
        }]
    }, {
        root: {
            lightmapPanel: new Panel({
                headerText: 'LIGHTMAP',
                collapsible: true,
                collapsed: true
            })
        },
        children: [{
            lightmapInspector: new pcui.AttributesInspector({
                assets: parent._args.assets,
                history: parent._args.history,
                attributes: [..._textureAttribute('Lightmap', 'light', TextureTypes.Color), {
                    label: 'Vertex Color',
                    path: 'data.lightVertexColor',
                    type: 'boolean',
                    reference: 'asset:material:lightMapVertexColor'
                }]
            })
        }]
    }, {
        root: {
            otherPanel: new Panel({
                headerText: 'OTHER',
                collapsible: true,
                collapsed: true
            })
        },
        children: [{
            otherInspector: new pcui.AttributesInspector({
                assets: parent._args.assets,
                history: parent._args.history,
                attributes: [{
                    label: 'Depth Test',
                    path: 'data.depthTest',
                    type: 'boolean',
                    reference: 'asset:material:depthTest'
                }, {
                    label: 'Depth Write',
                    path: 'data.depthWrite',
                    type: 'boolean',
                    reference: 'asset:material:depthWrite'
                }, {
                    label: 'Cull Mode',
                    path: 'data.cull',
                    type: 'select',
                    args: {
                        type: 'number',
                        options: [{
                            v: 0, t: 'None'
                        }, {
                            v: 1, t: 'Back Faces'
                        }, {
                            v: 2, t: 'Front Faces'
                        }]
                    },
                    reference: 'asset:material:cull'
                }, {
                    label: 'Use Fog',
                    path: 'data.useFog',
                    type: 'boolean',
                    reference: 'asset:material:useFog'
                }, {
                    label: 'Use Lighting',
                    path: 'data.useLighting',
                    type: 'boolean',
                    reference: 'asset:material:useLighting'
                }, {
                    label: 'Use Skybox',
                    path: 'data.useSkybox',
                    type: 'boolean',
                    reference: 'asset:material:useSkybox'
                }, {
                    label: 'Use Gamma & Tonemap',
                    path: 'data.useGammaTonemap',
                    type: 'boolean',
                    reference: 'asset:material:useGammaTonemap'
                }]
            })
        }]
    }];

    const MAPS = {
        'ao': ['ambientInspector'],
        'diffuse': ['diffuseInspector'],
        'specular': ['specularWorkflowInspector', 'metalnessWorkflowInspector'],
        'specularityFactor': ['metalnessWorkflowInspector'],
        'emissive': ['emissiveInspector'],
        'normal': ['normalsInspector'],
        'opacity': ['opacityInspector'],
        'height': ['parallaxInspector'],
        'light': ['lightmapInspector'],
        'metalness': ['metalnessWorkflowInspector'],
        'gloss': ['glossInspector'],
        'clearCoat': ['clearCoatInspector'],
        'clearCoatGloss': ['clearCoatGlossInspector'],
        'clearCoatNormal': ['clearCoatNormalInspector'],
        'sheen': ['sheenInspector'],
        'sheenGloss': ['sheenInspector'],
        'refraction': ['refractionInspector'],
        'thickness': ['refractionInspector'],
        'iridescence': ['iridescenceInspector'],
        'iridescenceThickness': ['iridescenceInspector']
    };

    const COLLAPSED_PANEL_DEPENDENCIES = {
        '_offsetTilingPanel': ['diffuseMapOffset', 'diffuseMapTiling', 'diffuseMapRotation'],
        '_ambientPanel': ['aoMap'],
        '_diffusePanel': ['diffuseMap'],
        '_specularPanel': ['specularMap', 'metalnessMap', 'glossMap', 'specularityFactorMap'],
        '_clearCoatPanel': ['clearCoatMap', 'clearCoatGlossMap', 'clearCoatNormalMap'],
        '_sheenPanel': ['sheenMap', 'sheenGlossMap'],
        '_emissivePanel': ['emissiveMap'],
        '_opacityPanel': ['opacityMap'],
        '_normalsPanel': ['normalMap'],
        '_parallaxPanel': ['heightMap'],
        '_envPanel': ['sphereMap', 'cubeMap'],
        '_lightmapPanel': ['lightMap']
    };

    const BULK_SLOTS = {
        'ao': ['a', 'ao', 'ambient', 'ambientocclusion', 'gma', 'gmat', 'gmao', 'gmaa', 'rma', 'rmat', 'rmao', 'rmaa'],
        'diffuse': ['d', 'diff', 'diffuse', 'albedo', 'color', 'rgb', 'rgba'],
        'specular': ['s', 'spec', 'specular'],
        'specularityFactor': ['sf', 'specularityfactor'],
        'sheen': ['sh', 'sheen'],
        'sheenGloss': ['shg', 'sheenGloss'],
        'refraction': ['rf', 'refraction'],
        'thickness': ['th', 'thickness'],
        'iridescence': ['ir', 'iridescence'],
        'iridescenceThickness': ['irth', 'iridescenceThickness'],
        'metalness': ['m', 'met', 'metal', 'metalness', 'gma', 'gmat', 'gmao', 'gmaa', 'rma', 'rmat', 'rmao', 'rmaa'],
        'gloss': ['g', 'gloss', 'glossiness', 'gma', 'gmat', 'gmao', 'gmaa', 'rma', 'rmat', 'rmao', 'rmaa'],
        'clearCoat': ['cc', 'clearcoat'],
        'clearCoatGloss': ['ccg', 'clearcoatgloss'],
        'clearCoatNormal': ['ccn', 'clearcoatnormal'],
        'emissive': ['e', 'emissive'],
        'opacity': ['o', 't', 'opacity', 'alpha', 'transparency', 'gmat', 'gmao', 'gmaa', 'rgba', 'rmat', 'rmao', 'rmaa'],
        'normal': ['n', 'norm', 'normal', 'normals'],
        'height': ['p', 'h', 'height', 'parallax', 'bump'],
        'light': ['l', 'lm', 'light', 'lightmap']
    };

    const POSTFIX_TO_BULK_SLOT = {};
    for (const key in BULK_SLOTS) {
        for (let i = 0; i < BULK_SLOTS[key].length; i++) {
            POSTFIX_TO_BULK_SLOT[BULK_SLOTS[key][i]] = POSTFIX_TO_BULK_SLOT[BULK_SLOTS[key][i]] || [];
            POSTFIX_TO_BULK_SLOT[BULK_SLOTS[key][i]].push(key);
        }
    }

    const REGEX_EXT = /\.[a-z]+$/;
    const REGEX_MAP_OFFSET_TILING_OR_ROTATION = /^data.\w+?Map(?:(Offset|Tiling|Rotation)).*$/;

    const TextureTransformTypes = {
        Offset: "MapOffset",
        Tiling: "MapTiling",
        Rotation: "MapRotation"
    };

    class MaterialAssetInspector extends Container {
        constructor(args) {
            args = Object.assign({}, args);

            super(args);

            this._args = args;

            this.class.add(CLASS_ROOT);

            this.buildDom(DOM(this));

            if (!editor.call('users:hasFlag', 'hasExtendedMatProps')) {
                this._opacityInspector.getField('data.opacityFadesSpecular').parent.hidden = true;
            }

            // separated out becasue it needs more work before release
            if (!editor.call('users:hasFlag', 'hasAnisoGGXSpec')) {

                this._specularInspector.getField('data.enableGGXSpecular').parent.hidden = true;

            }

            this._assets = null;
            this._suppressToggleFields = false;
            this._suppressOffsetTilingAndRotationFields = false;
            this._suppressToggleFieldsTimeout = null;
            this._suppressUpdateAllOffsetAndTilingsTimeout = false;

            this._collapsedStates = {};
            this._collapseEvents = [];

            this._texturesBeforeHover = {};
            this._hoverEvents = [];

            this._assetEvents = [];

            const toggleFields = this._toggleFields.bind(this);

            this._offsetTilingInspector.getField('applyToAllMaps').on('change', this._onChangeApplyToAll.bind(this));
            this._offsetTilingInspector.getField('offset').on('change', this._onChangeOffset.bind(this));
            this._offsetTilingInspector.getField('tiling').on('change', this._onChangeTiling.bind(this));
            this._offsetTilingInspector.getField('rotation').on('change', this._onChangeRotation.bind(this));

            this._opacityInspector.getField('data.blendType').on('change', toggleFields);
            this._opacityInspector.getField('data.opacityVertexColor').on('change', toggleFields);
            this._opacityInspector.getField('data.opacityFadesSpecular').on('change', toggleFields);

            this._clearCoatFactorInspector.getField('data.clearCoat').on('change', toggleFields);

            this._specularInspector.getField('data.useMetalness').on('change', toggleFields);
            this._metalnessWorkflowInspector.getField('data.useMetalnessSpecularColor').on('change', toggleFields);

            this._specularInspector.getField('data.enableGGXSpecular').on('change', toggleFields);

            this._sheenInspector.getField('data.useSheen').on('change', toggleFields);
            this._refractionInspector.getField('data.useDynamicRefraction').on('change', toggleFields);
            this._iridescenceInspector.getField('data.useIridescence').on('change', toggleFields);

            for (const map in MAPS) {
                const inspectors = MAPS[map];
                for (const inspectorName of inspectors) {
                    const inspector = this[`_${inspectorName}`];
                    const texField = inspector.getField(`data.${map}Map`);
                    texField.on('change', value => this._onTextureChange(map, value));
                    texField.dragEnterFn = (type, data) => this._onTextureDragEnter(`${map}Map`, type, data);
                    texField.dragLeaveFn = () => this._onTextureDragLeave(`${map}Map`);

                    const vertexColorField = inspector.getField(`data.${map}VertexColor`);
                    if (vertexColorField)
                        vertexColorField.on('change', toggleFields);
                }
            }

            this._envInspector.getField('data.cubeMap').on('change', toggleFields);
            this._envInspector.getField('data.sphereMap').on('change', toggleFields);
            this._envInspector.getField('data.cubeMapProjection').on('change', toggleFields);
        }

        _toggleFields() {
            if (this._suppressToggleFields) return;

            const applyToAllMaps = this._offsetTilingInspector.getField('applyToAllMaps').value;
            this._offsetTilingInspector.getField('offset').parent.hidden = !applyToAllMaps;
            this._offsetTilingInspector.getField('tiling').parent.hidden = !applyToAllMaps;
            this._offsetTilingInspector.getField('rotation').parent.hidden = !applyToAllMaps;

            const useMetalnessSpecularColor = this._metalnessWorkflowInspector.getField('data.useMetalnessSpecularColor').value;
            this._metalnessWorkflowInspector.getField('data.specularMap').hidden = !useMetalnessSpecularColor;
            this._metalnessWorkflowInspector.getField('data.specularityFactorMap').hidden = !useMetalnessSpecularColor;

            const useSheen = this._sheenInspector.getField('data.useSheen').value;
            this._sheenInspector.getField('data.sheenMap').hidden = !useSheen;
            this._sheenInspector.getField('data.sheenGlossMap').hidden = !useSheen;

            const useDynamicRefraction = this._refractionInspector.getField('data.useDynamicRefraction').value;
            this._refractionInspector.getField('data.thicknessMap').hidden = !useDynamicRefraction;
            this._refractionInspector.getField('data.attenuation').parent.hidden = !useDynamicRefraction;
            this._refractionInspector.getField('data.attenuationDistance').parent.hidden = !useDynamicRefraction;

            const useIridescence = this._iridescenceInspector.getField('data.useIridescence').value;
            this._iridescenceInspector.getField('data.iridescenceMap').hidden = !useIridescence;
            this._iridescenceInspector.getField('data.iridescenceThicknessMap').hidden = !useIridescence;
            this._iridescenceInspector.getField('data.iridescenceThicknessMin').parent.hidden = !useIridescence;
            this._iridescenceInspector.getField('data.iridescenceThicknessMax').parent.hidden = !useIridescence;
            this._iridescenceInspector.getField('data.iridescenceRefractionIndex').parent.hidden = !useIridescence;

            const mapAttributes = ['MapUv', 'MapChannel', 'MapOffset', 'MapTiling', 'MapRotation', 'VertexColor', 'Tint', ''];
            mapAttributes.forEach((field) => {
                const spec = this._metalnessWorkflowInspector.getField(`data.specular${field}`);
                if (spec)
                    spec.parent.hidden = !useMetalnessSpecularColor;

                const specFactor = this._metalnessWorkflowInspector.getField(`data.specularityFactor${field}`);
                if (specFactor)
                    specFactor.parent.hidden = !useMetalnessSpecularColor;

                const sheen = this._sheenInspector.getField(`data.sheen${field}`);
                if (sheen)
                    sheen.parent.hidden = !useSheen;

                const sheenGloss = this._sheenInspector.getField(`data.sheenGloss${field}`);
                if (sheenGloss)
                    sheenGloss.parent.hidden = !useSheen;

                const thickness = this._refractionInspector.getField(`data.thickness${field}`);
                if (thickness) {
                    thickness.parent.hidden = !useDynamicRefraction;
                }

                const iridescence = this._iridescenceInspector.getField(`data.iridescence${field}`);
                if (iridescence) {
                    iridescence.parent.hidden = !useIridescence;
                }

                const iridescenceThickness = this._iridescenceInspector.getField(`data.iridescenceThickness${field}`);
                if (iridescenceThickness) {
                    iridescenceThickness.parent.hidden = !useIridescence;
                }
            });

            for (const map in MAPS) {
                const inspectors = MAPS[map];
                for (const inspectorName of inspectors) {
                    const inspector = this[`_${inspectorName}`];
                    const mapValue = inspector.getField(`data.${map}Map`).value && !inspector.getField(`data.${map}Map`).hidden;
                    inspector.getField(`data.${map}MapUv`).parent.hidden = !mapValue;
                    const channel = inspector.getField(`data.${map}MapChannel`);
                    if (channel)
                        channel.parent.hidden = !mapValue;
                    inspector.getField(`data.${map}MapOffset`).parent.hidden = !mapValue || applyToAllMaps;
                    inspector.getField(`data.${map}MapTiling`).parent.hidden = !mapValue || applyToAllMaps;
                    inspector.getField(`data.${map}MapRotation`).parent.hidden = !mapValue || applyToAllMaps;

                    const tint = inspector.getField(`data.${map}Tint`);
                    if (tint)
                        tint.parent.hidden = !mapValue;

                    const vertexColor = inspector.getField(`data.${map}VertexColorChannel`);
                    if (vertexColor) {
                        vertexColor.parent.hidden = !inspector.getField(`data.${map}VertexColor`).value;
                    }
                }
            }

            this._ambientInspector.getField('data.occludeSpecular').parent.hidden = !this._ambientInspector.getField('data.aoMap').value;

            const enableGGXSpecular = this._specularInspector.getField('data.enableGGXSpecular').value;
            this._specularInspector.getField('data.anisotropy').parent.hidden = !enableGGXSpecular;

            const useMetalness = this._specularInspector.getField('data.useMetalness').value;
            this._metalnessWorkflowInspector.hidden = !useMetalness;
            this._specularWorkflowInspector.hidden = useMetalness;

            const clearCoat = this._clearCoatFactorInspector.getField('data.clearCoat').value;
            this._clearCoatInspector.hidden = clearCoat === 0.0;
            this._clearCoatGlossInspector.hidden = clearCoat === 0.0;
            this._clearCoatNormalInspector.hidden = clearCoat === 0.0;

            const blendType = this._opacityInspector.getField('data.blendType').value;
            this._opacityInspector.getField('data.opacity').parent.hidden = ([2, 4, 6].indexOf(blendType) === -1);

            const opacityMapField = this._opacityInspector.getField('data.opacityMap');
            const opacityVertexColorField = this._opacityInspector.getField('data.opacityVertexColor');

            this._opacityInspector.getField('data.alphaTest').parent.hidden = !(opacityMapField.class.contains(pcui.CLASS_MULTIPLE_VALUES) || opacityMapField.value) && !(opacityVertexColorField.value || opacityVertexColorField.class.contains(pcui.CLASS_MULTIPLE_VALUES));

            const opacityFadesSpecular = this._opacityInspector.getField('data.opacityFadesSpecular').value;
            this._opacityInspector.getField('data.alphaFade').parent.hidden = opacityFadesSpecular;

            const normalMap = this._normalsInspector.getField('data.normalMap').value;
            this._normalsInspector.getField('data.bumpMapFactor').parent.hidden = !normalMap;

            const heightMap = this._parallaxInspector.getField('data.heightMap').value;
            this._parallaxInspector.getField('data.heightMapFactor').parent.hidden = !heightMap;

            const cubeMapField = this._envInspector.getField('data.cubeMap');
            const sphereMapField = this._envInspector.getField('data.sphereMap');
            cubeMapField.hidden = !cubeMapField.value && sphereMapField.value;
            sphereMapField.hidden = !sphereMapField.value && cubeMapField.value;

            const cubeMapProjectField = this._envInspector.getField('data.cubeMapProjection');
            cubeMapProjectField.parent.hidden = !cubeMapField.value;
            const cubeMapCenterField = this._envInspector.getField('data.cubeMapProjectionBox.center');
            cubeMapCenterField.parent.hidden = cubeMapProjectField.parent.hidden || cubeMapProjectField.value === 0;
            this._envInspector.getField('data.cubeMapProjectionBox.halfExtents').parent.hidden = cubeMapCenterField.parent.hidden;
        }

        _getApplyToAllValue() {
            if (!this._assets) return null;

            let offset = null;
            let tiling = null;
            let rotation = null;

            for (let i = 0; i < this._assets.length; i++) {
                for (const map in MAPS) {
                    const currentOffset = this._assets[i].get(`data.${map}MapOffset`);
                    if (!offset) {
                        offset = currentOffset;
                    }  else if (!offset.equals(currentOffset)) {
                        return false;
                    }

                    const currentTiling = this._assets[i].get(`data.${map}MapTiling`);
                    if (!tiling) {
                        tiling = currentTiling;
                    }  else if (!tiling.equals(currentTiling)) {
                        return false;
                    }

                    const currentRotation = this._assets[i].get(`data.${map}MapRotation`);
                    if (!rotation) {
                        rotation = currentRotation;
                    }  else if (rotation !== currentRotation) {
                        return false;
                    }
                }
            }

            return true;
        }

        _onChangeApplyToAll(value) {
            if (!this._assets) return;

            const suppressToggleFields = this._suppressToggleFields;
            if (suppressToggleFields) return;

            this._suppressToggleFields = true;

            if (value) {
                this._suppressOffsetTilingAndRotationFields = true;
                // initialize global offset and tiling to the first asset's diffuse offset and tiling
                const offsetField = this._offsetTilingInspector.getField('offset');
                const tilingField = this._offsetTilingInspector.getField('tiling');
                const rotationField = this._offsetTilingInspector.getField('rotation');

                offsetField.value = this._assets[0].get('data.diffuseMapOffset');
                tilingField.value = this._assets[0].get('data.diffuseMapTiling');
                rotationField.value = this._assets[0].get('data.diffuseMapRotation');

                this._suppressOffsetTilingAndRotationFields = false;

                const offset = offsetField.value;
                const tiling = tilingField.value;
                const rotation = rotationField.value;

                const assets = this._assets.slice();
                let prev = null;

                const redo = () => {
                    prev = [];
                    assets.forEach((asset) => {
                        for (const map in MAPS) {
                            const offsetPath = `data.${map}MapOffset`;
                            const tilingPath = `data.${map}MapTiling`;
                            const rotationPath = `data.${map}MapRotation`;
                            prev.push({
                                asset: asset,
                                map: map,
                                offset: asset.get(offsetPath),
                                tiling: asset.get(tilingPath),
                                rotation: asset.get(rotationPath)
                            });

                            const history = asset.history.enabled;
                            asset.history.enabled = false;
                            asset.set(offsetPath, offset);
                            asset.set(tilingPath, tiling);
                            asset.set(rotationPath, rotation);
                            asset.history.enabled = history;
                        }
                    });
                };

                const undo = () => {
                    prev.forEach((entry) => {
                        const asset = entry.asset.latest();
                        if (!asset) return;

                        const history = asset.history.enabled;
                        asset.history.enabled = false;
                        asset.set(`data.${entry.map}MapOffset`, entry.offset);
                        asset.set(`data.${entry.map}MapTiling`, entry.tiling);
                        asset.set(`data.${entry.map}MapRotation`, entry.rotation);
                        asset.history.enabled = history;
                    });

                    prev = null;
                };

                redo();

                if (this._args.history) {
                    this._args.history.add({
                        name: 'assets.materials.tiling-offset-rotation',
                        undo: undo,
                        redo: redo
                    });
                }
            }

            this._suppressToggleFields = suppressToggleFields;

            this._toggleFields();
        }


        _updateAllOffsetsTilingsOrRotationUiState(renderChanges) {
            if (!this._assets) return;

            const suppress = this._suppressToggleFields;
            this._suppressToggleFields = false;

            // only uncheck apply to all field - do not check it otherwise
            // user who is editing material will lose focus of the offset / tiling
            // field they are editing once they set it to a value that equals all the other
            // offset / tilings
            const applyToAll = this._getApplyToAllValue();
            if (!applyToAll) {
                const applyToAllMaps = this._offsetTilingInspector.getField('applyToAllMaps');
                applyToAllMaps.renderChanges = !!renderChanges;
                applyToAllMaps.value = false;
                applyToAllMaps.renderChanges = true;
            }

            if (applyToAll) {
                this._suppressOffsetTilingAndRotationFields = true;

                const offset = this._offsetTilingInspector.getField('offset');
                offset.renderChanges = !!renderChanges;
                offset.value = this._assets[0].get('data.diffuseMapOffset');
                offset.renderChanges = true;

                const tiling = this._offsetTilingInspector.getField('tiling');
                tiling.renderChanges = !!renderChanges;
                tiling.value = this._assets[0].get('data.diffuseMapTiling');
                tiling.renderChanges = true;

                const rotation = this._offsetTilingInspector.getField('rotation');
                rotation.renderChanges = !!renderChanges;
                rotation.value = this._assets[0].get('data.diffuseMapRotation');
                rotation.renderChanges = true;

                this._suppressOffsetTilingAndRotationFields = false;
            }

            this._suppressToggleFields = suppress;

            if (!this._suppressToggleFields) {
                this._toggleFields();
            }
        }


        _updateAllOffsetsTilingsAndRotations(value, transform) {
            if (value === null || !this._assets) return;

            const assets = this._assets.slice();

            let prev = null;

            const redo = () => {
                prev = [];

                assets.forEach((asset) => {
                    asset = asset.latest();
                    if (!asset) return;

                    const entry = {
                        asset: asset,
                        values: []
                    };

                    for (const map in MAPS) {
                        const path = `data.${map}${transform}`;
                        entry.values.push({
                            path: path,
                            value: asset.get(path)
                        });
                    }

                    prev.push(entry);

                    const history = asset.history.enabled;
                    asset.history.enabled = false;

                    for (const map in MAPS) {
                        asset.set(`data.${map}${transform}`, value);
                    }

                    asset.history.enabled = history;
                });
            };

            const undo = () => {
                prev.forEach((entry) => {
                    const asset = entry.asset.latest();
                    if (!asset) return;

                    const history = asset.history.enabled;
                    asset.history.enabled = false;

                    entry.values.forEach((item) => {
                        asset.set(item.path, item.value);
                    });

                    asset.history.enabled = history;
                });

                prev = null;
            };

            redo();

            if (this._args.history) {
                this._args.history.add({
                    name: `assets.materials.${transform}`,
                    undo: undo,
                    redo: redo
                });
            }

        }

        _onChangeOffset(value) {
            if (this._suppressOffsetTilingAndRotationFields) return;
            if (this._offsetTilingInspector.getField('applyToAllMaps').value) {
                this._updateAllOffsetsTilingsAndRotations(value, TextureTransformTypes.Offset);
            }
        }

        _onChangeTiling(value) {
            if (this._suppressOffsetTilingAndRotationFields) return;
            if (this._offsetTilingInspector.getField('applyToAllMaps').value) {
                this._updateAllOffsetsTilingsAndRotations(value, TextureTransformTypes.Tiling);
            }
        }

        _onChangeRotation(value) {
            if (this._suppressOffsetTilingAndRotationFields) return;
            if (this._offsetTilingInspector.getField('applyToAllMaps').value) {
                this._updateAllOffsetsTilingsAndRotations(value, TextureTransformTypes.Rotation);
            }
        }

        _onTextureChange(name, value) {
            if (this._suppressToggleFields) return;

            this._suppressToggleFields = true;

            const prev = [];

            try {
                // depending on the filename of the texture being
                // set, see if we can set more properties as well
                const asset = value ? this._args.assets.get(value) : null;
                if (!asset) return;
                const tokens = this._tokenizeFilename(asset.get('name'));
                if (!tokens) return;

                if (BULK_SLOTS[name].indexOf(tokens[1]) === -1) return;

                const path = asset.get('path');

                const texturesInSamePath = this._args.assets.find((asset) => {
                    return asset.get('type') === 'texture' &&
                            !asset.get('source') &&
                            path.equals(asset.get('path'));
                });

                const candidates = {};
                let hasCandidates = false;
                texturesInSamePath.forEach((entry) => {
                    const t = this._tokenizeFilename(entry[1].get('name'));

                    if (!t || t[0] !== tokens[0] || !POSTFIX_TO_BULK_SLOT[t[1]]) return;

                    for (let i = 0; i < POSTFIX_TO_BULK_SLOT[t[1]].length; i++) {
                        if (POSTFIX_TO_BULK_SLOT[t[1]][i] === name) continue;

                        candidates[POSTFIX_TO_BULK_SLOT[t[1]][i]] = {
                            texture: entry[1],
                            postfix: t[1]
                        };

                        hasCandidates = true;
                    }
                });

                if (hasCandidates) {
                    const assets = this._assets.slice();

                    assets.forEach((asset) => {
                        if (asset.get(`data.${name}Map`)) return;

                        const history = asset.history.enabled;
                        asset.history.enabled = false;

                        for (const slot in candidates) {
                            const key = `data.${slot}Map`;
                            if (asset.get(key)) continue;

                            prev.push({
                                asset: asset,
                                key: key,
                                value: parseInt(candidates[slot].texture.get('id'), 10),
                                old: null
                            });

                            // expand texture panel
                            const inspectors = MAPS[slot];
                            for (const inspectorName of inspectors) {
                                const inspector = this[`_${inspectorName}`];
                                if (inspector && inspector.parent && inspector.parent.collapsed) {
                                    inspector.parent.collapsed = false;
                                }
                            }

                            if (slot === 'ao') {
                                // ao can be in third color channel
                                if (/^(g|r)ma/.test(candidates[slot].postfix)) {
                                    const channel = asset.get('data.aoMapChannel');
                                    if (channel !== 'b') {
                                        prev.push({
                                            asset: asset,
                                            key: 'data.aoMapChannel',
                                            value: 'b',
                                            old: channel
                                        });
                                    }
                                }
                            } else if (slot === 'metalness') {
                                // use metalness
                                if (!asset.get('data.useMetalness')) {
                                    prev.push({
                                        asset: asset,
                                        key: 'data.useMetalness',
                                        value: true,
                                        old: false
                                    });
                                }

                                // metalness to maximum
                                const metalness = asset.get('data.metalness');
                                if (metalness !== 1) {
                                    prev.push({
                                        asset: asset,
                                        key: 'data.metalness',
                                        value: 1.0,
                                        old: metalness
                                    });
                                }

                                // metalness can be in second color channel
                                if (/^(g|r)ma/.test(candidates[slot].postfix)) {
                                    const channel = asset.get('data.metalnessMapChannel');
                                    if (channel !== 'g') {
                                        prev.push({
                                            asset: asset,
                                            key: 'data.metalnessMapChannel',
                                            value: 'g',
                                            old: channel
                                        });
                                    }
                                }
                            } else if (slot === 'gloss') {
                                // gloss to maximum
                                const shininess = asset.get('data.shininess');
                                if (shininess !== 100) {
                                    prev.push({
                                        asset: asset,
                                        key: 'data.shininess',
                                        value: 100.0,
                                        old: shininess
                                    });
                                }

                                // gloss shall be in first color channel
                                const channel = asset.get('data.glossMapChannel');
                                if (channel !== 'r') {
                                    prev.push({
                                        asset: asset,
                                        key: 'data.glossMapChannel',
                                        value: 'r',
                                        old: channel
                                    });
                                }
                            } else if (slot === 'opacity') {
                                // opacity can be in fourth color channel
                                if (/^(gma|rma|rgb)(t|o|a)$/.test(candidates[slot].postfix)) {
                                    const channel = asset.get('data.opacityMapChannel');
                                    if (channel !== 'a') {
                                        prev.push({
                                            asset: asset,
                                            key: 'data.opacityMapChannel',
                                            value: 'a',
                                            old: channel
                                        });
                                    }
                                }
                            }
                        }

                        asset.history.enabled = history;
                    });

                    const redo = () => {
                        let dirty = false;
                        prev.forEach((record) => {
                            const asset = record.asset.latest();
                            if (!asset) return;

                            const history = asset.history.enabled;
                            asset.history.enabled = false;
                            asset.set(record.key, record.value);
                            asset.history.enabled = history;

                            dirty = true;
                        });

                        return dirty;
                    };

                    const undo = () => {
                        prev.forEach((record) => {
                            const asset = record.asset.latest();
                            if (!asset) return;

                            const history = asset.history.enabled;
                            asset.history.enabled = false;
                            asset.set(record.key, record.old);
                            asset.history.enabled = history;

                        });
                    };

                    if (redo() && this._args.history) {
                        this._args.history.add({
                            name: 'material textures auto-bind',
                            undo: undo,
                            redo: redo
                        });
                    }
                }
            } catch (err) {
                log.error(err);
            } finally {
                if (prev.length) {
                    // if we have set other textures
                    // then we need to wait for their input fields to fire the
                    // change event before we can reset the suppressToggleFields flag.
                    // This is because the observer->element binding updates the element
                    // in a timeout.
                    if (!this._suppressToggleFieldsTimeout) {
                        this._suppressToggleFieldsTimeout = setTimeout(() => {
                            this._suppressToggleFieldsTimeout = null;
                            this._suppressToggleFields = false;
                            this._toggleFields();
                        });
                    }
                } else {
                    this._suppressToggleFields = false;
                    this._toggleFields();
                }
            }
        }

        _tokenizeFilename(filename) {
            filename = filename.trim().toLowerCase();

            if (!filename)
                return;

            // drop extension
            const ext = filename.match(REGEX_EXT);
            if (ext) filename = filename.slice(0, -ext[0].length);

            if (!filename)
                return;

            const parts = filename.split(/(\-|_|\.)/g);
            const tokens = [];

            for (let i = 0; i < parts.length; i++) {
                if (parts[i] === '-' || parts[i] === '_' || parts[i] === '.')
                    continue;

                tokens.push(parts[i]);
            }

            if (!tokens.length)
                return;

            if (tokens.length === 1)
                return ['', tokens[0]];

            const left = tokens.slice(0, -1).join('');
            const right = tokens[tokens.length - 1];

            return [left, right];
        }

        _onTextureDragEnter(path, type, dropData) {
            const app = editor.call('viewport:app');
            if (!app) return;

            if (!this._assets) return;

            const textureAsset = app.assets.get(dropData.id);
            if (!textureAsset) return;

            app.assets.load(textureAsset);

            const previewTexture = (engineAsset) => {
                if (!this._texturesBeforeHover[engineAsset.id]) {
                    this._texturesBeforeHover[engineAsset.id] = {};
                }

                this._texturesBeforeHover[engineAsset.id][path] = engineAsset.resource[path];

                engineAsset.resource[path] = textureAsset.resource;
                engineAsset.resource.update();
            };

            this._assets.forEach((asset) => {
                const engineAsset = app.assets.get(asset.get('id'));
                if (!engineAsset) return;

                app.assets.load(engineAsset);

                if (!engineAsset.resource) return;

                if (textureAsset.resource) {
                    previewTexture(engineAsset);
                } else {
                    const evt = {
                        asset: textureAsset,
                        fn: () => {
                            previewTexture(engineAsset);
                            editor.call('viewport:render');
                        }
                    };
                    textureAsset.once('load', evt.fn);
                    this._hoverEvents.push(evt);
                }
            });


            editor.call('viewport:render');
        }

        _onTextureDragLeave(path) {
            const app = editor.call('viewport:app');
            if (!app) return;

            if (!this._assets) return;

            this._assets.forEach((asset) => {
                const engineAsset = app.assets.get(asset.get('id'));
                if (!engineAsset) return;

                app.assets.load(engineAsset);

                if (!engineAsset.resource || !this._texturesBeforeHover[asset.get('id')]) return;

                engineAsset.resource[path] = this._texturesBeforeHover[asset.get('id')][path];
                engineAsset.resource.update();
            });

            this._texturesBeforeHover = {};
            this._hoverEvents.forEach((evt) => { evt.asset.off('load', evt.fn); });
            this._hoverEvents.length = 0;

            editor.call('viewport:render');
        }

        link(assets) {
            this.unlink();

            this._assets = assets;
            if (!this._assets) return;

            this._suppressToggleFields = true;

            this._materialInspector.link(assets);
            this._ambientInspector.link(assets);
            this._diffuseInspector.link(assets);
            this._specularInspector.link(assets);
            this._metalnessWorkflowInspector.link(assets);
            this._specularWorkflowInspector.link(assets);
            this._glossInspector.link(assets);
            this._clearCoatFactorInspector.link(assets);
            this._clearCoatInspector.link(assets);
            this._clearCoatGlossInspector.link(assets);
            this._clearCoatNormalInspector.link(assets);
            this._sheenInspector.link(assets);
            this._refractionInspector.link(assets);
            this._iridescenceInspector.link(assets);
            this._emissiveInspector.link(assets);
            this._opacityInspector.link(assets);
            this._normalsInspector.link(assets);
            this._parallaxInspector.link(assets);
            this._envInspector.link(assets);
            this._lightmapInspector.link(assets);
            this._otherInspector.link(assets);

            const applyToAllMaps = this._offsetTilingInspector.getField('applyToAllMaps');
            applyToAllMaps.renderChanges = false;
            applyToAllMaps.value = this._getApplyToAllValue();
            applyToAllMaps.renderChanges = true;

            this._updateAllOffsetsTilingsOrRotationUiState(false);

            this._suppressToggleFields = false;

            this._toggleFields();

            // set collapsed states for panels
            const collapsedStatesId = this._assets.map(asset => asset.get('id')).sort((a, b) => a - b).join(',');
            let previousState = this._collapsedStates[collapsedStatesId];
            if (!previousState) {
                previousState = {};
                this._collapsedStates[collapsedStatesId] = previousState;

                for (const panelName in COLLAPSED_PANEL_DEPENDENCIES) {
                    let collapsed = true;

                    for (let i = 0; i < COLLAPSED_PANEL_DEPENDENCIES[panelName].length; i++) {
                        const field = COLLAPSED_PANEL_DEPENDENCIES[panelName][i];
                        for (let j = 0; j < this._assets.length; j++) {
                            const type = editor.call('schema:material:getType', field);
                            if (type === 'asset') {
                                if (this._assets[j].get('data.' + field)) {
                                    collapsed = false;
                                    break;
                                }
                            } else if (type === 'vec2') {
                                const value = this._assets[j].get('data.' + field);
                                const defaultValue = editor.call('schema:material:getDefaultValueForField', field);
                                if (value && value[0] !== defaultValue[0] || value && value[1] !== defaultValue[1]) {
                                    collapsed = false;
                                    break;
                                }
                            } else if (type === 'number') {
                                const value = this._assets[j].get('data.' + field);
                                const defaultValue = editor.call('schema:material:getDefaultValueForField', field);
                                if (value !== defaultValue) {
                                    collapsed = false;
                                    break;
                                }
                            }
                        }

                        if (!collapsed) {
                            break;
                        }
                    }

                    previousState[panelName] = collapsed;
                }
            }

            for (const panelName in COLLAPSED_PANEL_DEPENDENCIES) {
                this[panelName].collapsed = previousState[panelName];

                // listen to collapse / expand events and update stored state
                this._collapseEvents.push(this[panelName].on('collapse', () => {
                    previousState[panelName] = true;
                }));

                this._collapseEvents.push(this[panelName].on('expand', () => {
                    previousState[panelName] = false;
                }));
            }

            // subscribe to offset / tiling changes to update the state of
            // apply to all fields
            this._assets.forEach((asset) => {
                this._assetEvents.push(asset.on('*:set', (path) => {
                    if (REGEX_MAP_OFFSET_TILING_OR_ROTATION.test(path)) {
                        if (this._suppressUpdateAllOffsetAndTilingsTimeout) return;

                        this._suppressUpdateAllOffsetAndTilingsTimeout = setTimeout(() => {
                            this._suppressUpdateAllOffsetAndTilingsTimeout = null;
                            this._updateAllOffsetsTilingsOrRotationUiState(true);
                        });
                    }
                }));
            });

            // update fresnel model when shader changes
            this._assets.forEach((asset) => {
                this._assetEvents.push(asset.on('data.shader:set', (value) => {
                    const history = asset.history.enabled;
                    asset.history.enabled = false;
                    asset.set('data.fresnelModel', value === 'blinn' ? 2 : 0);
                    asset.history.enabled = history;
                }));
            });

        }

        unlink() {
            if (!this._assets) return;

            this._assets = null;

            this._assetEvents.forEach(e => e.unbind());
            this._assetEvents.length = 0;

            this._collapseEvents.forEach(e => e.unbind());
            this._collapseEvents.length = 0;

            this._hoverEvents.forEach(evt => evt.asset.off('load', evt.fn));
            this._hoverEvents.length = 0;
            this._texturesBeforeHover = {};

            this._materialInspector.unlink();
            this._ambientInspector.unlink();
            this._diffuseInspector.unlink();
            this._specularInspector.unlink();
            this._metalnessWorkflowInspector.unlink();
            this._specularWorkflowInspector.unlink();
            this._glossInspector.unlink();
            this._clearCoatFactorInspector.unlink();
            this._clearCoatInspector.unlink();
            this._clearCoatGlossInspector.unlink();
            this._clearCoatNormalInspector.unlink();
            this._sheenInspector.unlink();
            this._refractionInspector.unlink();
            this._iridescenceInspector.unlink();
            this._emissiveInspector.unlink();
            this._opacityInspector.unlink();
            this._normalsInspector.unlink();
            this._parallaxInspector.unlink();
            this._envInspector.unlink();
            this._lightmapInspector.unlink();
            this._otherInspector.unlink();

            if (this._suppressToggleFieldsTimeout) {
                clearTimeout(this._suppressToggleFieldsTimeout);
                this._suppressToggleFieldsTimeout = null;
            }

            if (this._suppressUpdateAllOffsetAndTilingsTimeout) {
                clearTimeout(this._suppressUpdateAllOffsetAndTilingsTimeout);
                this._suppressUpdateAllOffsetAndTilingsTimeout = null;
            }
        }

        destroy() {
            if (this._destroyed) return;

            this._collapsedStates = {};

            super.destroy();
        }
    }

    return {
        MaterialAssetInspector: MaterialAssetInspector
    };
})());
