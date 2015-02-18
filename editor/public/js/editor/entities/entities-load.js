editor.on('load', function() {
    var hierarchyOverlay = new ui.Panel();
    hierarchyOverlay.class.add('overlay');
    editor.call('layout.left').append(hierarchyOverlay);

    var p = new ui.Progress();
    p.on('progress:100', function() {
        hierarchyOverlay.hidden = true;
    });
    hierarchyOverlay.append(p);


    editor.on('scene:raw', function(data) {
        var start = Date.now();

        var total = Object.keys(data.entities).length;
        var i = 0;

        // list
        for(var key in data.entities) {
            // components.script.scripts > ObserverList
            // if (data.entities[key].components.script && data.entities[key].components.script.scripts.length === 0)
            //     data.entities[key].components.script.scripts = ObserverList

            editor.call('entities:add', new Observer(data.entities[key]));

            p.progress = (++i / total) * .8 + .1;
        }

        p.progress = 1;

        editor.emit('entities:load');
    });


    p.progress = .1;

    editor.call('attributes:clear');
});
