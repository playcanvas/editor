editor.once('load', function () {
    'use strict';

    var fields = [{
        name: 'component',
        title: 'pc.CameraComponent',
        subTitle: '{pc.Component}',
        description: 'Enables an entity to render a scene from a certain viewpoint.',
        url: 'http://developer.playcanvas.com/api/pc.CameraComponent.html'
    }, {
        title: 'clearColor',
        subTitle: '{pc.Color}',
        description: 'The color used to clear the camera\'s render target.',
        url: 'http://developer.playcanvas.com/api/pc.CameraComponent.html#clearColor'
    }, {
        title: 'clearColorBuffer',
        subTitle: '{Boolean}',
        description: 'If selected, the camera will request the scene to generate a texture containing the scene color map.',
        url: 'http://developer.playcanvas.com/api/pc.CameraComponent.html#clearColorBuffer'
    }, {
        title: 'clearDepthBuffer',
        subTitle: '{Boolean}',
        description: 'If selected, the camera will request the scene to generate a texture containing the scene depth map.',
        url: 'http://developer.playcanvas.com/api/pc.CameraComponent.html#clearDepthBuffer'
    }, {
        title: 'renderSceneDepthMap',
        subTitle: '{Boolean}',
        description: 'If selected, the camera will explicitly clear its render target to the chosen clear color before rendering the scene.',
        url: 'http://developer.playcanvas.com/api/pc.CameraComponent.html#requestSceneDepthMap'
    }, {
        title: 'renderSceneColorMap',
        subTitle: '{Boolean}',
        description: 'If selected, the camera will explicitly clear the depth buffer of its render target before rendering the scene.',
        url: 'http://developer.playcanvas.com/api/pc.CameraComponent.html#requestSceneColorMap'
    }, {
        name: 'clip',
        title: 'nearClip / farClip',
        subTitle: '{Number}',
        description: 'The distance in camera space from the camera\'s eye point to the near and far clip planes.',
        url: 'http://developer.playcanvas.com/api/pc.CameraComponent.html#farClip'
    }, {
        title: 'nearClip',
        subTitle: '{Number}',
        description: 'The distance in camera space from the camera\'s eye point to the near plane.',
        url: 'http://developer.playcanvas.com/api/pc.CameraComponent.html#nearClip'
    }, {
        title: 'farClip',
        subTitle: '{Number}',
        description: 'The distance in camera space from the camera\'s eye point to the far plane.',
        url: 'http://developer.playcanvas.com/api/pc.CameraComponent.html#farClip'
    }, {
        title: 'fov',
        subTitle: '{Number}',
        description: 'Field of View is the angle between top and bottom clip planes of a perspective camera.',
        url: 'http://developer.playcanvas.com/api/pc.CameraComponent.html#fov'
    }, {
        title: 'frustumCulling',
        subTitle: '{Boolean}',
        description: 'Controls the culling of mesh instances against the camera frustum. If true, culling is enabled. If false, all mesh instances in the scene are rendered by the camera, regardless of visibility. Defaults to false.',
        url: 'http://developer.playcanvas.com/api/pc.CameraComponent.html#frustumCulling'
    }, {
        title: 'orthoHeight',
        subTitle: '{Number}',
        description: 'The distance in world units between the top and bottom clip planes of an orthographic camera.',
        url: 'http://developer.playcanvas.com/api/pc.CameraComponent.html#orthoHeight'
    }, {
        title: 'priority',
        subTitle: '{Number}',
        description: 'A number that defines the order in which camera views are rendered by the engine. Smaller numbers are rendered first.',
        url: 'http://developer.playcanvas.com/api/pc.CameraComponent.html#priority'
    }, {
        title: 'projection',
        subTitle: '{pc.PROJECTION_*}',
        description: 'The projection type of the camera.',
        url: 'http://developer.playcanvas.com/api/pc.CameraComponent.html#projection'
    }, {
        title: 'rect',
        subTitle: '{pc.Vec4}',
        description: 'A rectangle that specifies the viewport onto the camera\'s attached render target. This allows you to implement features like split-screen or picture-in-picture. It is defined by normalized coordinates (0 to 1) in the following format: x: The lower left x coordinate y: The lower left y coordinate w: The width of the rectangle h: The height of the rectangle',
        url: 'http://developer.playcanvas.com/api/pc.CameraComponent.html#rect'
    }, {
        name: 'layers',
        title: 'layers',
        subTitle: '{Number[]}',
        description: 'The layers that this camera will render.',
        url: 'http://developer.playcanvas.com/api/pc.CameraComponent.html#layers'
    }];

    for (let i = 0; i < fields.length; i++) {
        fields[i].name = 'camera:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
