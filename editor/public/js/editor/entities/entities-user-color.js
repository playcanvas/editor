editor.once('load', function() {
    'use strict';

    var colors = { };
    var items = { };
    var pool = { };

    editor.on('selector:sync', function(user, data) {
        // deselect
        if (items[user] && items[user].length) {
            for(var i = 0; i < items[user].length; i++) {
                var element = items[user][i];
                element.parentNode.removeChild(element);
                pool[user].push(element);
            }

            items[user] = [ ];
        }

        if (data.type === 'entity') {
            // select
            if (! items[user]) {
                items[user] = [ ];
                pool[user] = [ ];
            }

            if (! colors[user])
                colors[user] = editor.call('whoisonline:color', user, 'hex');

            for(var i = 0; i < data.ids.length; i++) {
                var element = editor.call('entities:panel:get', data.ids[i]);
                if (! element)
                    continue;

                var point;

                if (pool[user].length) {
                    point = pool[user].pop();
                } else {
                    point = document.createElement('span');
                    point.style.backgroundColor = colors[user];
                }

                element.users.appendChild(point);
                items[user].push(point);
            }
        }
    });
});
