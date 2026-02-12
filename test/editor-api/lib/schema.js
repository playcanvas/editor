// test schema
window.schema = {
    scene: {
        entities: {
            $of: {
                components: {
                    testcomponent: {
                        entityRef: {
                            $type: 'string',
                            $editorType: 'entity',
                            $allowNull: true,
                            $default: null
                        },
                        entityArrayRef: {
                            $type: 'string',
                            $editorType: 'array:entity',
                            $default: []
                        },
                        nestedEntityRef: {
                            $type: 'map',
                            $of: {
                                entity: {
                                    $type: 'string',
                                    $editorType: 'entity'
                                }
                            }
                        },
                        assetRef: {
                            $type: 'number',
                            $editorType: 'asset',
                            $allowNull: true,
                            $default: null
                        },
                        assetArrayRef: {
                            $type: '[number]',
                            $editorType: 'array:asset',
                            $default: []
                        },
                        nestedAssetRef: {
                            $type: 'map',
                            $of: {
                                asset: {
                                    $type: 'number',
                                    $editorType: 'asset',
                                    $default: null
                                }
                            }
                        }
                    },
                    script: {
                        enabled: {
                            $type: 'boolean',
                            $default: true
                        },
                        order: {
                            $type: ['string'],
                            $default: []
                        },
                        scripts: {
                            $type: 'map',
                            $default: {}
                        }
                    }
                }
            }
        }
    },
    animstategraphData: {
        testData: {
            $type: 'number',
            $default: 0
        }
    },
    materialData: {
        diffuse: {
            $type: ["number"],
            $default: [0, 0, 0]
        }
    },
    modelData: {
        mapping: {
            $type: [{
                material: {
                    $type: 'number',
                    $editorType: 'asset'
                }
            }]
        }
    },
    testData: {
        assetRef: {
            $type: 'number',
            $editorType: 'asset',
            $default: null
        },
        assetArrayRef: {
            $type: ['number'],
            $editorType: 'array:asset',
            $default: []
        },
        nestedAssetRef: {
            $type: 'map',
            $of: {
                asset: {
                    $type: 'number',
                    $editorType: 'asset',
                    $default: null
                }
            }
        }
    }
};
