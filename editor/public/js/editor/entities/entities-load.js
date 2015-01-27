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
            var entity = new Observer(data.entities[key]);
            editor.call('entities:add', entity);

            p.progress = (++i / total) * .8 + .1;
        }

        console.log('entities loaded ' + (Date.now() - start));

        p.progress = 1;

        editor.emit('entities:load');
    });


    p.progress = .1;

    editor.call('attributes:clear');
});
