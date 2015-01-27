editor.on('load', function() {
    var hierarchyOverlay = new ui.Panel();
    hierarchyOverlay.class.add('overlay');
    editor.call('layout.left').append(hierarchyOverlay);

    var p = new ui.Progress();
    p.on('progress:100', function() {
        hierarchyOverlay.hidden = true;
    });
    hierarchyOverlay.append(p);


    var loaded = function(doc) {
        p.progress = .5;

        var start = Date.now();

        var hierarchy = doc.snapshot.hierarchy;

        // list
        var total = Object.keys(hierarchy).length;
        var i = 0;
        for(var key in hierarchy) {
            var entity = new Observer(hierarchy[key]);
            entity.sync = doc.at([ 'hierarchy', key ]);

            editor.call('entities:add', entity);
            p.progress = (++i / total) * .5 + .5;
        }

        console.log('entities loaded ' + (Date.now() - start));

        editor.emit('entities:load');

        p.progress = 1;
    };

    editor.on('realtime:connecting', function() {
        p.progress = .3;
    });

    editor.on('realtime:loading', function() {
        p.progress = .5;
    });

    editor.on('realtime:load', function(doc) {
        loaded(doc);
    });


    p.progress = .1;

    editor.call('attributes:clear');
});
