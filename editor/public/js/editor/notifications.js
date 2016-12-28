editor.once('load', function() {
    'use strict';

    var TIMEOUT = 5000;
    var TIMEOUT_OVERLAP = 500;
    var last;
    var logo = 'https://s3-eu-west-1.amazonaws.com/static.playcanvas.com/platform/images/logo/playcanvas-logo-360.jpg';
    var visible = ! document.hidden;

    document.addEventListener('visibilitychange', function() {
        if (visible === ! document.hidden)
            return;

        visible = ! document.hidden;
        if (visible) {
            editor.emit('visible');
        } else {
            editor.emit('hidden');
        }
        editor.emit('visibility', visible);
    }, false);

    editor.method('visibility', function() {
        return visible;
    });

    editor.method('notify:state', function() {
        if (! window.Notification)
            return null;

        return Notification.permission;
    });

    editor.method('notify:permission', function(fn) {
        if (! window.Notification)
            return;

        if (Notification.permission !== 'denied') {
            Notification.requestPermission(function(permission) {
                editor.emit('notify:permission', permission);
                if (fn) fn();
            });
        }
    });

    editor.method('notify', function(args) {
        // no supported
        if (! window.Notification || ! args.title || visible)
            return;

        args = args || { };

        var timeout;
        var queueClose = function(item) {
            setTimeout(function() {
                item.close();
            }, TIMEOUT_OVERLAP);
        };
        var notify = function() {
            if (last) {
                queueClose(last);
                last = null;
            }

            var notification = last = new Notification(args.title, {
                body: args.body,
                icon: args.icon || logo
            });

            timeout = setTimeout(function() {
                notification.close();
            }, args.timeout || TIMEOUT);

            notification.onclick = function(evt) {
                evt.preventDefault();
                notification.close();

                if (args.click)
                    args.click(evt);
            };

            notification.onclose = function(evt) {
                clearTimeout(timeout);
                timeout = null;

                if (last === notification)
                    last = null;
            };
        };

        if (Notification.permission === 'granted') {
            // allowed
            notify();
        } else if (Notification.permission !== 'denied') {
            // ask for permission
            editor.call('notify:permission', function(permission) {
                if (permission === 'granted')
                    notify();
            });
        } else {
            // no permission
        }
    });

    editor.method('notify:title', function(title) {
        document.title = title;
    });
});
