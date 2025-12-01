import { Events } from '@playcanvas/observer';

import { globals as api } from './globals';

const SUCCESS_CODES = [
    200, // OK
    201, // Created
    202, // Accepted
    204  // No Content
];

type AjaxArgs = {
    // The URL to make the request to.
    url: string;

    // The HTTP method to use.
    method?: string;

    // Data to send with the request.
    data?: Record<string, any> | string;

    // Headers to send with the request.
    headers?: Record<string, string>;

    // Whether to send cookies with the request.
    cookies?: boolean;

    // Whether to ignore the Content-Type header.
    ignoreContentType?: boolean;

    // The MIME type of the data.
    mimeType?: string;

    // Whether to send the access token with the request.
    auth?: boolean;

    // Whether the response is not JSON.
    notJson?: boolean;
}

class Ajax<T> extends Events {
    private _xhr: XMLHttpRequest;

    private _progress: number;

    private _notJson: boolean;

    /**
     * @param args - Arguments for the request.
     * @returns The Ajax instance.
     */
    static get<T>(args: Omit<AjaxArgs, 'method'>) {
        return new Ajax<T>(Object.assign(args, { method: 'GET' }));
    }

    /**
     * @param args - Arguments for the request.
     * @returns The Ajax instance.
     */
    static post<T>(args: Omit<AjaxArgs, 'method'>) {
        return new Ajax<T>(Object.assign(args, { method: 'POST' }));
    }

    /**
     * @param args - Arguments for the request.
     * @returns The Ajax instance.
     */
    static put<T>(args: Omit<AjaxArgs, 'method'>) {
        return new Ajax<T>(Object.assign(args, { method: 'PUT' }));
    }

    /**
     * @param args - Arguments for the request.
     * @returns The Ajax instance.
     */
    static delete<T>(args: Omit<AjaxArgs, 'method'>) {
        return new Ajax<T>(Object.assign(args, { method: 'DELETE' }));
    }

    /**
     * @param args - Arguments for the request.
     */
    private constructor(args: AjaxArgs) {
        super();

        if (!args) {
            throw new Error('no arguments provided');
        }

        // progress
        this._progress = 0;
        this.emit('progress', this._progress);

        // xhr
        this._xhr = new XMLHttpRequest();

        // send cookies
        if (args.cookies) {
            this._xhr.withCredentials = true;
        }

        // events
        this._xhr.addEventListener('load', this._onLoad.bind(this), false);
        this._xhr.upload.addEventListener('progress', this._onProgress.bind(this), false);
        this._xhr.addEventListener('error', this._onError.bind(this), false);
        this._xhr.addEventListener('abort', this._onAbort.bind(this), false);

        // open request
        if (!args.url) {
            throw new Error('no url provided');
        }
        this._xhr.open(args.method || 'GET', args.url, true);

        this._notJson = args.notJson || false;

        // header for PUT/POST (don't add automatically if sending form [binary] data)
        if (!args.ignoreContentType && (args.method === 'PUT' || args.method === 'POST' || args.method === 'DELETE') && (args.mimeType !== 'multipart/form-data')) {
            this._xhr.setRequestHeader('Content-Type', 'application/json');
        }

        if (args.auth && api.accessToken) {
            this._xhr.setRequestHeader('Authorization', `Bearer ${api.accessToken}`);
        }

        if (args.headers) {
            for (const key in args.headers) {
                this._xhr.setRequestHeader(key, args.headers[key]);
            }
        }

        // stringify data if needed
        let body: FormData | string | null = null;
        if (args.data) {
            if (args.data instanceof FormData) {
                body = args.data;
            } else if (typeof (args.data) === 'string') {
                body = args.data;
            } else {
                body = JSON.stringify(args.data);
            }
        }

        // make request
        this._xhr.send(body);
    }

    /**
     * @param _evt - The load event.
     */
    private _onLoad(_evt: Event) {
        this._progress = 1;
        this.emit('progress', 1);

        if (SUCCESS_CODES.includes(this._xhr.status)) {
            if (this._notJson) {
                this.emit('load', this._xhr.status, this._xhr.responseText);
            } else {
                let json: T;
                try {
                    json = JSON.parse(this._xhr.responseText);
                } catch (ex) {
                    this.emit('error', this._xhr.status || 0, new Error('invalid json'));
                    return;
                }
                this.emit('load', this._xhr.status, json);
            }
        } else {
            try {
                const json = JSON.parse(this._xhr.responseText);
                let msg = json.message;
                if (!msg) {
                    msg = json.error || (json.response && json.response.error);
                }

                if (!msg) {
                    msg = this._xhr.responseText;
                }

                this.emit('error', this._xhr.status, msg);
            } catch (ex) {
                this.emit('error', this._xhr.status);
            }
        }
    }

    /**
     * @param evt - The error event.
     */
    private _onError(evt: Event) {
        this.emit('error', 0, evt);
    }

    /**
     * @param evt - The abort event.
     */
    private _onAbort(evt: Event) {
        this.emit('error', 0, evt);
    }

    /**
     * @param evt - The progress event.
     */
    private _onProgress(evt: ProgressEvent) {
        if (!evt.lengthComputable) {
            return;
        }

        const progress = evt.loaded / evt.total;

        if (progress !== this._progress) {
            this._progress = progress;
            this.emit('progress', this._progress);
        }
    }

    /**
     * @param onprogress - The progress callback.
     * @returns A promise that resolves with the response.
     */
    promisify(onprogress?: (progress: number) => void) {
        this.unbind('progress');
        if (onprogress) {
            this.on('progress', onprogress);
        }
        return new Promise<T>((resolve, reject) => {
            this.once('load', (_status, response: T) => {
                resolve(response);
            });
            this.once('error', (_status, error) => {
                reject(error);
            });
        });
    }

    abort() {
        this._xhr.abort();
    }
}

export { Ajax };
