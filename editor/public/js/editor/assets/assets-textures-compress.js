Object.assign(pcui, (function () {
    'use strict';

    class TextureCompressor {
        // get the asset alpha flag
        static getAssetAlpha(asset) {
            return asset.get('meta.compress.alpha') && (asset.get('meta.alpha') || ((asset.get('meta.type') || '').toLowerCase() === 'truecoloralpha'));
        }

        // returns true if the dimensions are power of two and false otherwise.
        static isPOT(width, height) {
            return ((width & (width - 1)) === 0) && ((height & (height - 1)) === 0);
        }

        // this function checks whether a variant of a texture is dirty compared to user
        // controlled settings.
        static checkCompressRequired(asset, format) {
            if (!asset.get('file'))
                return false;

            // check width, height and POT
            const width = asset.get('meta.width');
            const height = asset.get('meta.height');
            if (!width || !height || !this.isPOT(width, height)) {
                return false;
            }

            const data = asset.get('file.variants.' + format);
            const rgbm = asset.get('data.rgbm');
            const alpha = this.getAssetAlpha(asset) || rgbm;
            const normals = !!asset.get('meta.compress.normals');
            const compress = asset.get('meta.compress.' + format);
            const mipmaps = asset.get('data.mipmaps');
            const compressionMode = asset.get('meta.compress.compressionMode');
            const quality = asset.get('meta.compress.quality');

            if (!!data !== compress) {
                if (format === 'etc1' && alpha)
                    return false;

                if (rgbm && !data)
                    return false;

                return true;
            } else if (format !== 'basis' && data && ((((data.opt & 1) !== 0) != alpha))) {
                return true;
            }

            if (data && format === 'pvr') {
                const bpp = asset.get('meta.compress.pvrBpp');
                if (data && ((data.opt & 128) !== 0 ? 4 : 2) !== bpp)
                    return true;
            } else if (format === 'etc1') {
                if (data && alpha)
                    return true;

                if (!data && alpha)
                    return false;
            }

            if (data && ((data.opt & 4) !== 0) !== !mipmaps)
                return true;

            if (format === 'basis' && data) {
                if ((!!(data.opt & 8) !== normals) ||
                    (data.quality === undefined) || (data.quality !== quality) ||
                    (data.compressionMode === undefined) || (data.compressionMode !== compressionMode)) {
                    return true;
                }
            }

            if (editor.call('users:hasFlag', 'hasRecompressFlippedTextures')) {
                if (asset.has(`file.variants.${format}`) && !asset.get(`file.variants.${format}.noFlip`)) {
                    return true;
                }
            }


            return false;
        }

        /**
         * Compresses textures
         *
         * @param {Observer[]} assets - The texture assets
         * @param {string[]} formats - The compression formats
         */
        static compress(assets, formats) {
            for (let i = 0; i < assets.length; i++) {
                if (!assets[i].get('file'))
                    continue;

                const variants = [];
                const toDelete = [];

                for (const format of formats) {
                    if (format !== 'original' && this.checkCompressRequired(assets[i], format)) {
                        let compress = assets[i].get('meta.compress.' + format);

                        // FIXME: why don't we allow a texture flagged as rgbm be compressed?
                        if (assets[i].get('data.rgbm'))
                            compress = false;

                        if (compress && format === 'etc1' && this.getAssetAlpha(assets[i])) {
                            compress = false;
                        }

                        if (compress) {
                            variants.push(format);
                        } else {
                            toDelete.push(format);
                        }
                    }
                }

                if (toDelete.length) {
                    editor.call('realtime:send', 'pipeline', {
                        name: 'delete-variant',
                        data: {
                            asset: parseInt(assets[i].get('uniqueId'), 10),
                            options: {
                                formats: toDelete
                            }
                        }
                    });
                }

                if (variants.length) {
                    const task = {
                        asset: parseInt(assets[i].get('uniqueId'), 10),
                        options: {
                            formats: variants,
                            alpha: this.getAssetAlpha(assets[i]),
                            mipmaps: assets[i].get('data.mipmaps'),
                            normals: !!assets[i].get('meta.compress.normals'),
                            noFlip: editor.call('users:hasFlag', 'hasRecompressFlippedTextures')
                        }
                    };

                    if (variants.indexOf('pvr') !== -1)
                        task.options.pvrBpp = assets[i].get('meta.compress.pvrBpp');

                    if (variants.indexOf('basis') !== -1) {
                        task.options.compressionMode = assets[i].get('meta.compress.compressionMode');
                        task.options.quality = assets[i].get('meta.compress.quality');
                    }

                    const sourceId = assets[i].get('source_asset_id');
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
