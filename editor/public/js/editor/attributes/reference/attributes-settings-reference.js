editor.once('load', function () {
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
        name: 'showFog',
        description: 'Renders fog in the viewport.'
    }, {
        name: 'iconSize',
        description: 'Size of icons displayed in Editor viewport'
    }, {
        name: 'showSkeleton',
        description: 'Set whether to render the bone structure of selected entity skeleton in the viewport'
    }, {
        name: 'engineVersion',
        description: 'The engine to use when you click Launch or when you publish or download a build. This setting is only valid during your current session and is not shared amongst team members.'
    }, {
        name: 'locale',
        description: 'The locale that you can preview in the Editor and when you Launch your application. This is only visible to you not other members of your team.'
    }, {
        name: 'chatNotification',
        description: 'Get notified for in-editor chat messages'
    }, {
        name: 'renameDuplicatedEntities',
        description: "If ticked, duplicated entity names get an incremental number added to the end for a unique name from the original. E.g. 'Box' becomes 'Box2'."
    }, {
        title: 'gravity',
        subTitle: '{pc.Vec3}',
        description: 'Gravity is the acceleration applied every frame to all rigid bodies in your scene. By default, it is set to -9.8 meters per second per second, which essentially approximates Earth\'s gravity. If you are making a game in space, you might want to set this to 0, 0, 0 (zero g).',
        url: 'http://developer.playcanvas.com/api/pc.RigidBodyComponentSystem.html#setGravity'
    }, {
        name: 'ammo',
        title: 'Physics Library',
        description: 'Add the Ammo asm.js and wasm modules to this project from the Playcanvas Store'
    }, {
        name: 'basis',
        title: 'Basis Library',
        description: 'Add the necessary libraries to support Basis compression'
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
        name: 'areaLights',
        title: 'Area Lights',
        description: 'Add necessary assets to render area lights correctly'
    }, {
        title: 'skyboxMip',
        subTitle: '{Number}',
        description: 'Mip level of the prefiletered skybox, higher value is lower mip level which is lower resolution and more prefiltered (blured).',
        url: 'http://developer.playcanvas.com/api/pc.Scene.html#skyboxMip'
    }, {
        title: 'skyboxRotation',
        description: 'Rotation of skybox.',
        url: 'http://developer.playcanvas.com/api/pc.Scene.html#skyboxRotation'
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
        name: 'project:externalScripts',
        title: 'External Scripts',
        description: 'The URLs of external scripts you would like to include in your application. These URLs are added as <script> tags in the main HTML page of the application before any other script is loaded.'
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
        name: 'project:powerPreference',
        title: 'Power Preference',
        description: 'Provides a hint to WebGL regarding the preferred power preference mode. When set to Default, the browser decides which GPU configuration is most suitable. When set to High Performance, a GPU configuration that prioritizes rendering performance over power consumption is selected. When set to Low Power, a GPU configuration that prioritizes power saving over rendering performance is selected.'
    }, {
        name: 'project:antiAlias',
        title: 'Anti-Alias',
        description: 'When disabled, anti-aliasing will be disabled for back-buffer.'
    }, {
        name: 'project:areaLightDataAsset',
        title: 'Area Light Data',
        description: 'this will be hidden from users'
    }, {
        name: 'project:transparentCanvas',
        title: 'Transparent Canvas',
        description: 'When enabled the canvas will blend with the web page.'
    }, {
        name: 'project:preserveDrawingBuffer',
        title: 'Preserve drawing buffer',
        description: 'When enabled the drawing buffer will be preserved until its explicitely cleared. Useful if you want to take screenshots.'
    }, {
        name: 'project:useLegacyAudio',
        title: 'Use Legacy Audio',
        description: 'If checked the old AudioSource component will be available in the Editor otherwise you will only see the new Sound component.'
    }, {
        name: 'project:useKeyboard',
        title: 'Enable Keyboard input',
        description: 'Disable this if you do not want to handle any keyboard input in your application.'
    }, {
        name: 'project:useMouse',
        title: 'Enable Mouse input',
        description: 'Disable this if you do not want to handle any mouse input in your application.'
    }, {
        name: 'project:useTouch',
        title: 'Enable Touch input',
        description: 'Disable this if you do not want to handle any touch input in your application.'
    }, {
        name: 'project:useGamepads',
        title: 'Enable Gamepad input',
        description: 'Disable this if you do not want to handle any gamepad input in your application.'
    }, {
        name: 'project:maxAssetRetries',
        title: 'Max Asset Retries',
        description: 'The maximum number of times to retry loading an asset if it fails to be loaded. If an asset request fails it will be retried with an exponential backoff.'
    }, {
        name: 'zoomSensitivity',
        title: 'Change Zoom Sensitivity',
        description: 'Change this value if you want to adjust the zoom sensitivity in the Editor viewport.'
    }, {
        name: 'asset-tasks',
        title: 'Asset Tasks',
        description: 'Settings for defining default behaviour rules for asset pipeline jobs: assets extracting, textures resizing, etc.'
    }, {
        name: 'asset-tasks:texturePot',
        title: 'Texture power of two',
        description: 'When a texture is imported it will be resized to use the nearest power of two resolution.'
    }, {
        name: 'asset-tasks:textureDefaultToAtlas',
        title: 'Create Atlases',
        description: 'If enabled, when a texture is imported it will be converted to a Texture Atlas asset instead of a Texture asset.'
    }, {
        name: 'asset-tasks:searchRelatedAssets',
        title: 'Search related assets',
        description: 'If enabled, importing a source asset will update target assets where ever they are located. If disabled, assets will only be updated if they are in the same folder, otherwise new assets will be created.'
    }, {
        name: 'asset-tasks:preserveMapping',
        title: 'Preserve model material mappings',
        description: 'If enabled, after importing an existing source model we will try to preserve the material mappings that were set by the user on the existing model.'
    }, {
        name: 'asset-tasks:useGlb',
        title: 'Use GLB format',
        description: 'Create model assets in GLB format.'
    }, {
        name: 'asset-tasks:useContainers',
        title: 'Import Hierarchy',
        description: 'Generate a template asset when importing 3D assets (FBX etc). The template asset will contain the full entity hierarchy from the imported file.'
    }, {
        name: 'asset-tasks:createFBXFolder',
        title: 'Create FBX Folder',
        description: 'Create a new folder in the current directory when importing an FBX file, which will store all the imported FBX contents.'
    }, {
        name: 'asset-tasks:animSampleRate',
        title: 'Animation Sample Rate',
        description: 'Rate at which to sample animation curves in samples per second. Specify 0 to disable sampling and use input keys instead.'
    }, {
        name: 'asset-tasks:animCurveTolerance',
        title: 'Animation Curve Tolerance',
        description: 'Tolerance to use when optimizing linear animation curve segments. Specify 0 to disable curve optimization.'
    }, {
        name: 'asset-tasks:animEnableCubic',
        title: 'Animation Cubic Curves',
        description: 'Output cubic curves when they are encountered. Disable to convert all curves to linear segments.'
    }, {
        name: 'asset-tasks:animUseFbxFilename',
        title: 'Animation Naming Strategy (for GLB only)',
        description: 'Choose the naming strategy when importing animations. Select \'Use Take Name\' to name the animation after the take name assigned in the FBX file. Select \'Use FBX Filename\' to name the animation after the FBX filename.'
    }, {
        name: 'asset-tasks:unwrapUv',
        title: 'Unwrap Uv',
        description: 'Generate a set of unwrapped uv coordinates.'
    }, {
        name: 'asset-tasks:unwrapUvTexelsPerMeter',
        title: 'Padding',
        description: 'When uv unwrapping is enabled, the number of texels per meter. Defaults to 16.'
    }, {
        name: 'asset-tasks:defaultAssetPreload',
        title: 'Preload new assets',
        description: 'Create new assets with the preload option selected. Script assets will be created with preload enabled regardless of this setting.'
    }, {
        name: 'asset-tasks:overwrite:model',
        title: 'Overwrite models',
        description: 'When a model is imported, overwrite a previously imported model asset.'
    }, {
        name: 'asset-tasks:overwrite:animation',
        title: 'Overwrite animations',
        description: 'When a model is imported, overwrite previously imported animation assets.'
    }, {
        name: 'asset-tasks:overwrite:material',
        title: 'Overwrite materials',
        description: 'When a model is imported, overwrite previously imported material assets.'
    }, {
        name: 'asset-tasks:overwrite:texture',
        title: 'Overwrite textures',
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
        title: 'lightmapMode',
        subTitle: '{Number}',
        description: 'The lightmap baking mode. Can be "Color Only" for just a single color lightmap or "Color and Direction" for single color plus dominant light direction (used for bump/specular).',
        url: 'http://developer.playcanvas.com/api/pc.Scene.html#lightmapMode'
    }, {
        name: 'project:lightmapFilterEnabled',
        title: 'lightmapFilterEnabled',
        subTitle: 'boolean',
        description: 'Enable bilateral filter on runtime baked lightmaps.',
        url: 'https://developer.playcanvas.com/api/pc.Scene.html#lightmapFilterEnabled'
    }, {
        name: 'project:lightmapFilterRange',
        title: 'lightmapFilterRange',
        subTitle: 'number',
        description: 'A range parameter of the bilateral filter.',
        url: 'https://developer.playcanvas.com/api/pc.Scene.html#lightmapFilterRange'
    }, {
        name: 'project:lightmapFilterSmoothness',
        title: 'lightmapFilterSmoothness',
        subTitle: 'number',
        description: 'A spatial parameter of the bilateral filter.',
        url: 'https://developer.playcanvas.com/api/pc.Scene.html#lightmapFilterSmoothness'
    }, {
        name: 'project:ambientBake',
        title: 'ambientBake',
        subTitle: 'boolean',
        description: 'Enable baking ambient light into lightmaps.',
        url: 'https://developer.playcanvas.com/api/pc.Scene.html#ambientBake'
    }, {
        name: 'project:ambientBakeNumSamples',
        title: 'ambientBakeNumSamples',
        subTitle: 'number',
        description: 'Number of samples to use when baking ambient light.',
        url: 'https://developer.playcanvas.com/api/pc.Scene.html#ambientBakeNumSamples'
    }, {
        name: 'project:ambientBakeSpherePart',
        title: 'ambientBakeSpherePart',
        subTitle: 'number',
        description: 'How much of the sphere to include when baking ambient light.',
        url: 'https://developer.playcanvas.com/api/pc.Scene.html#ambientBakeSpherePart'
    }, {
        name: 'project:ambientBakeOcclusionBrightness',
        title: 'ambientBakeOcclusionBrightness',
        subTitle: 'number',
        description: 'Brightness of the baked ambient occlusion.',
        url: 'https://developer.playcanvas.com/api/pc.Scene.html#ambientBakeOcclusionBrightness'
    }, {
        name: 'project:ambientBakeOcclusionContrast',
        title: 'ambientBakeOcclusionContrast',
        subTitle: 'number',
        description: 'Contrast of the baked ambient occlusion.',
        url: 'https://developer.playcanvas.com/api/pc.Scene.html#ambientBakeOcclusionContrast'
    }, {
        name: 'batchGroups',
        title: 'Batch Groups',
        description: 'Manage batch groups for this project. Batch groups allow you to reduce draw calls by batching similar Models and Elements together.'
    }, {
        name: 'batchGroups:name',
        title: 'name',
        subTitle: '{String}',
        description: 'The name of the batch group'
    }, {
        name: 'batchGroups:dynamic',
        title: 'dynamic',
        subTitle: '{Boolean}',
        description: 'Enable this if you want to allow objects in this batch group to move/rotate/scale after being batched. If your objects are completely static then disable this field.'
    }, {
        name: 'batchGroups:maxAabbSize',
        title: 'maxAabbSize',
        subTitle: '{Number}',
        description: 'The maximum size of any dimension of a bounding box around batched objects. A larger size will batch more objects generating less draw calls but the batched objects will be larger and harder for the camera to cull. A smaller size will generate more draw calls (but less than without batching) but the resulting objects will be easier for the camera to cull.'
    }, {
        name: 'batchGroups:layers',
        title: 'layers',
        subTitle: '{Number[]}',
        description: 'The layers that this batch group belongs to.'
    }, {
        name: 'layers',
        title: 'Layers',
        description: 'Manage rendering Layers and their render order.'
    }, {
        name: 'layers:name',
        title: 'name',
        subTitle: '{String}',
        description: 'The name of the layer',
        url: 'http://developer.playcanvas.com/api/pc.Layer.html#name'
    }, {
        name: 'layers:opaqueSort',
        title: 'opaqueSortMode',
        subTitle: '{Number}',
        description: 'Defines the method used for sorting opaque mesh instances before rendering.',
        url: 'http://developer.playcanvas.com/api/pc.Layer.html#opaqueSortMode'
    }, {
        name: 'layers:transparentSort',
        title: 'transparentSortMode',
        subTitle: '{Number}',
        description: 'Defines the method used for sorting semi-transparent mesh instances before rendering.',
        url: 'http://developer.playcanvas.com/api/pc.Layer.html#transparentSortMode'
    }, {
        name: 'layers:order',
        title: 'Render Order',
        description: 'Manage the order of the rendering layers.'
    }, {
        name: 'layers:sublayers:opaque',
        title: 'Opaque Part',
        description: 'This is the part of the layer that renders the opaque mesh instances that belong to this layer.'
    }, {
        name: 'layers:sublayers:transparent',
        title: 'Transparent Part',
        description: 'This is the part of the layer that renders the semi-transparent mesh instances that belong to this layer.'
    }, {
        name: 'layers:sublayers:enabled',
        title: 'Enabled',
        description: 'Enables or disables this part of the layer. When a part is disabled the mesh instances of that part will not be rendered.'
    }, {
        name: 'localization:i18nAssets',
        title: 'Localization Assets',
        description: 'JSON Assets that contain localization data. Assets in this list will automatically be parsed for localization data when loaded. These are used to localized your Text Elements.'
    }, {
        name: 'localization:createAsset',
        description: 'Creates a new Localization JSON Asset with the default en-US format.'
    }];

    for (let i = 0; i < fields.length; i++) {
        fields[i].name = 'settings:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
