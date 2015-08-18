app.once('load', function() {
    'use strict';

    // console
    var panel = document.createElement('div');
    panel.id = 'application-console';
    panel.classList.add('hidden');
    document.body.appendChild(panel);

    // close button img
    var closeBtn = document.createElement('img');
    closeBtn.src = 'http://s3-eu-west-1.amazonaws.com/static.playcanvas.com/images/icons/fa/16x16/remove.png';
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
        panel.appendChild(element);

        panel.classList.remove('hidden');
        return element;
    }

    // catch errors and show them to the console
    window.onerror = function (msg, url, line, col, e) {
        if (url) {
            // check if this is a playcanvas script
            var codeEditorUrl = null;
            var target = null;
            var parts = url.split('//')[1].split('/');
            if (parts.length > 9) {
                // if this is a playcanvas script
                // then create a URL that will open the code editor
                // at that line and column
                if (url.indexOf("api/files/code") >= 0) {
                    target = '/editor/code/' + parts[4] + '/' + parts.slice(9).join('/');
                    codeEditorUrl = target + '?line=' + line + '&col=' + col;
                }
            } else {
                codeEditorUrl = url;
            }

            var slash = url.lastIndexOf('/');
            var relativeUrl = url.slice(slash + 1);

            append(pc.string.format('<a href="{0}" target="{1}">[{2}:{3}]</a>: {4}', codeEditorUrl, target, relativeUrl, line, msg), 'error');

            // append stacktrace as well
            if (e && e.stack) {
                append(e.stack.replace(/ /g, '&nbsp;'), 'trace');
            }

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

    // redirect console.error to the in-game console
    var consoleError = console.error;
    console.error = function (msg) {
        consoleError.call(this, msg);
        if (typeof(msg) === 'string')
            append(msg, 'error');
        else
            append(msg.message, 'error');
    };

});
