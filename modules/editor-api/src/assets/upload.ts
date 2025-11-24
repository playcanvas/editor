import { globals as api } from '../globals';

function getSetting(settings: any, name: string, defaultValue: any) {
    return settings && settings[name] !== undefined ? settings[name] : defaultValue;
}

function createFormData(data: any, settings: any) {
    const form = new FormData();

    form.append('branchId', api.branchId);
    if (data.folderId) {
        form.append('parent', data.folderId.toString());
    }

    if (data.filename) {
        form.append('filename', data.filename);
    }

    if (data.file && data.file.size) {
        form.append('file', data.file, data.filename || data.name);
    }

    if (data.type === 'texture' || data.type === 'textureatlas') {
        form.append('pow2', getSetting(settings, 'pow2', true));
        form.append('searchRelatedAssets', getSetting(settings, 'searchRelatedAssets', true));
    } else if (data.type === 'scene') {
        form.append('searchRelatedAssets', getSetting(settings, 'searchRelatedAssets', true));
        form.append('overwriteModel', getSetting(settings, 'overwriteModel', true));
        form.append('overwriteAnimation', getSetting(settings, 'overwriteAnimation', true));
        form.append('overwriteMaterial', getSetting(settings, 'overwriteMaterial', true));
        form.append('overwriteTexture', getSetting(settings, 'overwriteTexture', true));
        form.append('pow2', getSetting(settings, 'pow2', true));
        form.append('preserveMapping', getSetting(settings, 'preserveMapping', true));
        form.append('useGlb', getSetting(settings, 'useGlb', true));
        form.append('animSampleRate', getSetting(settings, 'animSampleRate', 10));
        form.append('animCurveTolerance', getSetting(settings, 'animCurveTolerance', 0));
        form.append('animEnableCubic', getSetting(settings, 'animEnableCubic', false));
        form.append('animUseFbxFilename', getSetting(settings, 'animUseFbxFilename', false));
    }

    return form;
}

function appendCreateFields(form: FormData, data: any) {
    form.append('projectId', api.projectId as unknown as string);
    form.append('type', data.type);

    if (data.name) {
        form.append('name', data.name);
    }

    // tags
    if (data.tags) {
        form.append('tags', data.tags.join('\n'));
    }

    // source_asset_id
    if (data.sourceAssetId) {
        form.append('source_asset_id', data.sourceAssetId);
    }

    // data
    if (data.data) {
        form.append('data', JSON.stringify(data.data));
    }

    // meta
    if (data.meta) {
        form.append('meta', JSON.stringify(data.meta));
    }

    form.append('preload', getSetting(data, 'preload', true));

    return form;
}

/**
 * Uploads an asset file in order to create a new asset
 * or update an existing asset.
 *
 * @param data - The data
 * @param settings - Import settings
 * @param onProgress - Progress function
 * @returns The JSON response from the server
 */
async function uploadFile(data: Record<string, any>, settings: object = null, onProgress: Function = null) {
    let method;
    let url;

    const form = createFormData(data, settings);
    if (data.id) {
        method = 'PUT';
        url = `/api/assets/${data.id}`;
    } else {
        appendCreateFields(form, data);
        method = 'POST';
        url = '/api/assets';
    }

    const response = await new Promise<XMLHttpRequest['response']>((resolve) => {
        let progress: any;

        function onProgressUpdate(value: number) {
            if (progress !== value) {
                progress = value;
                if (onProgress) {
                    onProgress(progress);
                }
            }
        }

        function onError(status: number, err: ProgressEvent<XMLHttpRequestEventTarget>) {
            resolve({
                ok: false,
                status: status,
                error: err
            });
        }

        const xhr = new XMLHttpRequest();
        xhr.withCredentials = true;
        xhr.addEventListener('load', () => {
            onProgressUpdate(1.0);

            if (xhr.status === 200 || xhr.status === 201) {
                resolve({
                    ok: true,
                    status: xhr.status,
                    json: JSON.parse(xhr.responseText)
                });
            } else {
                try {
                    const json = JSON.parse(xhr.responseText);
                    let msg = json.message;
                    if (!msg) {
                        msg = json.error || (json.response && json.response.error);
                    }

                    if (!msg) {
                        msg = xhr.responseText;
                    }

                    onError(xhr.status, msg);
                } catch (ex) {
                    onError(xhr.status, ex);
                }
            }
        });

        xhr.upload.addEventListener('progress', (evt) => {
            if (!evt.lengthComputable) return;

            onProgressUpdate(evt.loaded / evt.total);
        });

        xhr.addEventListener('error', (evt) => {
            onError(xhr.status, evt);
        });

        xhr.addEventListener('abort', (evt) => {
            onError(xhr.status, evt);
        });

        onProgressUpdate(0);

        xhr.open(method, url, true);
        xhr.send(form);
    });

    if (!response.ok) {
        throw new Error(`${response.status}${response.error ? `: ${response.error}` : ''}`);
    }

    return response.json;
}

export { uploadFile };
