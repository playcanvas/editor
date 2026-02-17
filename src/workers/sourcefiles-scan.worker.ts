self.pc = {
    script: {
        attributes: [],
        name: '',

        // allows users to define attributes like so: pc.script.attribute(name, type, defaultValue [, options]);
        attribute: function (name: string, type: string, defaultValue: unknown, options?: Record<string, unknown>) {
            this.attributes.push({
                name: name,
                type: type,
                defaultValue: defaultValue,
                options: options
            });
        },

        create: function () {
            this.name = arguments[0];
        }
    },


    // mock methods that might appear outside of script definitions
    extend: function (obj: Record<string, unknown>, other: Record<string, unknown>) {
        return obj;
    },

    inherits: function (obj: Record<string, unknown>, parent: new (...args: unknown[]) => unknown) {
        return obj;
    },

    posteffect: {
        PostEffect: function () {}
    }
};

function onReadyStateChange(method: string, url: string, xhr: XMLHttpRequest, success: () => void, error: (methodOrErr: string | Error, url?: string, xhr?: XMLHttpRequest) => void) {
    if (xhr.readyState === 4) {
        switch (xhr.status) {
            case 0: {
                // Request didn't complete, possibly an exception or attempt to do cross-domain request
                break;
            }
            case 200:
            case 201:
            case 206:
            case 304: {
                onSuccess(method, url, xhr, success, error);
                break;
            }
            default: {
                // options.error(xhr.status, xhr, null);
                error(method, url, xhr);
                break;
            }
        }
    }
}

function onSuccess(method: string, url: string, xhr: XMLHttpRequest, success: () => void, error: (methodOrErr: string | Error, url?: string, xhr?: XMLHttpRequest) => void) {
    const type = xhr.getResponseHeader('Content-Type');
    if (type && (type.indexOf('application/javascript') >= 0 || type.indexOf('application/x-javascript') >= 0)) {
        try {
            const fn = new Function(xhr.responseText); // eslint-disable-line no-new-func
            fn();
            success();
        } catch (e) {
            error(e);
        }
    } else {
        error(`Invalid type ${type}`);
    }
}

function request(method: string, url: string, success: () => void, error: (methodOrErr: string | Error, url?: string, xhr?: XMLHttpRequest) => void) {
    const xhr = new XMLHttpRequest();

    xhr.open(method, url, false);

    xhr.onreadystatechange = function () {
        onReadyStateChange(method, url, xhr, success, error);
    };

    xhr.onerror = function () {
        error(method, url, xhr);
    };

    xhr.send();
}

onmessage = function (event: MessageEvent) {
    const data = event.data;

    if (data.url) {
        const url = data.url.indexOf('?') !== -1 ? `${data.url}&ts=${new Date().getTime()}` : `${data.url}?ts=${new Date().getTime()}`;
        request('GET', url, () => {
            // success
            postMessage({
                name: pc.script.name,
                values: pc.script.attributes
            });

            close();
        }, (error) => {
            // error
            postMessage({
                error: error.toString()
            });

            close();
        });
    }
};
