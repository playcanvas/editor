app.once('load', function() {
    'use strict';

    var sceneSettings = new Observer();

    app.once('scene:raw', function(data) {
        sceneSettings.patch(data.settings);
        // app.call('viewport')._linkUpdatePackSettings(sceneSettings.json());

        // set the global value of settings
        pc.content.packs[config.scene.id].settings = sceneSettings.json();

        app.emit("sceneSettings:load");
    });
});
