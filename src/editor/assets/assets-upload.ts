import { config } from '@/editor/config';

editor.once('load', () => {
    let uploadJobs = 0;
    const projectUserSettings = editor.call('settings:projectUser');
    const legacyScripts = editor.call('settings:project').get('useLegacyScripts');

    const targetExtensions = {
        'jpg': true,
        'jpeg': true,
        'png': true,
        'gif': true,
        'webp': true,
        'avif': true,
        'css': true,
        'html': true,
        'json': true,
        'xml': true,
        'txt': true,
        'vert': true,
        'frag': true,
        'glsl': true,
        'mp3': true,
        'ogg': true,
        'opus': true,
        'wav': true,
        'mp4': true,
        'm4a': true,
        'js': true,
        'mjs': true,
        'atlas': true,
        'ply': true,
        'wasm': true,
        'sog': true
    };

    const typeToExt = {
        'scene': ['fbx', 'dae', 'obj', '3ds', 'glb'],
        'text': ['txt', 'xml', 'atlas'],
        'html': ['html'],
        'css': ['css'],
        'json': ['json'],
        'texture': ['tif', 'tga', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'dds', 'hdr', 'exr', 'webp', 'avif'],
        'audio': ['m4a', 'mp3', 'mp4', 'ogg', 'opus', 'wav'],
        'shader': ['glsl', 'frag', 'vert'],
        'script': ['js', 'mjs'],
        'font': ['ttf', 'ttc', 'otf', 'dfont'],
        'gsplat': ['ply', 'sog'],
        'wasm': ['wasm']
    };

    const extToType = {};
    for (const type in typeToExt) {
        for (let i = 0; i < typeToExt[type].length; i++) {
            extToType[typeToExt[type][i]] = type;
        }
    }

    // returns true if the filename is recognized as a scene file and false otherwise
    editor.method('assets:isSceneFilename', (filename) => {
        for (let i = 0; i < typeToExt.scene.length; ++i) {
            if (filename.match(new RegExp(`.${typeToExt.scene[i]}$`, 'i'))) {
                return true;
            }
        }
        return false;
    });

    editor.method('assets:canUploadFiles', (files) => {
        // check usage first
        let totalSize = 0;
        for (let i = 0; i < files.length; i++) {
            totalSize += files[i].size;
        }

        return config.owner.size + totalSize <= config.owner.diskAllowance;
    });

    // returns the pipeline options for assets
    const pipelineOptions = () => {
        return {
            pow2: projectUserSettings.get('editor.pipeline.texturePot'),
            searchRelatedAssets: projectUserSettings.get('editor.pipeline.searchRelatedAssets'),
            overwriteModel: projectUserSettings.get('editor.pipeline.overwriteModel'),
            overwriteAnimation: projectUserSettings.get('editor.pipeline.overwriteAnimation'),
            overwriteMaterial: projectUserSettings.get('editor.pipeline.overwriteMaterial'),
            overwriteTexture: projectUserSettings.get('editor.pipeline.overwriteTexture'),
            preserveMapping: projectUserSettings.get('editor.pipeline.preserveMapping'),
            useGlb: projectUserSettings.get('editor.pipeline.useGlb'),
            animSampleRate: projectUserSettings.get('editor.pipeline.animSampleRate'),
            animCurveTolerance: projectUserSettings.get('editor.pipeline.animCurveTolerance'),
            animEnableCubic: projectUserSettings.get('editor.pipeline.animEnableCubic'),
            animUseFbxFilename: projectUserSettings.get('editor.pipeline.animUseFbxFilename'),
            useContainers: projectUserSettings.get('editor.pipeline.useContainers'),
            meshCompression: projectUserSettings.get('editor.pipeline.meshCompression'),
            unwrapUv: projectUserSettings.get('editor.pipeline.unwrapUv'),
            unwrapUvTexelsPerMeter: projectUserSettings.get('editor.pipeline.unwrapUvTexelsPerMeter'),
            importMorphNormals: projectUserSettings.get('editor.pipeline.importMorphNormals'),
            useUniqueIndices: projectUserSettings.get('editor.pipeline.useUniqueIndices')
        };
    };

    editor.method('assets:uploadFile', (args, fn) => {
        let request;
        if (args.asset) {
            const assetId = args.asset.get('id');
            request = editor.api.globals.rest.assets.assetUpdate(assetId, args, pipelineOptions());
        } else {
            // default preload scripts to true
            args.preloadDefault = args.type === 'script' ? true : projectUserSettings.get('editor.pipeline.defaultAssetPreload');
            request = editor.api.globals.rest.assets.assetCreate(args, pipelineOptions());
        }

        const job = ++uploadJobs;
        editor.call('status:job', `asset-upload:${job}`, 0);

        request
        .on('load', (status, data) => {
            editor.call('status:job', `asset-upload:${job}`);
            if (fn) {
                fn(null, data);
            }
        })
        .on('progress', (progress) => {
            editor.call('status:job', `asset-upload:${job}`, progress);
        })
        .on('error', (status, data) => {
            if (/Disk allowance/.test(data)) {
                data += '. <a href="/upgrade" target="_blank">UPGRADE</a> to get more disk space.';
            }

            editor.call('status:error', data);
            editor.call('status:job', `asset-upload:${job}`);
            if (fn) {
                fn(data);
            }
        });
    });

    function getPathFromFolder(folder: { get: (path: string) => number[] | string } | null) {
        let path = [];
        if (folder && folder.get) {
            path = folder.get('path').concat(parseInt(folder.get('id'), 10));
        }
        return path;
    }

    function createFolder(currentFolder: { get: (path: string) => unknown } | null, name: string, callback: (folder: unknown) => void) {
        editor.call('assets:create', {
            name: name,
            type: 'folder',
            source: true,
            preload: false,
            data: null,
            parent: currentFolder,
            scope: {
                type: 'project',
                id: config.project.id
            }
        }, (err, assetId) => {
            if (err) {
                return;
            }
            let currentFolder;
            var interval = setInterval(() => {
                const asset = editor.api.globals.assets.get(assetId);
                if (asset) {
                    currentFolder = asset.observer;
                    clearInterval(interval);
                    callback(currentFolder);
                }
            }, 200);
        });
    }

    function uploadFile(currentFolder: { get: (path: string) => unknown } | null, file: File, multipleFiles: boolean) {
        const path = getPathFromFolder(currentFolder);

        let ext = file.name.split('.');
        if (ext.length === 1) {
            return;
        }

        ext = ext[ext.length - 1].toLowerCase();

        if (legacyScripts && typeToExt.script.includes(ext)) {
            editor.call('status:error', 'Cannot upload scripts in this project because it uses a deprecated scripting system that is now read-only.');
            return;
        }

        if (file.size === 0) {
            editor.call('status:error', `Cannot upload empty file '${file.name}'.`);
            return;
        }

        let type = extToType[ext] || 'binary';

        const source = type !== 'binary' && !targetExtensions[ext];

        // check if we need to convert textures to texture atlases
        if (type === 'texture' && projectUserSettings.get('editor.pipeline.textureDefaultToAtlas')) {
            type = 'textureatlas';
        }

        // can we overwrite another asset?
        let sourceAsset = null;
        const fileNameLowerCase = file.name.toLowerCase();
        const candidates = editor.call('assets:find', (item) => {
            // check to see if the file to upload is already in one of the folders in the current directory
            if (item.get('type') === 'scene' && item.get('source') === source && item.get('name').toLowerCase() === fileNameLowerCase) {
                const itemPath = item.get('path');
                const parentId = itemPath[itemPath.length - 1];
                if (parentId) {
                    const itemParent = editor.api.globals.assets.get(parentId);
                    // the file's parent folder must be named the same as the uploaded file and be in the current directory
                    if (JSON.stringify(itemParent.get('path')) === JSON.stringify(path) && itemParent.get('name').toLowerCase() === fileNameLowerCase) {
                        return true;
                    }
                }
            }
            // check files in current folder only
            if (!item.get('path').equals(path)) {
                return false;
            }

            // try locate source when dropping on its targets
            if (source && !item.get('source') && item.get('source_asset_id')) {
                const itemSource = editor.call('assets:get', item.get('source_asset_id'));
                if (itemSource && itemSource.get('type') === type && itemSource.get('name').toLowerCase() === fileNameLowerCase) {
                    sourceAsset = itemSource;
                    return false;
                }
            }


            if (item.get('source') === source && item.get('name').toLowerCase() === fileNameLowerCase) {
                // we want the same type or try to replace a texture atlas with the same name if one exists
                if (item.get('type') === type || (type === 'texture' && item.get('type') === 'textureatlas')) {
                    return true;
                }
            }

            return false;
        });

        // candidates contains [index, asset] entries. Each entry
        // represents an asset that could be overwritten by the uploaded asset.
        // Use the first candidate by default (or undefined if the array is empty).
        // If we are uploading a texture try to find a textureatlas candidate and
        // if one exists then overwrite the textureatlas instead.
        let asset = candidates[0];
        if (type === 'texture') {
            for (let j = 0; j < candidates.length; j++) {
                if (candidates[j][1].get('type') === 'textureatlas') {
                    asset = candidates[j];
                    type = 'textureatlas';
                    break;
                }
            }
        }

        let data = null;
        if (typeToExt.script.includes(ext)) {
            data = {
                order: 100,
                scripts: {}
            };
        }

        const uploadToFolder = (folder) => {
            editor.call('assets:uploadFile', {
                asset: asset ? asset[1] : sourceAsset,
                file: file,
                type: type,
                name: file.name,
                parent: folder,
                pipeline: true,
                data: data,
                meta: asset ? asset[1].get('meta') : null
            }, (err, data) => {
                const isJavascript = ext === 'js' || ext === 'mjs';
                if (err || !isJavascript) {
                    return;
                }

                const onceAssetLoad = function (asset: { get: (path: string) => string | undefined; once: (event: string, fn: () => void) => void }) {
                    const url = asset.get('file.url');
                    if (url) {
                        editor.call('scripts:parse', asset);
                    } else {
                        asset.once('file.url:set', () => {
                            editor.call('scripts:parse', asset);
                        });
                    }
                };

                const asset = editor.call('assets:get', data.id);
                if (asset) {
                    onceAssetLoad(asset);
                } else {
                    editor.once(`assets:add[${data.id}]`, onceAssetLoad);
                }
            });
        };

        const settings = editor.call('settings:projectUser');
        // if we're not replacing a current file, the file is of type FBX and the user has the createFBXFolder option enabled,
        // we should create a folder for the contents of the FBX
        if (!asset && editor.call('assets:isSceneFilename', file.name) && settings.get('editor.pipeline.createFBXFolder')) {
            createFolder(currentFolder, file.name, (folder) => {
                if (!multipleFiles) {
                    currentFolder = editor.call('assets:panel:currentFolder', folder);
                }
                uploadToFolder(folder);
            });
        } else {
            uploadToFolder(currentFolder);
        }
    }

    editor.method('assets:upload:files', (files) => {
        if (!editor.call('assets:canUploadFiles', files)) {
            const msg = 'Disk allowance exceeded. <a href="/upgrade" target="_blank">UPGRADE</a> to get more disk space.';
            editor.call('status:error', msg);
            return;
        }

        const currentFolder = editor.call('assets:panel:currentFolder');
        for (let i = 0; i < files.length; i++) {
            uploadFile(currentFolder, files[i], files.length > 1);
        }
    });

    editor.method('assets:upload:picker', (args = {}) => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.multiple = true;
        fileInput.style.display = 'none';
        editor.call('layout.assets').append(fileInput);

        const onChange = function () {
            editor.call('assets:upload:files', this.files);

            this.value = null;
            fileInput.removeEventListener('change', onChange);
        };

        fileInput.addEventListener('change', onChange, false);
        fileInput.click();

        fileInput.parentNode.removeChild(fileInput);
    });
});
