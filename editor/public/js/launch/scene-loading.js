pc.editor = pc.editor || {};
pc.extend(pc.editor, function() {

    var loadScene = function (id, callback) {
        var connection = editor.call('realtime:connection');

        var scene = connection.get('scenes', '' + id);

        scene.on('ready', function () {
            var data = scene.getSnapshot();

            // convert to hierarchy data format
            var hierarchy = null;
            for (var id in data.entities) {
                if (!data.entities[id].parent) {
                    hierarchy = data.entities[id];
                }

                for (var i = 0; i < data.entities[id].children.length; i++) {
                    data.entities[id].children[i] = data.entities[data.entities[id].children[i]];
                }
            }

            // pass scene to callback
            callback({hierarchy: hierarchy});

            // destroy document
            scene.destroy();
        });

        // subscribe for realtime events
        scene.subscribe();
    };

    return {
        loadScene: loadScene
    };
}());