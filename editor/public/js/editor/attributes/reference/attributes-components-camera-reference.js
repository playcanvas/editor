editor.once('load', function() {
    'use strict';

    var create = function(args) {
        var tooltip = editor.call('attributes:reference', args);

        editor.method('attributes:reference:camera' + (args.name ? (':' + args.name) : '') + ':attach', function(target, element) {
            tooltip.attach({
                target: target,
                element: element || target.element
            });
        });
    };

    var fields = [
        {
            title: 'clearColor',
            subTitle: '{pc.Color}',
            description: 'The color used to clear the camera\'s render target.',
            url: 'http://developer.playcanvas.com/engine/api/stable/symbols/pc.CameraComponent.html#clearColor'
        }, {
            title: 'clearColorBuffer',
            subTitle: '{Boolean}',
            description: 'If selected, the camera will explicitly clear its render target to the chosen clear color before rendering the scene.',
            url: 'http://developer.playcanvas.com/engine/api/stable/symbols/pc.CameraComponent.html#clearColorBuffer'
        }, {
            title: 'clearDepthBuffer',
            subTitle: '{Boolean}',
            description: 'If selected, the camera will explicitly clear the depth buffer of its render target before rendering the scene.',
            url: 'http://developer.playcanvas.com/engine/api/stable/symbols/pc.CameraComponent.html#clearDepthBuffer'
        }, {
            title: 'clip',
            subTitle: '{Number}',
            description: 'The distance in camera space from the camera\'s eye point to the near and far clip planes.',
            url: 'http://developer.playcanvas.com/engine/api/stable/symbols/pc.CameraComponent.html#farClip'
        }, {
            title: 'fov',
            subTitle: '{Number}',
            description: 'Field of View is the angle between top and bottom clip planes of a perspective camera.',
            url: 'http://developer.playcanvas.com/engine/api/stable/symbols/pc.CameraComponent.html#fov'
        }, {
            title: 'orthoHeight',
            subTitle: '{Number}',
            description: 'The distance in world units between the top and bottom clip planes of an orthographic camera.',
            url: 'http://developer.playcanvas.com/engine/api/stable/symbols/pc.CameraComponent.html#orthoHeight'
        }, {
            title: 'priority',
            subTitle: '{Number}',
            description: 'A number that defines the order in which camera views are rendered by the engine. Smaller numbers are rendered first.',
            url: 'http://developer.playcanvas.com/engine/api/stable/symbols/pc.CameraComponent.html#priority'
        }, {
            title: 'projection',
            subTitle: '{pc.Projection}',
            description: 'The projection type of the camera.',
            url: 'http://developer.playcanvas.com/engine/api/stable/symbols/pc.CameraComponent.html#projection'
        }, {
            title: 'rect',
            subTitle: '{pc.Vec4}',
            description: 'A rectangle that specifies the viewport onto the camera\'s attached render target. This allows you to implement features like split-screen or picture-in-picture. It is defined by normalised coordinates (0 to 1) in the following format:<br />x: The lower left x coordinate<br />y: The lower left y coordinate<br />w: The width of the rectangle<br />h: The height of the rectangle',
            url: 'http://developer.playcanvas.com/engine/api/stable/symbols/pc.CameraComponent.html#rect'
        }
    ];

    // component reference
    create({
        title: 'pc.CameraComponent',
        subTitle: '{pc.Component}',
        description: 'Enables an entity to render a scene from a certain viewpoint.',
        url: 'http://developer.playcanvas.com/engine/api/stable/symbols/pc.CameraComponent.html'
    });

    // fields reference
    for(var i = 0; i < fields.length; i++) {
        fields[i].name = fields[i].title;
        create(fields[i]);
    }
});
