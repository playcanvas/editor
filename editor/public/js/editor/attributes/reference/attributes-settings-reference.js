editor.once('load', function() {
    'use strict';

    var fields = [{
        title: 'name',
        subTitle: '{String}',
        description: 'Name of the Scene for better navigation across content.'
    }, {
        name: 'editor',
        description: 'Editor Settings are applied per user basis and only visible to you, and not team collaborators. Although rest of other sections are shared for the Scene for all collaborators.'
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
        name: 'iconsSize',
        description: 'Size of icons displayed in Editor viewport',
    }, {
        name: 'localServer',
        description: 'Set a URL to use as the local server. When you click on "Launch Local" all your scripts will be loaded from this URL.'
    }, {
        title: 'gravity',
        subTitle: '{pc.Vec3}',
        description: 'Gravity is the acceleration applied every frame to all rigid bodies in your scene. By default, it is set to -9.8 meters per second per second, which essentially approximates Earth\'s gravity. If you are making a game in space, you might want to set this to 0, 0, 0 (zero g).',
        url: 'http://developer.playcanvas.com/api/pc.RigidBodyComponentSystem.html#setGravity'
    }, {
        title: 'ambientColor',
        subTitle: '{pc.Color}',
        description: 'The color of the scene\'s ambient light source. PlayCanvas allows you to create directional, point and spot lights. These lights account for direct light that falls on objects. But in reality, light actually bounces around the environment and we call this indirect light. A global ambient light is a crude approximation of this and allows you to set a light source that appears to shine from all directions. The global ambient color is multiplied with the Ambient property of a Phong Material to add a contribution to the final color of an object. Note, if you are using a Skybox and Physical Materials the Ambient Color has no effect.',
        url: 'http://developer.playcanvas.com/api/pc.Scene.html#ambientLight'
    }, {
        title: 'skybox',
        subTitle: '{pc.Texture}',
        description: 'The Skybox is a cubemap asset that is rendered behind your 3D scene. This lets your use a set of 6 2D images to display the distant world beyond the 3D models in your scene. To add a skybox, create a cubemap asset and then assign it to the cubemap slot in the settings panel. Note, if you are using a Prefiltered Cubemap, the skybox will be used as the default environment map for all Physical materials.',
        url: 'http://developer.playcanvas.com/api/pc.Scene.html#skybox'
    }, {
        title: 'skyboxIntensity',
        subTitle: '{Number}',
        description: 'Intensity of the skybox to match the exposure levels.',
        url: 'http://developer.playcanvas.com/api/pc.Scene.html#skyboxIntensity'
    }, {
        title: 'skyboxMip',
        subTitle: '{Number}',
        description: 'Mip level of the prefiletered skybox, higher value is lower mip level which is lower resolution and more prefiltered (blured).',
        url: 'http://developer.playcanvas.com/api/pc.Scene.html#skyboxMip'
    }, {
        title: 'toneMapping',
        subTitle: '{Number}',
        description: 'Tonemapping is the process of compressing High Dynamic Range (HDR) colors into limited Low Dynamic Range (e.g. into visible monitor output values). There are two options for tonemapping. Linear: imply scales HDR colors by exposure. Filmic: More sophisticated curve, good at softening overly bright spots, while preserving dark shades as well. Linear tonemapping is active by default, it\'s simply (color * exposure). You can tweak exposure to make quick changes to brightness. Note that it\'s not just simple brightness à la Photoshop because your input can be HDR. e.g. If you have a light source with intensity = 8, it will still be quite bright (4) after exposure = 0.5. So, all visible things won\'t just fade out linearly. Filmic tonemapping is a good choice in high-contrast environments, like scenes lit by bright Sun, or interiors with bright lights being close to walls/ceiling. It will nicely remap out-of-range super bright values to something more perceptually realistic (our eyes and film do tonemapping as well, we don\'t see physically linear values). Well, ask any photographer: nobody likes to leave extremely bright spots as well as pitch black spots on a photo. Filmic tonemapping gives you nice abilities to get rid of such spots.',
        url: 'http://developer.playcanvas.com/api/pc.Scene.html#tomeMapping'
    }, {
        title: 'exposure',
        subTitle: '{Number}',
        description: 'The exposure value tweaks the overall brightness of the scene.',
        url: 'http://developer.playcanvas.com/api/pc.Scene.html#exposure'
    }, {
        title: 'gammaCorrection',
        subTitle: '{pc.GAMMA_*}',
        description: 'Computer screens are set up to output not physically linear, but perceptually linear (sRGB) signal. However, for correct appearance when performing lighting calculations, color textures must be converted to physically linear space, and then the fully lit image must be fit again into sRGB. Rendering with gamma correction enabled reduces the number of ugly, overly saturated highlights and better preserves color after lighting, and it\'s generally recommended that this be enabled in your scene. The following image shows a simple scene with a sphere. On the left the scene has been gamma corrected while on the right, the scene is uncorrected.',
        url: 'http://developer.playcanvas.com/api/pc.Scene.html#gammaCorrection'
    }, {
        title: 'fog',
        subTitle: '{pc.FOG_*}',
        description: 'The Fog Type property can be used to control an approximation of an ambient fog in your scene. Here is an example of fog being enabled: The types available are as follows: None - Fog is disabled Linear - Fog fades in linearly between a Fog Start and Fog End distance Exp - Fog fades in from the view position according to an exponential function Exp2 - Fog fades in from the view position according to an exponential squared function',
        url: 'http://developer.playcanvas.com/api/pc.Scene.html#fog'
    }, {
        title: 'fogDensity',
        subTitle: '{Number}',
        description: 'The fog density controls the rate at which fog fades in for Exp and Exp2 fog types. Larger values cause fog to fade in more quickly. Fog density must be a positive number.',
        url: 'http://developer.playcanvas.com/api/pc.Scene.html#fogDensity'
    }, {
        name: 'fogDistance',
        title: 'fogStart / fogEnd',
        subTitle: '{Number}',
        description: 'The distance in scene units from the viewpoint from where the fog starts to fade in and reaches a maximum. Any objects beyond maximum distance will be rendered with the fog color.',
        url: 'http://developer.playcanvas.com/api/pc.Scene.html#fogEnd'
    }, {
        title: 'fogColor',
        subTitle: '{pc.Color}',
        description: 'The color of the fog. This color is blended with a surface\'s color more as the fog fades in.',
        url: 'http://developer.playcanvas.com/api/pc.Scene.html#fogColor'
    }, {
        name: 'loadingScreenScript',
        title: 'Loading Screen Script',
        description: 'The name of the script to use for creating the loading screen of the application. The script needs to call pc.script.createLoadingScreen.',
        url: 'http://developer.playcanvas.com/en/api/pc.script.html#createLoadingScreen'
    }, {
        name: 'project',
        title: 'Project Settings',
        description: 'Settings that affect the entire Project and not just this Scene.'
    }, {
        name: 'project:width',
        title: 'Resolution Width',
        description: 'The width of your application in pixels.'
    }, {
        name: 'project:height',
        title: 'Resolution Height',
        description: 'The height of your application in pixels.'
    }, {
        name: 'project:fillMode',
        title: 'Fill Mode',
        description: 'Fill Mode decides how the canvas fills the browser window.'
    }, {
        name: 'project:resolutionMode',
        title: 'Resolution Mode',
        description: 'Resolution Mode decides whether the canvas resolution will change when it is resized.'
    }, {
        name: 'project:physics',
        description: 'When enabled the Physics library code is included in your app.'
    }, {
        name: 'project:pixelRatio',
        title: 'Device Pixel Ratio',
        description: 'When enabled the canvas resolution will be calculated including the device pixel ratio. Enabling this might affect performance.'
    }, {
        name: 'project:preferWebGl2',
        title: 'Prefer WebGL 2.0',
        description: 'When enabled (default) application will use WebGL 2.0 if platform supports it.'
    }, {
        name: 'project:antiAlias',
        title: 'Anti-Alias',
        description: 'When disabled, anti-aliasing will be disabled for back-buffer.'
    }, {
        name: 'project:transparentCanvas',
        title: 'Transparent Canvas',
        description: 'When enabled the canvas will blend with the web page.'
    }, {
        name: 'project:preserveDrawingBuffer',
        title: 'Preserve drawing buffer',
        description: 'When enabled the drawing buffer will be preserved until its explicitely cleared. Useful if you want to take screenshots.'
    }, {
        name: 'project:vr',
        title: 'Enable VR',
        description: 'Initialize WebVR specific code in the engine. If device doesn’t support WebVR then load additional library to enable support.'
    }, {
        name: 'project:useLegacyAudio',
        title: 'Use Legacy Audio',
        description: 'If checked the old AudioSource component will be available in the Editor otherwise you will only see the new Sound component.'
    }, {
        name: 'asset-tasks',
        title: 'Asset Tasks',
        description: 'Settings for defining default behaviour rules for asset pipeline jobs: assets extracting, textures resizing, etc.'
    }, {
        name: 'asset-tasks:auto',
        title: 'Auto-run',
        description: 'Automatically run the asset import pipeline when you upload a new asset.'
    }, {
        name: 'asset-tasks:texturePot',
        title: 'Texture power of two',
        description: 'When a texture is imported it will be resized to use the nearest power of two resolution.'
    }, {
        name: 'asset-tasks:searchRelatedAssets',
        title: 'Search related assets',
        description: 'If enabled, importing a source asset will update target assets where ever they are located. If disabled, assets will only be updated if they are in the same folder, otherwise new assets will be created.'
    }, {
        name: 'asset-tasks:preserveMapping',
        title: 'Preserve model material mappings',
        description: 'If enabled, after importing an existing source model we will try to preserve the material mappings that were set by the user on the existing model.'
    }, {
        name: 'asset-tasks:overwrite:model',
        title: 'Overwrite model',
        description: 'When a model is imported, overwrite a previously imported model asset.'
    }, {
        name: 'asset-tasks:overwrite:animation',
        title: 'Overwrite animation',
        description: 'When a model is imported, overwrite previously imported animation assets.'
    }, {
        name: 'asset-tasks:overwrite:material',
        title: 'Overwrite material',
        description: 'When a model is imported, overwrite previously imported material assets.'
    }, {
        name: 'asset-tasks:overwrite:texture',
        title: 'Overwrite texture',
        description: 'When a model is imported, overwrite previously imported texture assets.'
    }, {
        title: 'lightmapSizeMultiplier',
        subTitle: '{Number}',
        description: 'Auto-generated lightmap textures resolution is calculated using area of geometry in world space and size multiplier of model and scene. Changing this value will affect resolution of lightmaps for whole scene.',
        url: 'http://developer.playcanvas.com/api/pc.Scene.html#lightmapSizeMultiplier'
    }, {
        title: 'lightmapMaxResolution',
        subTitle: '{Number}',
        description: 'Maximum resolution for auto-generated lightmap textures.',
        url: 'http://developer.playcanvas.com/api/pc.Scene.html#lightmapMaxResolution'
    }, {
        name: 'facebook',
        title: 'Facebook Settings',
        description: 'Settings for publishing on Facebook Instant Games'
    }, {
        name: 'facebook:app-id',
        title: 'App ID',
        description: 'This is the Facebook App ID which you can find at the dashboard of your Facebook application.'
    }, {
        name: 'facebook:upload-token',
        title: 'Upload Access Token',
        description: 'An Access Token for uploading a build to Facebook.'
    }, {
        name: 'facebook:sdk-version',
        title: 'SDK Version',
        description: 'The Facebook Instant SDK version to use when publishing to Facebook. If you want you can also enter a version manually.'
    }];

    for(var i = 0; i < fields.length; i++) {
        fields[i].name = 'settings:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
