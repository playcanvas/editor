editor.once('load', () => {
    /**
     * @type {AttributeReference[]}
     */
    const fields = [{
        name: 'settings:name',
        title: 'name',
        subTitle: '{String}',
        description: 'Name of the Scene for better navigation across content.'
    }, {
        name: 'settings:engine',
        title: 'Engine',
        description: 'Settings for the Engine: setting Engine version.'
    }, {
        name: 'settings:engineVersion',
        description: 'The engine to use when you click Launch or when you publish or download a build. ',
        subTitle: 'This setting is only valid during your current session and is not shared amongst team members.'
    }, {
        name: 'settings:editor',
        title: 'Editor',
        description: 'Settings for the Editor: setting Editor camera near and far clip, zoom sensitivity etc.'
    }, {
        name: 'settings:snap',
        description: 'Change increment value for Snap gizmo state. Use SHIFT or Snap Toggle on toolbar to enable Snapping during use of Gizmos.'
    }, {
        name: 'settings:grid',
        description: 'To disable grid set Divisions to 0. Divisions specify number of grid rectangles in each horizontal direction. And Size specifies the size of a rectangles.'
    }, {
        name: 'settings:cameraClip',
        description: 'If your scene is too large or objects needs to be too close, change Near/Far clip values of a camera for Editor. This setting does not affects the game.'
    }, {
        name: 'settings:cameraGrabDepth',
        description: 'Request the Editor viewport to generate a texture containing the scene depth map. Needed to see some material rendering effects in the viewport.'
    }, {
        name: 'settings:cameraGrabColor',
        description: 'Request the Editor viewport to generate a texture containing the scene color map. Needed to see some material rendering effects in the viewport.'
    }, {
        name: 'settings:cameraClearColor',
        description: 'Set the Camera Clear Color of your preference to affect Editor. This color will not affect the game.'
    }, {
        name: 'settings:cameraToneMapping',
        description: 'Set the Camera Tonemapping of your preference to affect Editor. This setting does not affects the game.'
    }, {
        name: 'settings:cameraGammaCorrection',
        description: 'Set the Camera Gamma Correction of your preference to affect Editor. This setting does not affects the game.'
    }, {
        name: 'settings:showFog',
        description: 'Renders fog in the viewport.'
    }, {
        name: 'settings:iconSize',
        description: 'Size of icons displayed in Editor viewport'
    }, {
        name: 'settings:showSkeleton',
        description: 'Set whether to render the bone structure of selected entity skeleton in the viewport'
    }, {
        name: 'settings:locale',
        description: 'The locale that you can preview in the Editor and when you Launch your application. This is only visible to you not other members of your team.'
    }, {
        name: 'settings:chatNotification',
        description: 'Get notified for in-editor chat messages'
    }, {
        name: 'settings:renameDuplicatedEntities',
        description: 'If ticked, duplicated entity names get an incremental number added to the end for a unique name from the original. E.g. \'Box\' becomes \'Box2\'.'
    }, {
        name: 'settings:lightmapperAutoBake',
        description: 'Enables or disables auto baking of the lightmapper.'
    },
    {
        name: 'settings:ai',
        title: 'AI',
        description: 'Settings for controlling AI autocomplete in the code editor.'
    }, {
        name: 'settings:autocompleteEnabled',
        title: 'Autocomplete Enabled',
        description: 'Enable autocomplete in the code editor.'
    },
    {
        name: 'settings:autocompleteDelay',
        title: 'Autocomplete Delay',
        subTitle: 'number',
        description: 'The delay in seconds before autocomplete executes.'
    },
    {
        name: 'settings:physics',
        title: 'Physics',
        description: 'Settings for the physics to import the library and set gravity.'
    }, {
        name: 'settings:gravity',
        title: 'gravity',
        subTitle: '{pc.Vec3}',
        description: 'Gravity is the acceleration applied every frame to all rigid bodies in your scene. By default, it is set to -9.8 meters per second per second, which essentially approximates Earth\'s gravity. If you are making a game in space, you might want to set this to 0, 0, 0 (zero g).',
        url: 'https://api.playcanvas.com/engine/classes/RigidBodyComponentSystem.html#gravity'
    }, {
        name: 'settings:ammo',
        title: 'Physics Library',
        description: 'Add the Ammo asm.js and wasm modules to this project from the PlayCanvas Store'
    }, {
        name: 'settings:basis',
        title: 'Basis Library',
        description: 'Add the necessary libraries to support Basis compression'
    }, {
        name: 'settings:draco',
        title: 'Draco Library',
        description: 'Add the necessary libraries to support Draco compression'
    }, {
        name: 'settings:rendering',
        title: 'Rendering',
        description: 'Settings for the rendering: setting the skybox, clustered lighting, shadow settings etc.'
    }, {
        name: 'settings:ambientColor',
        title: 'ambientColor',
        subTitle: '{pc.Color}',
        description: 'The color of the scene\'s ambient light source. PlayCanvas allows you to create directional, point and spot lights. These lights account for direct light that falls on objects. But in reality, light actually bounces around the environment and we call this indirect light. A global ambient light is a crude approximation of this and allows you to set a light source that appears to shine from all directions. The global ambient color is multiplied with the Ambient property of a Phong Material to add a contribution to the final color of an object. Note, if you are using a Skybox and Physical Materials the Ambient Color has no effect.',
        url: 'https://api.playcanvas.com/engine/classes/Scene.html#ambientlight'
    }, {
        name: 'settings:skybox',
        title: 'skybox',
        subTitle: '{pc.Texture}',
        description: 'The Skybox is a cubemap asset that is rendered behind your 3D scene. This lets your use a set of 6 2D images to display the distant world beyond the 3D models in your scene. To add a skybox, create a cubemap asset and then assign it to the cubemap slot in the settings panel. Note, if you are using a Prefiltered Cubemap, the skybox will be used as the default environment map for all Physical materials.',
        url: 'https://api.playcanvas.com/engine/classes/Scene.html#skybox'
    }, {
        name: 'settings:skyType',
        title: 'Sky Type',
        description: 'Type of sky.'
    }, {
        name: 'settings:skyMeshPosition',
        title: 'Sky Mesh Position',
        description: 'The position of the sky mesh.'
    }, {
        name: 'settings:skyMeshRotation',
        title: 'Sky Mesh Rotation',
        description: 'The rotation of the sky mesh.'
    }, {
        name: 'settings:skyMeshScale',
        title: 'Sky Mesh Scale',
        description: 'The scale of the sky mesh.'
    }, {
        name: 'settings:skyCenter',
        title: 'Sky Center',
        description: 'The relative normalized offset of the sky from the ground.'
    }, {
        name: 'settings:skyboxIntensity',
        title: 'skyboxIntensity',
        subTitle: '{Number}',
        description: 'Intensity of the skybox to match the exposure levels.',
        url: 'https://api.playcanvas.com/engine/classes/Scene.html#skyboxintensity'
    }, {
        name: 'settings:skyboxMip',
        title: 'skyboxMip',
        subTitle: '{Number}',
        description: 'Mip level of the prefiltered skybox, higher value is lower mip level which is lower resolution and more prefiltered (blured).',
        url: 'https://api.playcanvas.com/engine/classes/Scene.html#skyboxmip'
    }, {
        name: 'settings:skyboxRotation',
        title: 'skyboxRotation',
        description: 'Rotation of skybox.',
        url: 'https://api.playcanvas.com/engine/classes/Scene.html#skyboxrotation'
    }, {
        name: 'settings:toneMapping',
        title: 'toneMapping',
        subTitle: '{Number}',
        description: 'Tonemapping is the process of compressing High Dynamic Range (HDR) colors into limited Low Dynamic Range (e.g. into visible monitor output values). There are two options for tonemapping. Linear: imply scales HDR colors by exposure. Filmic: More sophisticated curve, good at softening overly bright spots, while preserving dark shades as well. Linear tonemapping is active by default, it\'s simply (color * exposure). You can tweak exposure to make quick changes to brightness. Note that it\'s not just simple brightness à la Photoshop because your input can be HDR. e.g. If you have a light source with intensity = 8, it will still be quite bright (4) after exposure = 0.5. So, all visible things won\'t just fade out linearly. Filmic tonemapping is a good choice in high-contrast environments, like scenes lit by bright Sun, or interiors with bright lights being close to walls/ceiling. It will nicely remap out-of-range super bright values to something more perceptually realistic (our eyes and film do tonemapping as well, we don\'t see physically linear values). Well, ask any photographer: nobody likes to leave extremely bright spots as well as pitch black spots on a photo. Filmic tonemapping gives you nice abilities to get rid of such spots.',
        url: 'https://api.playcanvas.com/engine/classes/Scene.html#tonemapping'
    }, {
        name: 'settings:exposure',
        title: 'exposure',
        subTitle: '{Number}',
        description: 'The exposure value tweaks the overall brightness of the scene.',
        url: 'https://api.playcanvas.com/engine/classes/Scene.html#exposure'
    }, {
        name: 'settings:gammaCorrection',
        title: 'gammaCorrection',
        subTitle: '{pc.GAMMA_*}',
        description: 'Computer screens are set up to output not physically linear, but perceptually linear (sRGB) signal. However, for correct appearance when performing lighting calculations, color textures must be converted to physically linear space, and then the fully lit image must be fit again into sRGB. Rendering with gamma correction enabled reduces the number of ugly, overly saturated highlights and better preserves color after lighting, and it\'s generally recommended that this be enabled in your scene. The following image shows a simple scene with a sphere. On the left the scene has been gamma corrected while on the right, the scene is uncorrected.',
        url: 'https://api.playcanvas.com/engine/classes/Scene.html#gammacorrection'
    }, {
        name: 'settings:fog',
        title: 'fog',
        subTitle: '{pc.FOG_*}',
        description: 'The Fog Type property can be used to control an approximation of an ambient fog in your scene. Here is an example of fog being enabled: The types available are as follows: None - Fog is disabled Linear - Fog fades in linearly between a Fog Start and Fog End distance Exp - Fog fades in from the view position according to an exponential function Exp2 - Fog fades in from the view position according to an exponential squared function',
        url: 'https://api.playcanvas.com/engine/classes/Scene.html#fog'
    }, {
        name: 'settings:fogDensity',
        title: 'fogDensity',
        subTitle: '{Number}',
        description: 'The fog density controls the rate at which fog fades in for Exp and Exp2 fog types. Larger values cause fog to fade in more quickly. Fog density must be a positive number.',
        url: 'https://api.playcanvas.com/engine/classes/Scene.html#fogdensity'
    }, {
        name: 'settings:fogDistance',
        title: 'fogStart / fogEnd',
        subTitle: '{Number}',
        description: 'The distance in scene units from the viewpoint from where the fog starts to fade in and reaches a maximum. Any objects beyond maximum distance will be rendered with the fog color.',
        url: 'https://api.playcanvas.com/engine/classes/Scene.html#fogend'
    }, {
        name: 'settings:fogColor',
        title: 'fogColor',
        subTitle: '{pc.Color}',
        description: 'The color of the fog. This color is blended with a surface\'s color more as the fog fades in.',
        url: 'https://api.playcanvas.com/engine/classes/Scene.html#fogcolor'
    }, {
        name: 'settings:loadingScreenScript',
        title: 'Loading Screen Script',
        description: 'The name of the script to use for creating the loading screen of the application. The script needs to call pc.script.createLoadingScreen.',
        url: 'https://api.playcanvas.com/engine/functions/script.createLoadingScreen.html'
    }, {
        name: 'settings:external-scripts',
        title: 'External Scripts',
        description: 'Settings for adding external script URLs.'
    }, {
        name: 'settings:project:externalScripts',
        title: 'External Scripts',
        description: 'The URLs of external scripts you would like to include in your application. These URLs are added as <script> tags in the main HTML page of the application before any other script is loaded.'
    }, {
        name: 'settings:launch-page',
        title: 'Launch Page',
        description: 'Settings for the launch page.'
    }, {
        name: 'settings:project:enableSharedArrayBuffer',
        title: 'Enable SharedArrayBuffer',
        description: 'Additional headers on the launch page to enable SharedArrayBuffer.'
    }, {
        name: 'settings:project',
        title: 'Project Settings',
        description: 'Settings that affect the entire Project and not just this Scene.'
    }, {
        name: 'settings:project:width',
        title: 'Resolution Width',
        description: 'The width of your application in pixels.'
    }, {
        name: 'settings:project:height',
        title: 'Resolution Height',
        description: 'The height of your application in pixels.'
    }, {
        name: 'settings:project:fillMode',
        title: 'Fill Mode',
        description: 'Fill Mode decides how the canvas fills the browser window.'
    }, {
        name: 'settings:project:resolutionMode',
        title: 'Resolution Mode',
        description: 'Resolution Mode decides whether the canvas resolution will change when it is resized.'
    }, {
        name: 'settings:project:physics',
        description: 'When enabled the Physics library code is included in your app.'
    }, {
        name: 'settings:project:pixelRatio',
        title: 'Device Pixel Ratio',
        description: 'When enabled the canvas resolution will be calculated including the device pixel ratio. Enabling this might affect performance.'
    }, {
        name: 'settings:project:deviceOrder',
        title: 'Device Order',
        description: 'The order in which attempts are made to create the graphics devices.'
    }, {
        name: 'settings:project:enableWebGpu',
        title: `Enable WebGPU${editor.projectEngineV2 ? '' : ' (beta)'}`,
        description: `When enabled the application will try to use WebGPU${editor.projectEngineV2 ? '' : ' (beta)'} if available.`
    }, {
        name: 'settings:project:enableWebGl2',
        title: 'Enable WebGL 2.0',
        description: 'When enabled the application will try to use WebGL 2.0 if available.'
    }, {
        name: 'settings:project:powerPreference',
        title: 'Power Preference',
        description: 'Provides a hint to WebGL regarding the preferred power preference mode. When set to Default, the browser decides which GPU configuration is most suitable. When set to High Performance, a GPU configuration that prioritizes rendering performance over power consumption is selected. When set to Low Power, a GPU configuration that prioritizes power saving over rendering performance is selected.'
    }, {
        name: 'settings:project:antiAlias',
        title: 'Anti-Alias',
        description: 'When disabled, anti-aliasing will be disabled for back-buffer.'
    }, {
        name: 'settings:project:transparentCanvas',
        title: 'Transparent Canvas',
        description: 'When enabled the canvas will blend with the web page.'
    }, {
        name: 'settings:project:preserveDrawingBuffer',
        title: 'Preserve drawing buffer',
        description: 'When enabled the drawing buffer will be preserved until its explicitly cleared. Useful if you want to take screenshots.'
    }, {
        name: 'settings:input',
        title: 'Input',
        description: 'Settings for enabling/disabling different input controllers. Mouse, keyboard etc.'
    }, {
        name: 'settings:project:useKeyboard',
        title: 'Enable Keyboard input',
        description: 'Disable this if you do not want to handle any keyboard input in your application.'
    }, {
        name: 'settings:project:useMouse',
        title: 'Enable Mouse input',
        description: 'Disable this if you do not want to handle any mouse input in your application.'
    }, {
        name: 'settings:project:useTouch',
        title: 'Enable Touch input',
        description: 'Disable this if you do not want to handle any touch input in your application.'
    }, {
        name: 'settings:project:useGamepads',
        title: 'Enable Gamepad input',
        description: 'Disable this if you do not want to handle any gamepad input in your application.'
    }, {
        name: 'settings:network',
        title: 'Network',
        description: 'Network related settings for the project.'
    }, {
        name: 'settings:project:maxAssetRetries',
        title: 'Max Asset Retries',
        description: 'The maximum number of times to retry loading an asset if it fails to be loaded. If an asset request fails it will be retried with an exponential backoff.'
    }, {
        name: 'settings:zoomSensitivity',
        title: 'Change Zoom Sensitivity',
        description: 'Change this value if you want to adjust the zoom sensitivity in the Editor viewport.'
    }, {
        name: 'settings:asset-import',
        title: 'Asset Import',
        description: 'Settings for controlling how assets are imported into your project.'
    }, {
        name: 'settings:asset-import:texturePot',
        title: 'Texture power of two',
        description: 'When a texture is imported, it will be resized to the nearest power-of-two resolution.'
    }, {
        name: 'settings:asset-import:textureDefaultToAtlas',
        title: 'Create Atlases',
        description: 'If enabled, imported textures are converted to Texture Atlas assets instead of Texture assets.'
    }, {
        name: 'settings:asset-import:searchRelatedAssets',
        title: 'Search related assets',
        description: 'If enabled, importing a source asset updates related target assets wherever they are located. If disabled, assets are updated only when in the same folder; otherwise, new assets are created.'
    }, {
        name: 'settings:asset-import:preserveMapping',
        title: 'Preserve model material mappings',
        description: 'If enabled, when reimporting an existing source model, the Editor attempts to preserve existing user-defined material mappings.'
    }, {
        name: 'settings:asset-import:useGlb',
        title: 'Use GLB format',
        description: 'Create model assets in GLB format.'
    }, {
        name: 'settings:asset-import:useContainers',
        title: 'Import Hierarchy',
        description: 'Generates a template asset when importing 3D assets (FBX, etc.). The template asset contains the full entity hierarchy from the imported file.'
    }, {
        name: 'settings:asset-import:meshCompression',
        title: 'Mesh Compression Type',
        description: 'Specify the mesh compression to apply to imported models.'
    }, {
        name: 'settings:asset-import:dracoDecodeSpeed',
        title: 'Draco Decode Speed',
        description: 'Specify the speed of mesh decoding. A lower value results in slower decoding but smaller file sizes.'
    }, {
        name: 'settings:asset-import:dracoMeshSize',
        title: 'Draco Mesh Size',
        description: 'Specify the size factor used when compressing mesh attributes. A lower value uses fewer bits to compress attributes, resulting in a smaller file but less detail and potential artifacts.'
    }, {
        name: 'settings:asset-import:createFBXFolder',
        title: 'Create FBX Folder',
        description: 'Creates a new folder in the current directory when importing an FBX file to store the imported FBX contents.'
    }, {
        name: 'settings:asset-import:animSampleRate',
        title: 'Animation Sample Rate',
        description: 'The rate at which to sample animation curves (samples per second). Specify 0 to disable sampling and use input keys instead.'
    }, {
        name: 'settings:asset-import:animCurveTolerance',
        title: 'Animation Curve Tolerance',
        description: 'The tolerance used when optimizing linear animation curve segments. Specify 0 to disable curve optimization.'
    }, {
        name: 'settings:asset-import:animEnableCubic',
        title: 'Animation Cubic Curves',
        description: 'Output cubic curves when they are encountered. Disable to convert all curves to linear segments.'
    }, {
        name: 'settings:asset-import:animUseFbxFilename',
        title: 'Animation Naming Strategy (for GLB only)',
        description: 'Choose the naming strategy for imported animations. Select \'Use Take Name\' to name the animation after the take name assigned in the FBX file. Select \'Use FBX Filename\' to name the animation after the FBX filename.'
    }, {
        name: 'settings:asset-import:unwrapUv',
        title: 'Unwrap Uv',
        description: 'Generates a set of unwrapped UV coordinates.'
    }, {
        name: 'settings:asset-import:unwrapUvTexelsPerMeter',
        title: 'Padding',
        description: 'Specifies the number of texels per meter when UV unwrapping is enabled. Default: 16.'
    }, {
        name: 'settings:asset-import:importMorphNormals',
        title: 'Import Morph Target Normals',
        description: 'Imports morph target normals when importing a model. Disable this if morph target normals look incorrect.'
    }, {
        name: 'settings:asset-import:defaultAssetPreload',
        title: 'Preload new assets',
        description: 'Creates new assets with the preload option enabled. Script assets are always created with preload enabled.'
    }, {
        name: 'settings:asset-import:overwrite:model',
        title: 'Overwrite models',
        description: 'When a model is imported, overwrites any previously imported model asset.'
    }, {
        name: 'settings:asset-import:overwrite:animation',
        title: 'Overwrite animations',
        description: 'When a model is imported, overwrites previously imported animation assets.'
    }, {
        name: 'settings:asset-import:overwrite:material',
        title: 'Overwrite materials',
        description: 'When a model is imported, overwrites previously imported material assets.'
    }, {
        name: 'settings:asset-import:overwrite:texture',
        title: 'Overwrite textures',
        description: 'When a model is imported, overwrites previously imported texture assets.'
    }, {
        name: 'settings:lightmapping',
        title: 'Lightmapping',
        description: 'Settings for the lightmapper: setting the resolution, mode and ambient bake settings.'
    }, {
        name: 'settings:lightmapSizeMultiplier',
        title: 'lightmapSizeMultiplier',
        subTitle: '{Number}',
        description: 'Auto-generated lightmap textures resolution is calculated using area of geometry in world space and size multiplier of model and scene. Changing this value will affect resolution of lightmaps for whole scene.',
        url: 'https://api.playcanvas.com/engine/classes/Scene.html#lightmapsizemultiplier'
    }, {
        name: 'settings:lightmapMaxResolution',
        title: 'lightmapMaxResolution',
        subTitle: '{Number}',
        description: 'Maximum resolution for auto-generated lightmap textures.',
        url: 'https://api.playcanvas.com/engine/classes/Scene.html#lightmapmaxresolution'
    }, {
        name: 'settings:lightmapMode',
        title: 'lightmapMode',
        subTitle: '{Number}',
        description: 'The lightmap baking mode. Can be "Color Only" for just a single color lightmap or "Color and Direction" for single color plus dominant light direction (used for bump/specular).',
        url: 'https://api.playcanvas.com/engine/classes/Scene.html#lightmapmode'
    }, {
        name: 'settings:project:lightmapFilterEnabled',
        title: 'lightmapFilterEnabled',
        subTitle: 'boolean',
        description: 'Enable bilateral filter on runtime baked lightmaps.',
        url: 'https://api.playcanvas.com/engine/classes/Scene.html#lightmapfilterenabled'
    }, {
        name: 'settings:project:lightmapFilterRange',
        title: 'lightmapFilterRange',
        subTitle: 'number',
        description: 'A range parameter of the bilateral filter.',
        url: 'https://api.playcanvas.com/engine/classes/Scene.html#lightmapfilterrange'
    }, {
        name: 'settings:project:lightmapFilterSmoothness',
        title: 'lightmapFilterSmoothness',
        subTitle: 'number',
        description: 'A spatial parameter of the bilateral filter.',
        url: 'https://api.playcanvas.com/engine/classes/Scene.html#lightmapfiltersmoothness'
    }, {
        name: 'settings:project:ambientBake',
        title: 'ambientBake',
        subTitle: 'boolean',
        description: 'Enable baking ambient light into lightmaps.',
        url: 'https://api.playcanvas.com/engine/classes/Scene.html#ambientbake'
    }, {
        name: 'settings:project:ambientBakeNumSamples',
        title: 'ambientBakeNumSamples',
        subTitle: 'number',
        description: 'Number of samples to use when baking ambient light.',
        url: 'https://api.playcanvas.com/engine/classes/Scene.html#ambientbakenumsamples'
    }, {
        name: 'settings:project:ambientBakeSpherePart',
        title: 'ambientBakeSpherePart',
        subTitle: 'number',
        description: 'How much of the sphere to include when baking ambient light.',
        url: 'https://api.playcanvas.com/engine/classes/Scene.html#ambientbakespherepart'
    }, {
        name: 'settings:project:ambientBakeOcclusionBrightness',
        title: 'ambientBakeOcclusionBrightness',
        subTitle: 'number',
        description: 'Brightness of the baked ambient occlusion.',
        url: 'https://api.playcanvas.com/engine/classes/Scene.html#ambientbakeocclusionbrightness'
    }, {
        name: 'settings:project:ambientBakeOcclusionContrast',
        title: 'ambientBakeOcclusionContrast',
        subTitle: 'number',
        description: 'Contrast of the baked ambient occlusion.',
        url: 'https://api.playcanvas.com/engine/classes/Scene.html#ambientbakeocclusioncontrast'
    }, {
        name: 'settings:clusteredLightingEnabled',
        title: 'clusteredLightingEnabled',
        subTitle: 'boolean',
        description: 'Enable the clustered lighting.',
        url: 'https://api.playcanvas.com/engine/classes/Scene.html#clusteredlightingenabled'
    }, {
        name: 'settings:lightingCells',
        title: 'lightingCells',
        description: 'Number of cells along each world-space axis the space containing lights is subdivided into.',
        url: 'https://api.playcanvas.com/engine/classes/LightingParams.html#cells'
    }, {
        name: 'settings:lightingMaxLightsPerCell',
        title: 'lightingMaxLightsPerCell',
        description: 'Maximum number of lights a cell can store.',
        url: 'https://api.playcanvas.com/engine/classes/LightingParams.html#maxlightspercell'
    }, {
        name: 'settings:lightingCookieAtlasResolution',
        title: 'lightingCookieAtlasResolution',
        description: 'Resolution of the atlas texture storing all non-directional cookie textures.',
        url: 'https://api.playcanvas.com/engine/classes/LightingParams.html#cookieatlasresolution'
    }, {
        name: 'settings:lightingShadowAtlasResolution',
        title: 'lightingShadowAtlasResolution',
        description: 'Resolution of the atlas texture storing all non-directional shadow textures.',
        url: 'https://api.playcanvas.com/engine/classes/LightingParams.html#shadowatlasresolution'
    }, {
        name: 'settings:lightingShadowType',
        title: 'lightingShadowType',
        description: 'The type of shadow filtering used by all shadows.',
        url: 'https://api.playcanvas.com/engine/classes/LightingParams.html#shadowtype'
    }, {
        name: 'settings:lightingCookiesEnabled',
        title: 'lightingCookiesEnabled',
        description: 'Cluster lights support cookies.',
        url: 'https://api.playcanvas.com/engine/classes/LightingParams.html#cookiesenabled'
    }, {
        name: 'settings:lightingAreaLightsEnabled',
        title: 'lightingAreaLightsEnabled',
        description: 'Cluster lights support area lights.',
        url: 'https://api.playcanvas.com/engine/classes/LightingParams.html#arealightsenabled'
    }, {
        name: 'settings:lightingShadowsEnabled',
        title: 'lightingShadowsEnabled',
        description: 'Cluster lights support shadows.',
        url: 'https://api.playcanvas.com/engine/classes/LightingParams.html#shadowsenabled'
    }, {
        name: 'settings:batchGroups',
        title: 'Batch Groups',
        description: 'Manage batch groups for this project. Batch groups allow you to reduce draw calls by batching similar Models and Elements together.'
    }, {
        name: 'settings:batchGroups:name',
        title: 'name',
        subTitle: '{String}',
        description: 'The name of the batch group'
    }, {
        name: 'settings:batchGroups:dynamic',
        title: 'dynamic',
        subTitle: '{Boolean}',
        description: 'Enable this if you want to allow objects in this batch group to move/rotate/scale after being batched. If your objects are completely static then disable this field.'
    }, {
        name: 'settings:batchGroups:maxAabbSize',
        title: 'maxAabbSize',
        subTitle: '{Number}',
        description: 'The maximum size of any dimension of a bounding box around batched objects. A larger size will batch more objects generating less draw calls but the batched objects will be larger and harder for the camera to cull. A smaller size will generate more draw calls (but less than without batching) but the resulting objects will be easier for the camera to cull.'
    }, {
        name: 'settings:batchGroups:layers',
        title: 'layers',
        subTitle: '{Number[]}',
        description: 'The layers that this batch group belongs to.'
    }, {
        name: 'settings:layers',
        title: 'Layers',
        description: 'Manage rendering Layers and their render order.'
    }, {
        name: 'settings:layers:name',
        title: 'name',
        subTitle: '{String}',
        description: 'The name of the layer',
        url: 'https://api.playcanvas.com/engine/classes/Layer.html#name'
    }, {
        name: 'settings:layers:opaqueSort',
        title: 'opaqueSortMode',
        subTitle: '{Number}',
        description: 'Defines the method used for sorting opaque mesh instances before rendering.',
        url: 'https://api.playcanvas.com/engine/classes/Layer.html#opaquesortmode'
    }, {
        name: 'settings:layers:transparentSort',
        title: 'transparentSortMode',
        subTitle: '{Number}',
        description: 'Defines the method used for sorting semi-transparent mesh instances before rendering.',
        url: 'https://api.playcanvas.com/engine/classes/Layer.html#transparentsortmode'
    }, {
        name: 'settings:layers:order',
        title: 'Render Order',
        description: 'Manage the order of the rendering layers.'
    }, {
        name: 'settings:layers:sublayers:opaque',
        title: 'Opaque Part',
        description: 'This is the part of the layer that renders the opaque mesh instances that belong to this layer.'
    }, {
        name: 'settings:layers:sublayers:transparent',
        title: 'Transparent Part',
        description: 'This is the part of the layer that renders the semi-transparent mesh instances that belong to this layer.'
    }, {
        name: 'settings:layers:sublayers:enabled',
        title: 'Enabled',
        description: 'Enables or disables this part of the layer. When a part is disabled the mesh instances of that part will not be rendered.'
    }, {
        name: 'settings:localization',
        title: 'Localization',
        description: 'Settings for adding localization assets.'
    }, {
        name: 'settings:localization:i18nAssets',
        title: 'Localization Assets',
        description: 'JSON Assets that contain localization data. Assets in this list will automatically be parsed for localization data when loaded. These are used to localized your Text Elements.'
    }, {
        name: 'settings:localization:createAsset',
        description: 'Creates a new Localization JSON Asset with the default en-US format.'
    }, {
        name: 'settings:loading-screen',
        title: 'Loading Screen',
        description: 'Settings for the loading screen.'
    }, {
        name: 'settings:import-map',
        title: 'Import Map',
        description: 'Settings for the import map.'
    }, {
        name: 'settings:scripts',
        title: 'Scripts Loading Order',
        description: 'Set the loading order for the scripts in the project.'
    }, {
        name: 'settings:settings-history',
        title: 'Settings History',
        description: 'View the version history for the project settings.'
    }];

    for (let i = 0; i < fields.length; i++) {
        editor.call('attributes:reference:add', fields[i]);
    }
});
