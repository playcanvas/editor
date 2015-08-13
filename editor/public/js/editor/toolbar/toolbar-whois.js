editor.once('load', function() {
    'use strict';

    var root = editor.call('layout.root');
    var viewport = editor.call('layout.viewport');

    var panel = new ui.Panel();
    panel.class.add('whoisonline');
    viewport.append(panel);


    editor.on('whoisonline:add', function (id) {
        for(var i = 0; i < panel.innerElement.childNodes.length; i++) {
            var child = panel.innerElement.childNodes[i];
            if (child.userId === id)
                return;
        }

        var link = document.createElement('a');
        link.userId = id;
        link.href = '/' + id;
        link.target = "_blank";
        panel.prepend(link);

        var img = document.createElement('img');
        img.src = '/api/' + id + '/thumbnail?size=32';
        link.appendChild(img);

        link.tooltip = Tooltip.attach({
            target: link,
            text: '',
            align: 'bottom',
            root: root
        });

        editor.call('users:loadOne', id, function (user) {
            link.href = '/' + user.username;
            link.tooltip.text = user.username;
        });

        reflow();
    });


    editor.on('whoisonline:remove', function (id, index) {
        for(var i = 0; i < panel.innerElement.childNodes.length; i++) {
            var child = panel.innerElement.childNodes[i];
            if (child.userId === id) {
                if (child.tooltip)
                    child.tooltip.destroy();
                panel.innerElement.removeChild(child);
                reflow()
                return;
            }
        }
    });


    editor.method('whoisonline:panel', function() {
        return panel;
    });

    // offset whoisonline if assets panel header overlaps
    var canvas = null;
    var panelAssets =  editor.call('layout.assets');

    var reflow = function() {
        if (! canvas)
            return;

        if ((8 + panelAssets.headerElement.clientWidth + panel.element.clientWidth) > canvas.width) {
            panel.class.add('offset');
        } else {
            panel.class.remove('offset');
        }
    };

    setTimeout(function() {
        canvas = editor.call('viewport:canvas');
        canvas.on('resize', reflow);
    });
});
