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

    editor.method('notify:permission', (fn?: () => void) => {
        if (!window.Notification) {
            return;
        }

        if (Notification.permission !== 'denied') {
            Notification.requestPermission((permission: NotificationPermission) => {
                editor.emit('notify:permission', permission);
                if (fn) {
                    fn();
                }
            });
        }
    });

    editor.method('notify', (args: { title?: string; body?: string; icon?: string; timeout?: number; click?: (evt: Event) => void } = {}) => {
        // no supported
        if (!window.Notification || !args.title || document.visibilityState === 'visible') {
            return;
        }

        let timeout;
        const queueClose = function (item: Notification) {
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

            notification.onclick = function (evt: Event) {
                evt.preventDefault();
                notification.close();

                if (args.click) {
                    args.click(evt);
                }
            };

            notification.onclose = function (_evt: Event) {
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
            editor.call('notify:permission', (permission: NotificationPermission) => {
                if (permission === 'granted') {
                    notify();
                }
            });
        } else {
            // no permission
        }
    });

    editor.method('notify:title', (title: string) => {
        document.title = title;
    });
});
