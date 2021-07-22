Object.assign(pcui, (function () {
    'use strict';

    class TextureCompressor {
        // returns true if the dimensions are power of two and false otherwise.
        static isPOT(width, height) {
            return ((width & (width - 1)) === 0) && ((height & (height - 1)) === 0);
        }

        // returns true if the texture has an alpha channel
        static hasAlpha(asset) {
            return asset.get('meta.alpha') || ((asset.get('meta.type') || '').toLowerCase() === 'truecoloralpha');
        }

        // get the asset alpha flag
        static getAssetAlpha(asset) {
            return this.hasAlpha(asset) && asset.get('meta.compress.alpha');
        }

        // determine whether the image may be compressed to the supplied format
        // given platform and compression format restrictions
        static isCompressAllowed(asset, format) {
            // only allow POT textures to be compressed due to WebGL1 restrictions (for now)
            const width = asset.get('meta.width');
            const height = asset.get('meta.height');
            if (!width || !height || !this.isPOT(width, height)) {
                return false;
            }

            // etc1 can't store alpha
            const alpha = this.getAssetAlpha(asset);
            if (format === 'etc1' && alpha) {
                return false;
            }

            // FIXME: for some reason we disallow rgbm to be compressed
            const rgbm = asset.get('data.rgbm');
            if (rgbm) {
                return false;
            }

            return true;
        }

        // check whether a variant of a texture asset is dirty compared to the current user selection
        // (and so requires recompression)
        static checkRecompressRequired(asset, format) {
            // get the existing variant structure
            const variant = asset.get('file.variants.' + format);

            // extract flags of the variant in question
            const variantHasAlpha = !!(variant.opt & 1);
            const variantHasMipmaps =  !(variant.opt & 4);  // NOTE: mipmap flag indicates NO mipmaps
            const variantHasNormals = !!(variant.opt & 8);
            const variantHasPVR4Bpp = !!(variant.opt & 128);

            // check mipmaps dirty
            if (variantHasMipmaps !== asset.get('data.mipmaps')) {
                return true;
            }

            if (format === 'basis') {
                // normals dirty
                if (variantHasNormals !== asset.get('meta.compress.normals')) {
                    return true;
                }

                // quality dirty
                if (variant.quality !== asset.get('meta.compress.quality')) {
                    return true;
                }

                // compression mode dirty
                if (variant.compressionMode !== asset.get('meta.compress.compressionMode')) {
                    return true;
                }
            } else {
                // alpha dirty
                if (variantHasAlpha !== this.getAssetAlpha(asset)) {
                    return true;
                }

                // pvr bpp dirty
                if (format === 'pvr' && ((variantHasPVR4Bpp ? 4 : 2) !== asset.get('meta.compress.pvrBpp'))) {
                    return true;
                }
            }

            // check whether the compressed texture requires flipY due to https://github.com/playcanvas/engine/pull/3335
            if (editor.call('users:hasFlag', 'hasRecompressFlippedTextures') &&
                asset.has(`file.variants.${format}`) &&
                !asset.get(`file.variants.${format}.noFlip`)) {
                return true;
            }

            return false;
        }

        // determine the type of processing required for the asset: returns either 'none', 'delete' or 'compress'
        static determineRequiredProcessing(asset, format, force) {
            const variantRequested = asset.get('meta.compress.' + format) &&
                                     this.isCompressAllowed(asset, format);
            const variantExists = !!asset.get('file.variants.' + format);

            if (variantRequested !== variantExists) {
                return variantRequested ? 'compress' : 'delete';
            }

            return (variantExists && (force || this.checkRecompressRequired(asset, format))) ? 'compress' : 'none';
        }

        /**
         * Compresses textures
         *
         * @param {Observer[]} assets - The texture assets
         * @param {string[]} formats - The compression formats
         * @param {boolean} force - Force recompression. If false then the method will
         * check if recompression is needed first.
         */
        static compress(assets, formats, force) {
            for (let i = 0; i < assets.length; i++) {
                const asset = assets[i];

                if (!asset.get('file'))
                    continue;

                const variants = [];
                const toDelete = [];

                for (const format of formats) {
                    if (format !== 'original') {
                        switch (this.determineRequiredProcessing(asset, format, force)) {
                            case 'compress':
                                variants.push(format);
                                break;
                            case 'delete':
                                toDelete.push(format);
                                break;
                            default:
                                break;
                        }
                    }
                }

                if (toDelete.length) {
                    editor.call('realtime:send', 'pipeline', {
                        name: 'delete-variant',
                        data: {
                            asset: parseInt(asset.get('uniqueId'), 10),
                            options: {
                                formats: toDelete
                            }
                        }
                    });
                }

                if (variants.length) {
                    const task = {
                        asset: parseInt(asset.get('uniqueId'), 10),
                        options: {
                            formats: variants,
                            alpha: this.getAssetAlpha(asset),
                            mipmaps: asset.get('data.mipmaps'),
                            normals: !!asset.get('meta.compress.normals'),
                            noFlip: editor.call('users:hasFlag', 'hasRecompressFlippedTextures')
                        }
                    };

                    if (variants.indexOf('pvr') !== -1)
                        task.options.pvrBpp = asset.get('meta.compress.pvrBpp');

                    if (variants.indexOf('basis') !== -1) {
                        task.options.compressionMode = asset.get('meta.compress.compressionMode');
                        task.options.quality = asset.get('meta.compress.quality');
                    }

                    const sourceId = asset.get('source_asset_id');
                    if (sourceId) {
                        const sourceAsset = editor.call('assets:get', sourceId);
                        if (sourceAsset)
                            task.source = parseInt(sourceAsset.get('uniqueId'), 10);
                    }

                    editor.call('realtime:send', 'pipeline', {
                        name: 'compress',
                        data: task
                    });
                }
            }
        }
    }

    return {
        TextureCompressor: TextureCompressor
    };
})());
