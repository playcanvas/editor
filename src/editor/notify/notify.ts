editor.once('load', () => {
    const TIMEOUT = 5000;
    const TIMEOUT_OVERLAP = 500;
    let last;
    const logo = 'https://playcanvas.com/static-assets/platform/images/logo/playcanvas-logo-360.jpg';

    editor.method('notify:state', () => {
        if (!window.Notification) {
            return null;
        }

        return Notification.permission;
    });

    editor.method('notify:permission', (fn) => {
        if (!window.Notification) {
            return;
        }

        if (Notification.permission !== 'denied') {
            Notification.requestPermission((permission) => {
                editor.emit('notify:permission', permission);
                if (fn) fn();
            });
        }
    });

    editor.method('notify', (args = {}) => {
        // no supported
        if (!window.Notification || !args.title || document.visibilityState === 'visible') {
            return;
        }

        let timeout;
        const queueClose = function (item) {
            setTimeout(() => {
                item.close();
            }, TIMEOUT_OVERLAP);
        };
        const notify = function () {
            if (last) {
                queueClose(last);
                last = null;
            }

            const notification = last = new Notification(args.title, {
                body: args.body,
                icon: args.icon || logo
            });

            timeout = setTimeout(() => {
                notification.close();
            }, args.timeout || TIMEOUT);

            notification.onclick = function (evt) {
                evt.preventDefault();
                notification.close();

                if (args.click) {
                    args.click(evt);
                }
            };

            notification.onclose = function (evt) {
                clearTimeout(timeout);
                timeout = null;

                if (last === notification) {
                    last = null;
                }
            };
        };

        if (Notification.permission === 'granted') {
            // allowed
            notify();
        } else if (Notification.permission !== 'denied') {
            // ask for permission
            editor.call('notify:permission', (permission) => {
                if (permission === 'granted') {
                    notify();
                }
            });
        } else {
            // no permission
        }
    });

    editor.method('notify:title', (title) => {
        document.title = title;
    });
});
