editor.once('load', function() {
    'use strict';


    // reusable cubemap preview class
    // use single instance instead of recreating it
    function CubeMapPreview() {
        this.canvas = document.createElement('canvas');

        // styling
        this.canvas.style.backgroundColor = '#000';
        this.canvas.style.display = 'block';
        this.canvas.style.width = '100%';
        this.canvas.style.minHeight = '32px';

        // size of image
        this.imageSize = 32;

        // context
        this.ctx = this.canvas.getContext('2d');

        // blank image
        this.imageBlank = new Image();
        this.imageBlank.src = '/editor/img/asset-placeholder-texture.png';

        // images
        this.images = [ ];
        for(var i = 0; i < 6; i++) {
            this.images[i] = new Image();
            this.images[i].onload = this.draw.bind(this);
        }

        // asset
        this.assetOnSet = null;

        // positions
        this.positions = [
            [ 2, 1 ], // right
            [ 0, 1 ], // left
            [ 1, 0 ], // top
            [ 1, 2 ], // bottom
            [ 1, 1 ], // front
            [ 3, 1 ] // back
        ];
    }

    // remove bindings and from DOM
    CubeMapPreview.prototype.unparent = function() {
        if (this.assetOnSet)
            this.assetOnSet.unbind();

        if (this.canvas.parentNode)
            this.canvas.parentNode.removeChild(this.canvas);

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for(var i = 0; i < 6; i++) {
            this.images[i].src = '';
        }
    };

    // draw canvas
    CubeMapPreview.prototype.draw = function() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for(var i = 0; i < 6; i++) {
            this.ctx.drawImage(this.imageBlank, this.positions[i][0] * this.imageSize, this.positions[i][1] * this.imageSize, this.imageSize, this.imageSize);
            this.ctx.drawImage(this.images[i], this.positions[i][0] * this.imageSize, this.positions[i][1] * this.imageSize, this.imageSize, this.imageSize);
        }
    };

    // resize
    CubeMapPreview.prototype.resize = function() {
        this.imageSize = Math.floor(this.canvas.clientWidth / 4);
        this.canvas.width = this.imageSize * 4;
        this.canvas.height = this.imageSize * 3;
    };

    // load data from asset and bind to changes
    CubeMapPreview.prototype.load = function(asset) {
        if (this.assetOnSet)
            this.assetOnSet.unbind();

        this.assetOnSet = asset.on('*:set', function(path, value) {
            if (path.indexOf('data.textures.') !== 0)
                return;

            var ind = parseInt(path.slice('data.textures.'.length), 10);
            this.loadImage(ind, value);
            this.draw();
        }.bind(this));

        for(var i = 0; i < 6; i++) {
            var id = asset.get('data.textures.' + i);
            // no texture set
            if (! id) {
                this.images[i].src = '';
                continue;
            }

            this.loadImage(i, id);
        }

        this.draw();
    };

    // load specific image
    CubeMapPreview.prototype.loadImage = function(i, id) {
        var texture = editor.call('assets:get', id);
        // no texture found
        if (! texture || texture.type !== 'texture' || ! texture.get('file.url')) {
            this.images[i].src = '';
            return;
        }
        // set image src
        this.images[i].src = config.url.api + '/' + texture.file.url;
    };


    // preview instance
    var preview = new CubeMapPreview();



    editor.on('attributes:inspect[asset]', function(assets) {
        if (assets.length !== 1 || assets[0].type !== 'cubemap')
            return;

        var asset = assets[0];


        // properties panel
        var paramsPanel = editor.call('attributes:addPanel');


        // minFilter
        var fieldMinFilter = editor.call('attributes:addField', {
            parent: paramsPanel,
            type: 'number',
            enum: {
                0: 'Nearest',
                1: 'Linear'
            },
            name: 'Min Filter'
        });
        fieldMinFilter.renderChanges = false;


        // mipFilter
        var fieldMipFilter = editor.call('attributes:addField', {
            parent: paramsPanel,
            type: 'number',
            enum: {
                0: 'None',
                1: 'Nearest',
                2: 'Linear'
            },
            name: 'Mip Filter'
        });
        fieldMipFilter.renderChanges = false;

        // data > ui
        var evtUpdateMinMip = asset.on('data.minFilter:set', function(value) {
            fieldMinFilter.value = [ 1, 4, 5 ].indexOf(value) === -1 ? 0 : 1;
            fieldMipFilter.value = (value < 2) ? 0 : (value % 2 + 1);
        });
        evtUpdateMinMip.call(asset.data.minFilter);

        // ui > data
        var updateAssetMinMip = function() {
            var a = fieldMinFilter.value;
            var b = fieldMipFilter.value;
            asset.data.minFilter = (a && b) ? (2 + a + b) : (b ? (1 + b) : a);
        };
        fieldMinFilter.on('change', updateAssetMinMip);
        fieldMipFilter.on('change', updateAssetMinMip);

        fieldMinFilter.renderChanges = true;
        fieldMipFilter.renderChanges = true;


        // magFilter
        var fieldMagFilter = editor.call('attributes:addField', {
            parent: paramsPanel,
            type: 'number',
            enum: {
                0: 'Nearest',
                1: 'Linear'
            },
            name: 'Mag Filter',
            link: asset,
            path: 'data.magFilter'
        });


        // anisotropy
        editor.call('attributes:addField', {
            parent: paramsPanel,
            name: 'Anisotropy',
            type: 'number',
            link: asset,
            path: 'data.anisotropy'
        });


        // textures
        var texturesPanel = editor.call('attributes:addPanel', {
            parent: paramsPanel,
            name: 'Textures'
        });


        // pos_x
        var fieldPosX = editor.call('attributes:addField', {
            parent: texturesPanel,
            type: 'number',
            name: 'Right',
            link: asset,
            path: 'data.textures.0'
        });

        // neg_x
        var fieldNegX = editor.call('attributes:addField', {
            parent: texturesPanel,
            type: 'number',
            name: 'Left',
            link: asset,
            path: 'data.textures.1'
        });

        // pos_y
        var fieldPosY = editor.call('attributes:addField', {
            parent: texturesPanel,
            type: 'number',
            name: 'Top',
            link: asset,
            path: 'data.textures.2'
        });

        // pos_x
        var fieldNegY = editor.call('attributes:addField', {
            parent: texturesPanel,
            type: 'number',
            name: 'Bottom',
            link: asset,
            path: 'data.textures.3'
        });

        // pos_z
        var fieldPosZ = editor.call('attributes:addField', {
            parent: texturesPanel,
            type: 'number',
            name: 'Front',
            link: asset,
            path: 'data.textures.4'
        });

        // neg_z
        var fieldNegZ = editor.call('attributes:addField', {
            parent: texturesPanel,
            type: 'number',
            name: 'Back',
            link: asset,
            path: 'data.textures.5'
        });


        // preview
        var previewPanel = editor.call('attributes:addPanel', {
            parent: paramsPanel,
            name: 'Preview'
        });

        // preview canvas
        previewPanel.append(preview.canvas);
        preview.resize();
        preview.load(asset);

        // periodical redraw on resizing
        var resizing = false;
        var resizedRedraw = function() {
            resizing = false;
            preview.resize();
            preview.draw();
        };
        var evtResize = editor.call('attributes.rootPanel').on('resize', function() {
            if (resizing) return;
            resizing = true;
            setTimeout(resizedRedraw, 200);
        });

        // clear bindings
        previewPanel.on('destroy', function() {
            evtResize.unbind();
            evtUpdateMinMip.unbind();
            preview.unparent();
        });
    });
});
