editor.once('load', function() {
    'use strict';

    var enabled = editor.call('tools:enabled');
    var viewport = editor.call('viewport');

    editor.on('tools:state', function(state) {
        enabled = state;
    });

    var panel = document.createElement('div');
    panel.classList.add('frame');
    editor.call('tools:root').appendChild(panel);

    var addPanel = function(args) {
        var element = document.createElement('div');
        element.classList.add('panel');
        panel.appendChild(element);

        element._header = document.createElement('div');
        element._header.classList.add('header');
        element._header.textContent = args.title;
        element.appendChild(element._header);

        element._header.addEventListener('click', function() {
            if (element.classList.contains('folded')) {
                element.classList.remove('folded');
            } else {
                element.classList.add('folded');
            }
        }, false);

        return element;
    };

    var addField = function(args) {
        var row = document.createElement('div');
        row.classList.add('row');

        row._title = document.createElement('div');
        row._title.classList.add('title');
        row._title.textContent = args.title || '';
        row.appendChild(row._title);

        row._field = document.createElement('div');
        row._field.classList.add('field');
        row._field.textContent = args.value || '-';
        row.appendChild(row._field);

        Object.defineProperty(row, 'value', {
            set: function(value) {
                this._field.textContent = value !== undefined ? value : '';
            }
        });

        return row;
    };
    editor.method('tools:frame:field:add', function(name, title, value) {
        var field = addField({
            title: title,
            value: value
        });
        fieldsCustom[name] = field;
        panelGame.appendChild(field);
    });
    editor.method('tools:frame:field:value', function(name, value) {
        if (! fieldsCustom[name])
            return;

        fieldsCustom[name].value = value;
    });


    // convert number of bytes to human form
    var bytesToHuman = function(bytes) {
        if (isNaN(bytes) || bytes === 0) return '0 B';
        var k = 1000;
        var sizes = ['b', 'Kb', 'Mb', 'Gb', 'Tb', 'Pb', 'Eb', 'Zb', 'Yb'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
    };


    // frame
    var panelFrame = addPanel({
        title: 'Frame'
    });
    // scene
    var panelScene = addPanel({
        title: 'Scene'
    });
    // drawCalls
    var panelDrawCalls = addPanel({
        title: 'Draw Calls'
    });
    // particles
    var panelParticles = addPanel({
        title: 'Particles'
    });
    // shaders
    var panelShaders = addPanel({
        title: 'Shaders'
    });
    // lightmapper
    var panelLightmap = addPanel({
        title: 'Lightmapper'
    });
    // vram
    var panelVram = addPanel({
        title: 'VRAM'
    });
    // game
    var panelGame = addPanel({
        title: 'Game'
    });


    var fieldsCustom = { };

    var fields = [{
        key: [ 'frame', 'fps' ],
        panel: panelFrame,
        title: 'FPS',
        update: false
    }, {
        key: [ 'frame', 'ms' ],
        panel: panelFrame,
        title: 'MS',
        format: function(value) {
            return value.toFixed(2);
        }
    }, {
        key: [ 'frame', 'cameras' ],
        title: 'Cameras',
        panel: panelFrame
    }, {
        key: [ 'frame', 'cullTime' ],
        title: 'Cull Time',
        panel: panelFrame,
        format: function(value) {
            return value.toFixed(3);
        }
    }, {
        key: [ 'frame', 'sortTime' ],
        title: 'Sort Time',
        panel: panelFrame,
        format: function(value) {
            return value.toFixed(3);
        }
    }, {
        key: [ 'frame', 'shaders' ],
        title: 'Shaders',
        panel: panelFrame
    }, {
        key: [ 'frame', 'materials' ],
        title: 'Materials',
        panel: panelFrame
    }, {
        key: [ 'frame', 'triangles' ],
        title: 'Triangles',
        panel: panelFrame,
        format: function(value) {
            return value.toLocaleString();
        }
    }, {
        key: [ 'frame', 'otherPrimitives' ],
        title: 'Other Primitives',
        panel: panelFrame
    }, {
        key: [ 'frame', 'shadowMapUpdates' ],
        title: 'ShadowMaps Updates',
        panel: panelFrame
    }, {
        key: [ 'frame', 'shadowMapTime' ],
        title: 'ShadowMaps Time',
        panel: panelFrame,
        format: function(value) {
            return value.toFixed(2);
        }
    }, {
        key: [ 'frame', 'updateTime' ],
        title: 'Update Time',
        panel: panelFrame,
        format: function(value) {
            return value.toFixed(2);
        }
    }, {
        key: [ 'frame', 'physicsTime' ],
        title: 'Physics Time',
        panel: panelFrame,
        format: function(value) {
            return value.toFixed(2);
        }
    }, {
        key: [ 'frame', 'renderTime' ],
        title: 'Render Time',
        panel: panelFrame,
        format: function(value) {
            return value.toFixed(2);
        }
    }, {
        key: [ 'frame', 'forwardTime' ],
        title: 'Forward Time',
        panel: panelFrame,
        format: function(value) {
            return value.toFixed(2);
        }
    }, {
        key: [ 'scene', 'meshInstances' ],
        title: 'Mesh Instances',
        panel: panelScene
    }, {
        key: [ 'scene', 'lights' ],
        title: 'Lights',
        panel: panelScene
    }, {
        key: [ 'scene', 'dynamicLights' ],
        title: 'Lights (Dynamic)',
        panel: panelScene
    }, {
        key: [ 'scene', 'bakedLights' ],
        title: 'Lights (Baked)',
        panel: panelScene
    }, {
        key: [ 'drawCalls', 'total' ],
        title: 'Total',
        panel: panelDrawCalls,
        format: function(value) {
            return value.toLocaleString();
        }
    }, {
        key: [ 'drawCalls', 'forward' ],
        title: 'Forward',
        panel: panelDrawCalls,
        format: function(value) {
            return value.toLocaleString();
        }
    }, {
        key: [ 'drawCalls', 'skinned' ],
        title: 'Skinned',
        panel: panelDrawCalls,
        format: function(value) {
            return value.toLocaleString();
        }
    }, {
        key: [ 'drawCalls', 'shadow' ],
        title: 'Shadow',
        panel: panelDrawCalls,
        format: function(value) {
            return value.toLocaleString();
        }
    }, {
        key: [ 'drawCalls', 'depth' ],
        title: 'Depth',
        panel: panelDrawCalls,
        format: function(value) {
            return value.toLocaleString();
        }
    }, {
        key: [ 'drawCalls', 'instanced' ],
        title: 'Instanced',
        panel: panelDrawCalls,
        format: function(value) {
            return value.toLocaleString();
        }
    }, {
        key: [ 'drawCalls', 'removedByInstancing' ],
        title: 'Instancing Benefit',
        panel: panelDrawCalls,
        format: function(value) {
            return '-' + value.toLocaleString();
        }
    }, {
        key: [ 'drawCalls', 'immediate' ],
        title: 'Immediate',
        panel: panelDrawCalls,
        format: function(value) {
            return value.toLocaleString();
        }
    }, {
        key: [ 'drawCalls', 'misc' ],
        title: 'Misc',
        panel: panelDrawCalls,
        format: function(value) {
            return value.toLocaleString();
        }
    }, {
        key: [ 'particles', 'updatesPerFrame' ],
        title: 'Updates',
        panel: panelParticles
    }, {
        key: [ 'particles', 'frameTime' ],
        title: 'Update Time',
        panel: panelParticles,
        format: function(value) {
            return value.toLocaleString();
        }
    }, {
        key: [ 'shaders', 'linked' ],
        title: 'Linked',
        panel: panelShaders,
        format: function(value) {
            return value.toLocaleString();
        }
    }, {
        key: [ 'shaders', 'vsCompiled' ],
        title: 'Compiled VS',
        panel: panelShaders,
        format: function(value) {
            return value.toLocaleString();
        }
    }, {
        key: [ 'shaders', 'fsCompiled' ],
        title: 'Compiled FS',
        panel: panelShaders,
        format: function(value) {
            return value.toLocaleString();
        }
    }, {
        key: [ 'shaders', 'materialShaders' ],
        title: 'Materials',
        panel: panelShaders,
        format: function(value) {
            return value.toLocaleString();
        }
    }, {
        key: [ 'shaders', 'compileTime' ],
        title: 'Compile Time',
        panel: panelShaders,
        format: function(value) {
            return value.toFixed(3);
        }
    }, {
        key: [ 'lightmapper', 'renderPasses' ],
        title: 'Render Passes',
        panel: panelLightmap,
        format: function(value) {
            return value.toLocaleString();
        }
    }, {
        key: [ 'lightmapper', 'lightmapCount' ],
        title: 'Textures',
        panel: panelLightmap,
        format: function(value) {
            return value.toLocaleString();
        }
    }, {
        key: [ 'lightmapper', 'shadersLinked' ],
        title: 'Shaders Linked',
        panel: panelLightmap,
        format: function(value) {
            return value.toLocaleString();
        }
    }, {
        key: [ 'lightmapper', 'totalRenderTime' ],
        title: 'Total Render Time',
        panel: panelLightmap,
        format: function(value) {
            return value.toFixed(3);
        }
    }, {
        key: [ 'lightmapper', 'forwardTime' ],
        title: 'Forward Time',
        panel: panelLightmap,
        format: function(value) {
            return value.toFixed(3);
        }
    }, {
        key: [ 'lightmapper', 'fboTime' ],
        title: 'FBO Time',
        panel: panelLightmap,
        format: function(value) {
            return value.toFixed(3);
        }
    }, {
        key: [ 'lightmapper', 'shadowMapTime' ],
        title: 'ShadowMap Time',
        panel: panelLightmap,
        format: function(value) {
            return value.toFixed(3);
        }
    }, {
        key: [ 'lightmapper', 'compileTime' ],
        title: 'Shader Compile Time',
        panel: panelLightmap,
        format: function(value) {
            return value.toFixed(3);
        }
    }, {
        key: [ 'vram', 'ib' ],
        title: 'Index Buffers',
        panel: panelVram,
        format: bytesToHuman
    }, {
        key: [ 'vram', 'vb' ],
        title: 'Vertex Buffers',
        panel: panelVram,
        format: bytesToHuman
    }, {
        key: [ 'vram', 'texShadow' ],
        title: 'Shadowmaps',
        panel: panelVram,
        format: bytesToHuman
    }, {
        key: [ 'vram', 'texLightmap' ],
        title: 'Lightmaps',
        panel: panelVram,
        format: bytesToHuman
    }, {
        key: [ 'vram', 'texAsset' ],
        title: 'Texture Assets',
        panel: panelVram,
        format: bytesToHuman
    }, {
        key: [ 'vram', 'tex' ],
        title: 'Textures Other',
        panel: panelVram,
        format: function(bytes) {
            return bytesToHuman(bytes - (viewport.stats.vram.texLightmap + viewport.stats.vram.texShadow + viewport.stats.vram.texAsset));
        }
    }, {
        key: [ 'vram', 'tex' ],
        title: 'Textures Total',
        panel: panelVram,
        format: bytesToHuman
    }, {
        key: [ 'vram', 'totalUsed' ],
        title: 'Total',
        panel: panelVram,
        format: bytesToHuman
    }]

    // create fields
    for(var i = 0; i < fields.length; i++) {
        fields[i].field = addField({
            title: fields[i].title || fields[i].key[1]
        });
        fields[i].panel.appendChild(fields[i].field);

        if (fields[i].custom)
            fieldsCustom[fields[i].custom] = fields[i].field;
    }

    // update frame fields
    viewport.on('frameEnd', function() {
        if (! enabled)
            return;

        for(var i = 0; i < fields.length; i++) {
            if (fields[i].ignore)
                continue;

            if (! viewport.stats.hasOwnProperty(fields[i].key[0]) || ! viewport.stats[fields[i].key[0]].hasOwnProperty(fields[i].key[1]))
                continue;

            var value = viewport.stats[fields[i].key[0]][fields[i].key[1]];

            if (fields[i].format)
                value = fields[i].format(value);

            fields[i].field.value = value;
        }
    });
});
