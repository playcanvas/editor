import type { Observer } from '@playcanvas/observer';
import {
    ADDRESS_CLAMP_TO_EDGE,
    EnvLighting,
    PIXELFORMAT_RGBA8,
    reprojectTexture,
    Texture,
    TEXTURETYPE_RGBM
} from 'playcanvas';


import {
    readGPUPixels,
    pixelsToPngBlob
} from './assets-utils';

editor.once('load', () => {

    let app = null;

    editor.once('viewport:load', (application: import('playcanvas').AppBase) => {
        app = application;
    });

    function generatePrefilteredCubemap(cubemap: Texture) {
        const device = cubemap.device;

        // generate a 128x128 cubemap with mipmaps to act as lighting source
        const lightingSource = EnvLighting.generateLightingSource(cubemap);

        // generate prefiltered lighting data
        const specPower = [undefined, 512, 128, 32, 8, 2, 1, 1];
        const levels = [];
        for (let i = 0; i < specPower.length; ++i) {
            const level = new Texture(device, {
                cubemap: true,
                name: `skyboxPrefilter${i}`,
                width: 128 >> i,
                height: 128 >> i,
                type: cubemap.type,
                addressU: ADDRESS_CLAMP_TO_EDGE,
                addressV: ADDRESS_CLAMP_TO_EDGE,
                fixCubemapSeams: true,
                mipmaps: false
            });

            reprojectTexture(lightingSource, level, {
                distribution: i === 0 ? 'none' : 'ggx',
                specularPower: specPower[i],
                numSamples: i === 0 ? 1 : 2048
            });

            // download level from GPU
            levels[i] = [];
            for (let face = 0; face < 6; ++face) {
                levels[i].push(readGPUPixels(level, face));
            }

            level.destroy();
        }

        lightingSource.destroy();

        return new Texture(device, {
            cubemap: true,
            name: 'filteredCubemap',
            width: 128,
            height: 128,
            type: cubemap.type,
            addressU: ADDRESS_CLAMP_TO_EDGE,
            addressV: ADDRESS_CLAMP_TO_EDGE,
            fixCubemapSeams: true,
            levels: levels
        });
    }

    /**
     * Generate an in-memory DDS representation of this texture. Only works on RGBA8 textures.
     * Currently, only used by the Editor to write prefiltered cubemaps to DDS format.
     *
     * @returns Buffer containing the DDS data.
     * @ignore
     */
    function getDds(texture: Texture): ArrayBuffer | undefined {
        if (texture.format !== PIXELFORMAT_RGBA8) {
            console.error('Only RGBA8 textures are supported');
            return undefined;
        }

        let fsize = 128;
        let idx = 0;
        while (texture._levels[idx]) {
            if (!texture.cubemap) {
                const mipSize = texture._levels[idx].length;
                if (!mipSize) {
                    console.error(`No byte array for mip ${idx}`);
                    return undefined;
                }
                fsize += mipSize;
            } else {
                for (let face = 0; face < 6; face++) {
                    if (!texture._levels[idx][face]) {
                        console.error(`No level data for mip ${idx}, face ${face}`);
                        return undefined;
                    }
                    const mipSize = texture._levels[idx][face].length;
                    if (!mipSize) {
                        console.error(`No byte array for mip ${idx}, face ${face}`);
                        return undefined;
                    }
                    fsize += mipSize;
                }
            }
            fsize += texture._levels[idx].length;
            idx++;
        }

        const buff = new ArrayBuffer(fsize);
        const header = new Uint32Array(buff, 0, 128 / 4);

        const DDS_MAGIC = 542327876; // "DDS"
        const DDS_HEADER_SIZE = 124;
        const DDS_FLAGS_REQUIRED = 0x01 | 0x02 | 0x04 | 0x1000 | 0x80000; // caps | height | width | pixelformat | linearsize
        const DDS_FLAGS_MIPMAP = 0x20000;
        const DDS_PIXELFORMAT_SIZE = 32;
        const DDS_PIXELFLAGS_RGBA8 = 0x01 | 0x40; // alpha | rgb
        const DDS_CAPS_REQUIRED = 0x1000;
        const DDS_CAPS_MIPMAP = 0x400000;
        const DDS_CAPS_COMPLEX = 0x8;
        const DDS_CAPS2_CUBEMAP = 0x200 | 0x400 | 0x800 | 0x1000 | 0x2000 | 0x4000 | 0x8000; // cubemap | all faces

        let flags = DDS_FLAGS_REQUIRED;
        if (texture._levels.length > 1) {
            flags |= DDS_FLAGS_MIPMAP;
        }

        let caps = DDS_CAPS_REQUIRED;
        if (texture._levels.length > 1) {
            caps |= DDS_CAPS_MIPMAP;
        }
        if (texture._levels.length > 1 || texture.cubemap) {
            caps |= DDS_CAPS_COMPLEX;
        }

        const caps2 = texture.cubemap ? DDS_CAPS2_CUBEMAP : 0;

        header[0] = DDS_MAGIC;
        header[1] = DDS_HEADER_SIZE;
        header[2] = flags;
        header[3] = texture.height;
        header[4] = texture.width;
        header[5] = texture.width * texture.height * 4;
        header[6] = 0; // depth
        header[7] = texture._levels.length;
        for (let i = 0; i < 11; i++) {
            header[8 + i] = 0;
        }
        header[19] = DDS_PIXELFORMAT_SIZE;
        header[20] = DDS_PIXELFLAGS_RGBA8;
        header[21] = 0; // fourcc
        header[22] = 32; // bpp
        header[23] = 0x00FF0000; // R mask
        header[24] = 0x0000FF00; // G mask
        header[25] = 0x000000FF; // B mask
        header[26] = 0xFF000000; // A mask
        header[27] = caps;
        header[28] = caps2;
        header[29] = 0;
        header[30] = 0;
        header[31] = 0;

        let offset = 128;
        if (!texture.cubemap) {
            for (let i = 0; i < texture._levels.length; i++) {
                const level = texture._levels[i];
                const mip = new Uint8Array(buff, offset, level.length);
                for (let j = 0; j < level.length; j++) {
                    mip[j] = level[j];
                }
                offset += level.length;
            }
        } else {
            for (let face = 0; face < 6; face++) {
                for (let i = 0; i < texture._levels.length; i++) {
                    const level = texture._levels[i][face];
                    const mip = new Uint8Array(buff, offset, level.length);
                    for (let j = 0; j < level.length; j++) {
                        mip[j] = level[j];
                    }
                    offset += level.length;
                }
            }
        }

        return buff;
    }

    const generateCubemap = (cubemapAsset: Observer, cubemap: Texture) => {
        const texture = generatePrefilteredCubemap(cubemap);
        const blob = new Blob([getDds(texture)], { type: 'image/dds' });
        texture.destroy();
        cubemapAsset.set('data.rgbm', cubemap.type === TEXTURETYPE_RGBM);

        return Promise.resolve({
            blob: blob,
            extension: '.dds'
        });
    };

    // given a cubemap with mipmaps, generate a prefiltered atlas
    const generatePrefilteredAtlas = (cubemap: Texture) => {
        const device = cubemap.device;
        const lighting = EnvLighting.generateLightingSource(cubemap, {
            size: 256
        });
        lighting.anisotropy = device.maxAnisotropy;
        const result = EnvLighting.generateAtlas(lighting);
        lighting.destroy();
        return result;
    };

    const generateEnvAtlas = async (cubemapAsset: Observer, cubemap: Texture) => {
        // generate env atlas
        const envAtlas = generatePrefilteredAtlas(cubemap);

        // read pixel data
        const pixels = readGPUPixels(envAtlas, 0);

        // convert to png blob
        const blob = await pixelsToPngBlob(pixels, envAtlas.width, envAtlas.height);

        // done with env atlas
        envAtlas.destroy();

        return {
            blob: blob,
            extension: '.png'
        };
    };

    editor.method('assets:cubemaps:prefilter', (cubemapAsset: Observer, generateLegacyCubemap: boolean, callback: (err: Error | null, data?: unknown) => void) => {
        if (!app) {
            // webgl not available
            callback(new Error('webgl not available'));
            return;
        }

        const onLoaded = (cubemap: Texture) => {
            (generateLegacyCubemap ? generateCubemap : generateEnvAtlas)(cubemapAsset, cubemap)
            .then((result) => {
                // upload blob as dds
                editor.call('assets:uploadFile', {
                    file: result.blob,
                    name: cubemapAsset.get('name') + result.extension,
                    asset: cubemapAsset,
                    type: 'cubemap'
                }, (err, data) => {
                    if (callback) {
                        callback(err, data);
                    }
                });
            });
        };

        const asset = app.assets.get(parseInt(cubemapAsset.get('id'), 10));
        if (asset) {
            if (asset.resource) {
                onLoaded(asset.resource);
            } else {
                asset.once('load', () => {
                    onLoaded(asset.resource);
                });
                app.assets.load(asset);
            }
        }
    });

    // invalidate prefiltering data on cubemaps
    // when one of face textures file is changed
    editor.on('assets:add', (asset: Observer) => {
        if (asset.get('type') !== 'cubemap') {
            return;
        }

        asset._textures = [];

        const invalidate = function () {
            if (!asset.get('file')) {
                return;
            }

            // TODO: do not set the file here but use the asset server
            asset.set('file', null);
        };

        const watchTexture = function (ind: number, id: string | number) {
            if (asset._textures[ind]) {
                asset._textures[ind].unbind();
            }

            asset._textures[ind] = null;

            if (!id) {
                return;
            }

            const texture = editor.call('assets:get', id);
            if (texture) {
                const fileSet = texture.get('file');
                asset._textures[ind] = texture.on('file.hash:set', () => {
                    // react only to file changes
                    if (fileSet) {
                        invalidate();
                    }
                });
            }
        };

        const watchFace = function (ind: number) {
            // update watching on face change
            asset.on(`data.textures.${ind}:set`, (id: string | number) => {
                watchTexture(ind, id);
            });
            // start watching
            watchTexture(ind, asset.get(`data.textures.${ind}`));
        };

        for (let i = 0; i < 6; i++) {
            watchFace(i);
        }
    });
});
