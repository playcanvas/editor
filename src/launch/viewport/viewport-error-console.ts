editor.once('load', () => {
    // console
    const panel = document.createElement('div');
    panel.id = 'application-console';
    panel.classList.add('hidden');
    document.body.appendChild(panel);

    let errorCount = 0;

    panel.addEventListener('mousedown', (evt) => {
        evt.stopPropagation();
    }, false);
    panel.addEventListener('click', (evt) => {
        evt.stopPropagation();
    }, false);

    // close button img
    const closeBtn = document.createElement('img');
    closeBtn.src = 'https://playcanvas.com/static-assets/images/icons/fa/16x16/remove.png';
    panel.appendChild(closeBtn);

    closeBtn.addEventListener('click', () => {
        let i = panel.childNodes.length;
        while (i-- > 1) {
            panel.childNodes[i].parentElement.removeChild(panel.childNodes[i]);
        }

        panel.classList.add('hidden');
    });

    let logTimestamp = null;
    let stopLogs = false;

    // open the code editor external editor
    const idePromise = new Promise((resolve) => {
        editor.on('settings:projectUser:load', (data) => {
            resolve(data.editor.codeEditor);
        });
    });

    const append = function (msg, cls) {
        if (stopLogs) {
            return;
        }

        // prevent too many log messages
        if (panel.childNodes.length <= 1) {
            logTimestamp = Date.now();
        } else if (panel.childNodes.length > 60) {
            if (Date.now() - logTimestamp < 2000) {
                stopLogs = true;
                msg = 'Too many logs. Open the browser console to see more details.';
            }
        }

        // create new DOM element with the specified inner HTML
        const element = document.createElement('p');
        element.innerHTML = msg.replace(/\n/g, '<br/>');
        if (cls) {
            element.classList.add(cls);
        }

        // var links = element.querySelectorAll('.code-link');
        // for(var i = 0; i < links.length; i++) {
        //     links[i].addEventListener('click', function(evt) {
        //         evt.preventDefault();
        //         var scope = window;

        //         // TODO
        //         // possible only when launcher and editor are within same domain (HTTPS)
        //         // var scope = window.opener || window;

        //         scope.open(this.getAttribute('href') + this.getAttribute('query'), this.getAttribute('href')).focus();
        //     }, false);
        // }

        panel.appendChild(element);

        panel.classList.remove('hidden');
        return element;
    };

    const onError = async function (msg, url, line, col, e) {
        const ide = await idePromise;
        if (url) {
            // check if this is a playcanvas script
            let codeEditorUrl = '';
            let query = '';
            let target = null;
            let assetId = null;

            // if this is a playcanvas script
            // then create a URL that will open the code editor
            // at that line and column
            if (url.indexOf('api/files/code') !== -1) {
                const parts = url.split('//')[1].split('/');

                target = `/editor/code/${parts[4]}/`;
                if (parts.length > 9) {
                    target += parts.slice(9).join('/');
                } else {
                    target += parts.slice(6).join('/');
                }

                codeEditorUrl = config.url.home + target;
                query = `?line=${line}&col=${col}&error=true`;
            } else if (!editor.call('settings:project').get('useLegacyScripts') && url.includes('/api/assets/') && (url.includes('.js') || url.includes('.mjs'))) {
                const match = url.match(/\/api\/assets\/files\/.+?id=(\d+)/);
                if (match) {
                    assetId = parseInt(match[1], 10);
                    switch (ide) {
                        case 'vscode':
                        case 'cursor': {
                            const asset = editor.call('assets:get', assetId);
                            const projectName = `${config.project.name} (${config.project.id})`;
                            const filePath = editor.call('assets:virtualPath', asset, true);
                            target = `${ide}:${config.project.id}`;
                            codeEditorUrl = `${ide}://playcanvas.playcanvas/${projectName}${filePath}`;
                            query = `?line=${line}&col=${col}&error=true`;
                            break;
                        }
                        default: {
                            target = `codeeditor:${config.project.id}`;
                            codeEditorUrl = `${config.url.home}/editor/code/${config.project.id}`;
                            query = `?tabs=${assetId}&line=${line}&col=${col}&error=true`;
                            break;
                        }
                    }
                } else {
                    codeEditorUrl = url;
                }
            } else {
                codeEditorUrl = url;
            }

            const slash = url.lastIndexOf('/');
            const relativeUrl = url.slice(slash + 1);
            errorCount++;

            append(pc.string.format('<a href="{0}{1}" target="{2} class="code-link" id="{6}">[{3}:{4}]</a>: {5}', codeEditorUrl, query, target, relativeUrl, line, msg, `error-${errorCount}`), 'error');

            if (assetId) {
                const link = document.getElementById(`error-${errorCount}`);
                link.addEventListener('click', (e) => {
                    // if the IDE is vscode or cursor, open the code editor in a new tab
                    switch (ide) {
                        case 'vscode':
                        case 'cursor': {
                            window.open(codeEditorUrl + query, target);
                            return;
                        }
                    }

                    // handle default case
                    const existing = window.open('', target);
                    try {
                        if (existing) {
                            e.preventDefault();
                            e.stopPropagation();

                            if (existing.editor && existing.editor.isCodeEditor) {
                                existing.editor.call('integration:selectWhenReady', assetId, {
                                    line: line,
                                    col: col,
                                    error: true
                                });
                            } else {
                                existing.location.href = codeEditorUrl + query;
                            }
                        }
                    } catch (ex) {
                        // if we try to access 'existing' and it's in a different
                        // domain an exception will be raised
                        window.open(codeEditorUrl + query, target);
                    }
                });
            }

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

    // catch errors and show them to the console
    window.onerror = onError;

    // redirect console.error to the in-game console
    const consoleError = console.error;
    console.error = function (...args) {
        let errorPassed = false;
        consoleError(...args);

        args.forEach((item) => {
            if (item instanceof Error && item.stack) {
                const msg = item.message;
                const lines = item.stack.split('\n');
                if (lines.length >= 2) {
                    const line = lines[1];
                    let url = line.slice(line.indexOf('(') + 1);
                    const m = url.match(/:\d+:\d+\)/);
                    if (m) {
                        url = url.slice(0, m.index);
                        const parts = m[0].slice(1, -1).split(':');

                        if (parts.length === 2) {
                            const lineNumber = parseInt(parts[0], 10);
                            const colNumber = parseInt(parts[1], 10);

                            onError(msg, url, lineNumber, colNumber, item);
                            errorPassed = true;
                        }
                    }
                }
            }

            if (item instanceof Error) {
                if (!errorPassed) {
                    append(item.message, 'error');
                }
            } else {
                append(item.toString(), 'error');
            }
        });
    };

});
