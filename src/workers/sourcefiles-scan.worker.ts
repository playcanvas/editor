self.pc = {
    script: {
        attributes: [],
        name: '',

        // allows users to define attributes like so: pc.script.attribute(name, type, defaultValue [, options]);
        attribute: function (name, type, defaultValue, options) {
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
    extend: function (obj, other) {
        return obj;
    },

    inherits: function (obj, parent) {
        return obj;
    },

    posteffect: {
        PostEffect: function () {}
    }
};

function onReadyStateChange(method, url, xhr, success, error) {
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

function onSuccess(method, url, xhr, success, error) {
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

function request(method, url, success, error) {
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

onmessage = function (event) {
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
