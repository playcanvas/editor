var pc = {
    script: {
        attributes: [],
        name: "",

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

function onReadyStateChange (method, url, xhr, success, error) {
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
                //options.error(xhr.status, xhr, null);
                error(method, url, xhr);
                break;
            }
        }
    }
}

function onSuccess(method, url, xhr, success, error) {
    var type = xhr.getResponseHeader("Content-Type");
    if (type && (type.indexOf("application/javascript") >= 0 || type.indexOf("application/x-javascript") >= 0)) {
        try {
            var fn = new Function(xhr.responseText);
            fn();
            success();
        } catch (e) {
            error(e);
        }
    } else {
        error('Invalid type ' + type);
    }
}

function request(method, url, success, error) {
    var xhr = new XMLHttpRequest();

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
    var data = event.data;

    if (data.url) {
        var url = new URL(data.url).search ? data.url + '&ts=' + new Date().getTime() : data.url + '?ts=' + new Date().getTime();
        request("GET", url, function () {
            //success
            postMessage({
                name: pc.script.name,
                values: pc.script.attributes
            });

            close();
        }, function (error) {
            //error
            postMessage({
                error: error.toString()
            });

            close();
        });
    }
};