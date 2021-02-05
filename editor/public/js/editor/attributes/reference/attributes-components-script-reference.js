editor.once('load', function () {
    'use strict';

    var fields = [{
        name: 'component',
        title: 'pc.ScriptComponent',
        subTitle: '{pc.Component}',
        description: 'The ScriptComponent allows you to extend the functionality of an Entity by attaching your own javascript files to be executed with access to the Entity. For more details on scripting see Scripting.',
        url: 'http://developer.playcanvas.com/api/pc.ScriptComponent.html'
    }, {
        title: 'scripts',
        subTitle: '{Object[]}',
        description: 'Add scripts by clicking on the button or drag scripts on the script component.',
        url: 'http://developer.playcanvas.com/api/pc.ScriptComponent.html#scripts'
    }];

    for (var i = 0; i < fields.length; i++) {
        fields[i].name = 'script:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
