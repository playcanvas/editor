editor.once('load', function() {
    'use strict';

    var root = editor.call('layout.root');
    var viewport = editor.call('layout.viewport');

    var panel = new ui.Panel();
    panel.class.add('whoisonline');
    viewport.append(panel);


    editor.on('whoisonline:add', function (id) {
        var link = document.createElement('a');
        link.href = '/' + id;
        link.target = "_blank";
        panel.append(link);

        var img = document.createElement('img');
        img.src = '/api/' + id + '/thumbnail?size=32';
        link.appendChild(img);

        editor.call('users:loadOne', id, function (user) {
            link.href = '/' + user.username;
            link.tooltip.text = user.username;
        });

        link.tooltip = Tooltip.attach({
            target: link,
            text: '',
            align: 'top',
            root: root
        });
    });


    editor.on('whoisonline:remove', function (id, index) {
        var element = panel.innerElement.childNodes[index];
        if (element) {
            element.parentElement.removeChild(element);
            if (element.tooltip)
                element.tooltip.destroy();
        }
    });


    editor.method('whoisonline:panel', function() {
        return panel;
    });
});
