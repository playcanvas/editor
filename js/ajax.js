function Ajax(args) {
    if (typeof (args) === 'string')
        args = { url: args };

    return new AjaxRequest(args);
}

window.Ajax = Ajax;

Ajax.get = function (url) {
    return new AjaxRequest({
        url: url
    });
};

Ajax.post = function (url, data) {
    return new AjaxRequest({
        method: 'POST',
        url: url,
        data: data
    });
};

Ajax.put = function (url, data) {
    return new AjaxRequest({
        method: 'PUT',
        url: url,
        data: data
    });
};

Ajax.delete = function (url) {
    return new AjaxRequest({
        method: 'DELETE',
        url: url
    });
};

Ajax.params = { };

Ajax.param = function (name, value) {
    Ajax.params[name] = value;
};


function AjaxRequest(args) {
    if (!args)
        throw new Error('no arguments provided');

    window.assignEvents(this);

    // progress
    this._progress = 0.0;
    this.emit('progress', this._progress);

    // xhr
    this._xhr = new XMLHttpRequest();

    // send cookies
    if (args.cookies)
        this._xhr.withCredentials = true;

    // events
    this._xhr.addEventListener('load', this._onLoad.bind(this), false);
    // this._xhr.addEventListener('progress', this._onProgress.bind(this), false);
    this._xhr.upload.addEventListener('progress', this._onProgress.bind(this), false);
    this._xhr.addEventListener('error', this._onError.bind(this), false);
    this._xhr.addEventListener('abort', this._onAbort.bind(this), false);

    // url
    var url = args.url;

    // query
    if (args.query && Object.keys(args.query).length) {
        if (url.indexOf('?') === -1) {
            url += '?';
        }

        var query = [];
        for (const key in args.query) {
            query.push(key + '=' + args.query[key]);
        }

        url += query.join('&');
    }

    // templating
    var parts = url.split('{{');
    if (parts.length > 1) {
        for (var i = 1; i < parts.length; i++) {
            var ends = parts[i].indexOf('}}');
            const key = parts[i].slice(0, ends);

            if (Ajax.params[key] === undefined)
                continue;

            // replace
            parts[i] = Ajax.params[key] + parts[i].slice(ends + 2);
        }

        url = parts.join('');
    }

    // open request
    this._xhr.open(args.method || 'GET', url, true);

    this.notJson = args.notJson || false;

    // header for PUT/POST (don't add automatically if sending form [binary] data)
    if (!args.ignoreContentType && (args.method === 'PUT' || args.method === 'POST' || args.method === 'DELETE') && (args.mimeType !== 'multipart/form-data'))
        this._xhr.setRequestHeader('Content-Type', 'application/json');

    if (args.auth && config.accessToken) {
        this._xhr.setRequestHeader('Authorization', 'Bearer ' + config.accessToken);
    }

    if (args.headers) {
        for (var key in args.headers)
            this._xhr.setRequestHeader(key, args.headers[key]);
    }

    // stringify data if needed
    if (args.data && typeof (args.data) !== 'string' && !(args.data instanceof FormData)) {
        args.data = JSON.stringify(args.data);
    }

    // make request
    this._xhr.send(args.data || null);
}
AjaxRequest.prototype = Object.create(Events.prototype);


AjaxRequest.prototype._onLoad = function () {
    this._progress = 1.0;
    this.emit('progress', 1.0);

    if (this._xhr.status === 200 || this._xhr.status === 201) {
        if (this.notJson) {
            this.emit('load', this._xhr.status, this._xhr.responseText);
        } else {
            let json;
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
            var json = JSON.parse(this._xhr.responseText);
            var msg = json.message;
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
};


AjaxRequest.prototype._onError = function (evt) {
    this.emit('error', 0, evt);
};


AjaxRequest.prototype._onAbort = function (evt) {
    this.emit('error', 0, evt);
};


AjaxRequest.prototype._onProgress = function (evt) {
    if (!evt.lengthComputable)
        return;

    var progress = evt.loaded / evt.total;

    if (progress !== this._progress) {
        this._progress = progress;
        this.emit('progress', this._progress);
    }
};


AjaxRequest.prototype.abort = function () {
    this._xhr.abort();
};
