editor.once('load', function() {
    'use strict';

    var create = function(args) {
        var tooltip = editor.call('attributes:reference', args);

        editor.method('attributes:reference:settings' + (args.name ? (':' + args.name) : '') + ':attach', function(target, element) {
            tooltip.attach({
                target: target,
                element: element || target.element
            });
        });
    };

    var fields = [
        {
            title: 'name',
            subTitle: '{String}',
            description: 'Name of the Scene for better navigation across content.'
        }, {
            name: 'designer',
            description: 'Designer Settings are applied per user basis and only visible to you, and not team collaborators. Although rest of other sections are shared for the Scene for all collaborators.'
        }, {
            name: 'snap',
            description: 'Change increment value for Snap gizmo state. Use SHIFT or Snap Toggle on toolbar to enable Snapping during use of Gizmos.'
        }, {
            name: 'grid',
            description: 'To disable grid set Divisions to 0. Divisions specify number of grid rectangles in each horizontal direction. And Size specifies the size of a rectangles.'
        }, {
            name: 'cameraClip',
            description: 'If your scene is too large or objects needs to be too close, change Near/Far clip values of a camera for Editor. This setting does not affects the game.'
        }, {
            name: 'clearColor',
            description: 'Set the Camera Clear Color of your preference to affect Editor. This color will not affect the game.'
        }, {
            name: 'localServer',
            description: 'Set a URL to use as the local server. When you click on "Launch Local" all your scripts will be loaded from this URL.'
        }, {
            title: 'gravity',
            subTitle: '{pc.Vec3}',
            description: 'Gravity is the acceleration applied every frame to all rigid bodies in your scene. By default, it is set to -9.8 meters per second per second, which essentially approximates Earth\'s gravity. If you are making a game in space, you might want to set this to 0, 0, 0 (zero g).',
            url: 'http://developer.playcanvas.com/engine/api/stable/symbols/pc.RigidBodyComponentSystem.html#setGravity'
        }, {
            title: 'ambientColor',
            subTitle: '{pc.Color}',
            description: 'The color of the scene\'s ambient light source. PlayCanvas allows you to create directional, point and spot lights. These lights account for direct light that falls on objects. But in reality, light actually bounces around the environment and we call this indirect light. A global ambient light is a crude approximation of this and allows you to set a light source that appears to shine from all directions. The global ambient color is multiplied with the Ambient property of a Phong Material to add a contribution to the final color of an object.<br /><br />Note, if you are using a Skybox and Physical Materials the Ambient Color has no effect.',
            url: 'http://developer.playcanvas.com/engine/api/stable/symbols/pc.Scene.html#ambientLight'
        }, {
            title: 'skybox',
            subTitle: '{pc.Texture}',
            description: 'The Skybox is a cubemap asset that is rendered behind your 3D scene. This lets your use a set of 6 2D images to display the distant world beyond the 3D models in your scene.<br /><br />To add a skybox, create a cubemap asset and then assign it to the cubemap slot in the settings panel.<br /><br />Note, if you are using a Prefiltered Cubemap, the skybox will be used as the default environment map for all Physical materials.',
            url: 'http://developer.playcanvas.com/engine/api/stable/symbols/pc.Scene.html#skybox'
        }, {
            title: 'toneMapping',
            subTitle: '{Number}',
            description: 'Tonemapping is the process of compressing High Dynamic Range (HDR) colors into limited Low Dynamic Range (e.g. into visible monitor output values). There are two options for tonemapping.<br />Linear: imply scales HDR colors by exposure.<br />Filmic: More sophisticated curve, good at softening overly bright spots, while preserving dark shades as well.<br /><br />Linear tonemapping is active by default, it\'s simply (color * exposure). You can tweak exposure to make quick changes to brightness. Note that it\'s not just simple brightness à la Photoshop because your input can be HDR. e.g. If you have a light source with intensity = 8, it will still be quite bright (4) after exposure = 0.5. So, all visible things won\'t just fade out linearly.<br /><br />Filmic tonemapping is a good choice in high-contrast environments, like scenes lit by bright Sun, or interiors with bright lights being close to walls/ceiling. It will nicely remap out-of-range super bright values to something more perceptually realistic (our eyes and film do tonemapping as well, we don\'t see physically linear values). Well, ask any photographer: nobody likes to leave extremely bright spots as well as pitch black spots on a photo. Filmic tonemapping gives you nice abilities to get rid of such spots.',
            url: 'http://developer.playcanvas.com/engine/api/stable/symbols/pc.Scene.html#tomeMapping'
        }, {
            title: 'exposure',
            subTitle: '{Number}',
            description: 'The exposure value tweaks the overall brightness of the scene.',
            url: 'http://developer.playcanvas.com/engine/api/stable/symbols/pc.Scene.html#exposure'
        }, {
            title: 'gammaCorrection',
            subTitle: '{pc.GAMMA_*}',
            description: 'Computer screens are set up to output not physically linear, but perceptually linear (sRGB) signal. However, for correct appearance when performing lighting calculations, color textures must be converted to physically linear space, and then the fully lit image must be fit again into sRGB. Rendering with gamma correction enabled reduces the number of ugly, overly saturated highlights and better preserves color after lighting, and it\'s generally recommended that this be enabled in your scene. The following image shows a simple scene with a sphere. On the left the scene has been gamma corrected while on the right, the scene is uncorrected.',
            url: 'http://developer.playcanvas.com/engine/api/stable/symbols/pc.Scene.html#gammaCorrection'
        }, {
            title: 'fog',
            subTitle: '{pc.FOG_*}',
            description: 'The Fog Type property can be used to control an approximation of an ambient fog in your scene. Here is an example of fog being enabled:<br /><br />The types available are as follows:<br />None - Fog is disabled<br />Linear - Fog fades in linearly between a Fog Start and Fog End distance<br />Exp - Fog fades in from the view position according to an exponential function<br />Exp2 - Fog fades in from the view position according to an exponential squared function',
            url: 'http://developer.playcanvas.com/engine/api/stable/symbols/pc.Scene.html#fog'
        }, {
            title: 'fogDensity',
            subTitle: '{Number}',
            description: 'The fog density controls the rate at which fog fades in for Exp and Exp2 fog types. Larger values cause fog to fade in more quickly. Fog density must be a positive number.',
            url: 'http://developer.playcanvas.com/engine/api/stable/symbols/pc.Scene.html#fogDensity'
        }, {
            name: 'fogDistance',
            title: 'fogStart / fogEnd',
            subTitle: '{Number}',
            description: 'The distance in scene units from the viewpoint from where the fog starts to fade in and reaches a maximum. Any objects beyond maximum distance will be rendered with the fog color.',
            url: 'http://developer.playcanvas.com/engine/api/stable/symbols/pc.Scene.html#fogEnd'
        }, {
            title: 'fogColor',
            subTitle: '{pc.Color}',
            description: 'The color of the fog. This color is blended with a surface\'s color more as the fog fades in.',
            url: 'http://developer.playcanvas.com/engine/api/stable/symbols/pc.Scene.html#fogColor'
        }
    ];

    // fields reference
    for(var i = 0; i < fields.length; i++) {
        fields[i].name = fields[i].name || fields[i].title;
        create(fields[i]);
    }
});
