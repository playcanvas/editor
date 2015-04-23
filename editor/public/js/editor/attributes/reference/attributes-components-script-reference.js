editor.once('load', function() {
    'use strict';

    var create = function(args) {
        var tooltip = editor.call('attributes:reference', args);

        editor.method('attributes:reference:script' + (args.name ? (':' + args.name) : '') + ':attach', function(target, element) {
            tooltip.attach({
                target: target,
                element: element || target.element
            });
        });
    };

    var fields = [
        {
            title: 'scripts',
            subTitle: '{Object[]}',
            description: 'Add scripts by typing in the name of a new or existing URL.',
            url: 'http://developer.playcanvas.com/engine/api/stable/symbols/pc.ScriptComponent.html#scripts'
        }
    ];

    // component reference
    create({
        title: 'pc.ScriptComponent',
        subTitle: '{pc.Component}',
        description: 'The ScriptComponent allows you to extend the functionality of an Entity by attaching your own javascript files to be executed with access to the Entity. For more details on scripting see Scripting.',
        url: 'http://developer.playcanvas.com/engine/api/stable/symbols/pc.ScriptComponent.html'
    });

    // fields reference
    for(var i = 0; i < fields.length; i++) {
        fields[i].name = fields[i].title;
        create(fields[i]);
    }
});
