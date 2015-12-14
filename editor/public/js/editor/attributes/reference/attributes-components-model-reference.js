editor.once('load', function() {
    'use strict';

    var create = function(args) {
        var tooltip = editor.call('attributes:reference', args);

        editor.method('attributes:reference:model' + (args.name ? (':' + args.name) : '') + ':attach', function(target, element) {
            tooltip.attach({
                target: target,
                element: element || target.element
            });
        });
    };

    var fields = [
        {
            title: 'asset',
            subTitle: '{Number}',
            description: 'The model asset rendered by this model component. Only a single model can be rendered per model component.',
            url: 'http://developer.playcanvas.com/api/pc.ModelComponent.html#asset'
        }, {
            title: 'castShadows',
            subTitle: '{Boolean}',
            description: 'If enabled, the model rendered by this component will cast shadows onto other models in the scene.',
            url: 'http://developer.playcanvas.com/api/pc.ModelComponent.html#castShadows'
        }, {
            title: 'materialAsset',
            subTitle: '{Number}',
            description: 'The material that will be used to render the model (only applies to primitives)',
            url: 'http://developer.playcanvas.com/api/pc.ModelComponent.html#materialAsset'
        }, {
            title: 'receiveShadows',
            subTitle: '{Boolean}',
            description: 'If enabled, the model rendered by this component will receive shadows cast by other models in the scene.',
            url: 'http://developer.playcanvas.com/api/pc.ModelComponent.html#receiveShadows'
        }, {
            title: 'type',
            subTitle: '{String}',
            description: 'The type of the model to be rendered. Can be: asset, box, capsule, cone, cylinder, sphere.',
            url: 'http://developer.playcanvas.com/api/pc.ModelComponent.html#type'
        }
    ];

    // component reference
    create({
        title: 'pc.ModelComponent',
        subTitle: '{pc.Component}',
        description: 'Enables an Entity to render a model or a primitive shape. This Component attaches additional model geometry in to the scene graph below the Entity.',
        url: 'http://developer.playcanvas.com/api/pc.ModelComponent.html'
    });

    // fields reference
    for(var i = 0; i < fields.length; i++) {
        fields[i].name = fields[i].title;
        create(fields[i]);
    }
});
