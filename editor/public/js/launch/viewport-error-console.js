app.once('load', function() {
    'use strict';

    // console
    var panel = document.createElement('div');
    panel.id = 'application-console';
    panel.classList.add('hidden');
    document.body.appendChild(panel);

    // close button img
    var closeBtn = document.createElement('img');
    closeBtn.src = 'https://s3-eu-west-1.amazonaws.com/static.playcanvas.com/images/icons/fa/16x16/remove.png';
    panel.appendChild(closeBtn);

    closeBtn.addEventListener('click', function () {
        var i = panel.childNodes.length;
        while (i-- > 1) {
            panel.childNodes[i].parentElement.removeChild(panel.childNodes[i]);
        }

        panel.classList.add('hidden');
    });

    var logTimestamp = null;
    var stopLogs = false;

    var append = function (msg, cls) {
        if (stopLogs) return;

        // prevent too many log messages
        if (panel.childNodes.length <= 1) {
            logTimestamp = Date.now();
        } else if (panel.childNodes.length > 60) {
            if (Date.now() - logTimestamp < 2000) {
                stopLogs = true;
                msg = "Too many logs. Open the browser console to see more details.";
            }
        }

        // create new DOM element with the specified inner HTML
        var element = document.createElement('p');
        element.innerHTML = msg.replace(/\n/g, '<br/>');
        if (cls)
            element.classList.add(cls);

        var links = element.querySelectorAll('.code-link');
        for(var i = 0; i < links.length; i++) {
            links[i].addEventListener('click', function(evt) {
                evt.preventDefault();
                var scope = window;

                // TODO
                // possible only when launcher and editor are within same domain (HTTPS)
                // var scope = window.opener || window;

                scope.open(this.getAttribute('href') + this.getAttribute('query'), this.getAttribute('href')).focus();
            }, false);
        }

        panel.appendChild(element);

        panel.classList.remove('hidden');
        return element;
    }

    var onError = function(msg, url, line, col, e) {
        if (url) {
            // check if this is a playcanvas script
            var codeEditorUrl = '';
            var query = '';
            var target = null;

            // if this is a playcanvas script
            // then create a URL that will open the code editor
            // at that line and column
            if (url.indexOf('api/files/code') !== -1) {
                var parts = url.split('//')[1].split('/');

                target = '/editor/code/' + parts[4] + '/';
                if (parts.length > 9) {
                    target += parts.slice(9).join('/');
                } else {
                    target += parts.slice(6).join('/');
                }

                codeEditorUrl = 'https://' + window.location.host + target;
                query = '?line=' + line + '&col=' + col;
            } else if (! editor.call('project:settings').get('use_legacy_scripts') && url.indexOf('/api/assets/') !== -1 && url.indexOf('.js') !== -1) {
                var assetId = parseInt(url.match(/\/api\/assets\/files\/.+?id=([0-9]+)/)[1], 10);
                target = '/editor/asset/' + assetId;

                codeEditorUrl = 'https://' + window.location.host + target;
                query = '?line=' + line + '&col=' + col;
            } else {
                codeEditorUrl = url;
            }

            var slash = url.lastIndexOf('/');
            var relativeUrl = url.slice(slash + 1);

            append(pc.string.format('<a href="{0}" query="{1}" target="{2}" class="code-link">[{3}:{4}]</a>: {5}', codeEditorUrl, query, target, relativeUrl, line, msg), 'error');

            // append stacktrace as well
            if (e && e.stack)
                append(e.stack.replace(/ /g, '&nbsp;'), 'trace');
        } else {
            // Chrome only shows 'Script error.' if the error comes from
            // a different domain.
            if (msg && msg !== 'Script error.') {
                append(msg, 'error');
            } else {
                append('Error loading scripts. Open the browser console for details.', 'error');
            }
        }
    };

    // catch errors and show them to the console
    window.onerror = onError;

    // redirect console.error to the in-game console
    var consoleError = console.error;
    console.error = function(item) {
        var errorPassed = false;

        if (item instanceof Error) {
            consoleError.call(this, item.stack);

            var msg = item.message;
            var lines = item.stack.split('\n');
            if (lines.length >= 2) {
                var line = lines[1];
                var url = line.slice(line.indexOf('(') + 1);
                var m = url.match(/:[0-9]+:[0-9]+\)/);
                if (m) {
                    url = url.slice(0, m.index);
                    var parts = m[0].slice(1, -1).split(':');

                    if (parts.length === 2) {
                        var line = parseInt(parts[0], 10);
                        var col = parseInt(parts[1], 10);

                        onError(msg, url, line, col, item);
                        errorPassed = true;
                    }
                }
            }
        } else {
            consoleError.call(this, item);
        }

        if (item instanceof Error) {
            if (! errorPassed)
                append(item.message, 'error');
        } else {
            append(item.toString(), 'error');
        }
    };

});
