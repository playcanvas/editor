import {
    readGPUPixels,
    pixelsToPngBlob
} from './assets-utils';

const removeExtension = (name) => {
    const parts = name.split('.');
    if (parts.length > 1) {
        parts.pop();
    }
    return parts.join('.');
};

// Creates new cubemap asset from texture asset
editor.method('assets:textureToCubemap', (textureAsset, callback) => {
    // validate texture asset
    if (textureAsset.get('type') !== 'texture' || textureAsset.get('source')) {
        return;
    }

    // get the app
    const app = editor.call('viewport:app');
    if (!app) {
        return;
    }

    const nameBase = removeExtension(textureAsset.get('name'));
    const filenameBase = removeExtension(textureAsset.get('file.filename'));
    const path = textureAsset.get('path');
    const folder = path.length > 0 ? editor.call('assets:get', path[path.length - 1]) : null;

    // reproject the given equirect texture to a cubemap and compress each face to a png blob
    const createFaceBlobs = (sourceTexture) => {
        // create target cubemap texture
        const targetCubemap = new pc.Texture(app.graphicsDevice, {
            cubemap: true,
            width: sourceTexture.height / 2,
            height: sourceTexture.height / 2,
            format: sourceTexture.format,
            type: sourceTexture.type,
            mipmaps: false
        });

        // set required render state settings on source texture
        sourceTexture.addressU = pc.ADDRESS_REPEAT;
        sourceTexture.addressV = pc.ADDRESS_CLAMP_TO_EDGE;
        sourceTexture.anisotropy = app.graphicsDevice.maxAnisotropy;

        // perform reproject
        pc.reprojectTexture(sourceTexture, targetCubemap, {
            numSamples: 1
        });

        // download cubemap texture data from GPU
        const promises = [];
        for (let i = 0; i < 6; ++i) {
            const faceData = readGPUPixels(targetCubemap, i);
            promises.push(pixelsToPngBlob(faceData, targetCubemap.width, targetCubemap.height));
        }

        targetCubemap.destroy();

        return Promise.all(promises);
    };

    // given 6 cubemap face png blobs, create 6 new texture assets
    const createFaceAssets = (faceBlobs) => {
        const promises = [];

        const faceNames = ['px', 'nx', 'py', 'ny', 'pz', 'nz'];
        faceBlobs.forEach((faceBlob, index) => {
            promises.push(new Promise((resolve, reject) => {
                editor.call('assets:uploadFile', {
                    name: `${nameBase}_${faceNames[index]}.png`,
                    type: 'texture',
                    filename: `${filenameBase}_${faceNames[index]}.png`,
                    file: faceBlob,
                    data: {
                        rgbm: textureAsset.get('data.rgbm')
                    },
                    parent: folder
                }, (err, data) => {
                    resolve(data.id);
                });
            }));
        });

        return Promise.all(promises);
    };

    const onLoaded = async (sourceTexture) => {
        const faceBlobs = await createFaceBlobs(sourceTexture);
        const faceIds = await createFaceAssets(faceBlobs);
        const faceAssets = faceIds.map(id => editor.call('assets:get', id));

        // create the cubemap asset
        editor.api.globals.assets.createCubemap({
            name: `${nameBase}_cubemap`,
            textures: faceAssets,
            folder: folder
        });
    };

    const asset = app.assets.get(parseInt(textureAsset.get('id'), 10));
    if (asset) {
        if (asset.resource) {
            onLoaded(asset.resource);
        } else {
            asset.once('load', (asset) => {
                onLoaded(asset.resource);
            });
            app.assets.load(asset);
        }
    }
});
