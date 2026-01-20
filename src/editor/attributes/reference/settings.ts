import { AttributeReference } from './reference.type';

editor.once('load', () => {
    const fields: AttributeReference[] = [{
        name: 'settings:name',
        title: 'name',
        subTitle: '{String}',
        description: 'Name of the scene to aid navigation across your content.'
    }, {
        name: 'settings:engine',
        title: 'Engine',
        description: 'Engine settings, including the engine version.'
    }, {
        name: 'settings:engineVersion',
        description: 'The engine to use when you click Launch or when you publish or download a build.',
        subTitle: 'This setting is only valid during your current session and is not shared among team members.'
    }, {
        name: 'settings:editor',
        title: 'Editor',
        description: 'Editor settings such as camera near/far clip, zoom sensitivity, and more.'
    }, {
        name: 'settings:snap',
        description: 'Set the increment for gizmo snapping. Hold Shift or use the Snap toggle on the toolbar to enable snapping while using gizmos.'
    }, {
        name: 'settings:grid',
        description: 'To disable the grid, set Divisions to 0. Divisions specifies the number of grid cells in each horizontal direction. Size specifies the size of a cell.'
    }, {
        name: 'settings:cameraClip',
        description: 'If your scene is very large or objects need to be very close, adjust the editor camera Near/Far clip values. This setting does not affect the game.'
    }, {
        name: 'settings:cameraGrabDepth',
        description: 'Enable generating a depth map texture for the editor viewport. Required to preview certain material effects.'
    }, {
        name: 'settings:cameraGrabColor',
        description: 'Enable generating a color map texture for the editor viewport. Required to preview certain material effects.'
    }, {
        name: 'settings:cameraClearColor',
        description: 'Set the editor camera clear color. This does not affect the game.'
    }, {
        name: 'settings:cameraToneMapping',
        description: `Set the editor camera tone mapping. This setting does not affect the game.
<ul>
<li><b>Linear</b>: No tone mapping, simply scales by exposure.</li>
<li><b>Filmic</b>: Attempt to model film stock for natural highlight roll-off.</li>
<li><b>Hejl</b>: Attempt to model film stock with a slightly stronger contrast.</li>
<li><b>ACES</b>: ACES curve for a filmic look with desaturated highlights.</li>
<li><b>ACES2</b>: Updated ACES with improved color/contrast.</li>
<li><b>Neutral</b>: No contrast or hue shift for minimal tonal shaping.</li>
</ul>`
    }, {
        name: 'settings:cameraGammaCorrection',
        description: `Set the editor camera gamma correction. This setting does not affect the game.
<ul>
<li><b>1.0</b>: No gamma correction. Colors may appear overly saturated.</li>
<li><b>2.2</b>: Standard sRGB gamma correction. Recommended for proper color after lighting.</li>
</ul>`
    }, {
        name: 'settings:gizmoSize',
        description: 'Set the gizmo size in the editor viewport.'
    }, {
        name: 'settings:gizmoPreset',
        description: `Set the gizmo preset in the editor viewport. This affects the transform gizmo's style and interaction behavior.
<ul>
<li><b>Default</b>: Modern gizmo style with improved visual feedback.</li>
<li><b>Classic</b>: Legacy gizmo style matching the original PlayCanvas Editor.</li>
</ul>`
    }, {
        name: 'settings:showFog',
        description: 'Enable fog rendering in the viewport.'
    }, {
        name: 'settings:iconSize',
        description: 'Size of icons displayed in the editor viewport.'
    }, {
        name: 'settings:locale',
        description: 'The locale to preview in the editor and when you launch the application. This is only visible to you, not to other team members.'
    }, {
        name: 'settings:chatNotification',
        description: 'Receive notifications for in-editor chat messages.'
    }, {
        name: 'settings:renameDuplicatedEntities',
        description: 'When enabled, duplicated entities are renamed by appending an incrementing number to ensure uniqueness. For example, \'Box\' becomes \'Box2\'.'
    }, {
        name: 'settings:lightmapperAutoBake',
        description: 'Enable or disable automatic lightmap baking.'
    },
    {
        name: 'settings:physics',
        title: 'Physics',
        description: 'Physics settings to include the library and set gravity.'
    }, {
        name: 'settings:gravity',
        title: 'gravity',
        subTitle: '{pc.Vec3}',
        description: 'Gravity is the acceleration applied every frame to all rigid bodies in your scene. By default, it is set to -9.8 meters per second per second, which essentially approximates Earth\'s gravity. If you are making a game in space, you might want to set this to 0, 0, 0 (zero g).',
        url: 'https://api.playcanvas.com/engine/classes/RigidBodyComponentSystem.html#gravity'
    }, {
        name: 'settings:ammo',
        title: 'Physics Library',
        description: 'Add the Ammo asm.js and WebAssembly modules to this project from the PlayCanvas Store.'
    }, {
        name: 'settings:basis',
        title: 'Basis Library',
        description: 'Add the necessary libraries to support Basis compression.'
    }, {
        name: 'settings:draco',
        title: 'Draco Library',
        description: 'Add the necessary libraries to support Draco compression.'
    }, {
        name: 'settings:rendering',
        title: 'Rendering',
        description: 'Rendering settings such as skybox, clustered lighting, shadow settings, and more.'
    }, {
        name: 'settings:ambientColor',
        title: 'ambientColor',
        subTitle: '{pc.Color}',
        description: 'The color of the scene\'s ambient light, specified in sRGB color space.',
        url: 'https://api.playcanvas.com/engine/classes/Scene.html#ambientlight'
    }, {
        name: 'settings:skybox',
        title: 'skybox',
        subTitle: '{pc.Texture}',
        description: 'The skybox is a cubemap asset rendered behind your 3D scene. This lets you use a set of six 2D images to display the distant world beyond the 3D models in your scene. To add a skybox, create a cubemap asset and assign it to the cubemap slot in the settings panel. Note: If you are using a prefiltered cubemap, the skybox is used as the default environment map for all physical materials.',
        url: 'https://api.playcanvas.com/engine/classes/Scene.html#skybox'
    }, {
        name: 'settings:skyType',
        title: 'Sky Type',
        description: `Select the projection used to render the skybox cubemap.
<ul>
<li><b>Infinite</b>: Skybox is rendered at infinity, appearing infinitely far away.</li>
<li><b>Box</b>: Skybox is mapped to a box mesh with configurable position, rotation, and scale.</li>
<li><b>Dome</b>: Skybox is mapped to a hemispherical dome mesh.</li>
</ul>`
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
        description: 'The skybox intensity, used to match exposure levels.',
        url: 'https://api.playcanvas.com/engine/classes/Scene.html#skyboxintensity'
    }, {
        name: 'settings:skyboxMip',
        title: 'skyboxMip',
        subTitle: '{Number}',
        description: 'Mip level of the prefiltered skybox. Higher values select lower-resolution, more prefiltered (blurred) mips.',
        url: 'https://api.playcanvas.com/engine/classes/Scene.html#skyboxmip'
    }, {
        name: 'settings:skyboxRotation',
        title: 'skyboxRotation',
        description: 'Rotation of the skybox.',
        url: 'https://api.playcanvas.com/engine/classes/Scene.html#skyboxrotation'
    }, {
        name: 'settings:toneMapping',
        title: 'toneMapping',
        subTitle: '{Number}',
        description: 'Tone mapping compresses HDR colors into the displayable range. Options: Linear - scales by exposure; Filmic - soft highlight roll-off; Hejl - filmic-like with stronger contrast; ACES - Academy curve for a filmic look; ACES2 - updated ACES with improved color/contrast; Neutral - minimal tonal shaping.',
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
        description: 'Computer displays output a perceptually linear (sRGB) signal, not a physically linear one. For correct lighting, color textures should be converted to linear space, and the fully lit image converted back to sRGB. Enabling gamma correction reduces overly saturated highlights and better preserves color after lighting. It is generally recommended to enable this for your scene.',
        url: 'https://api.playcanvas.com/engine/classes/Scene.html#gammacorrection'
    }, {
        name: 'settings:fog',
        title: 'fog',
        subTitle: '{pc.FOG_*}',
        description: `Controls an approximation of ambient fog in your scene.
<ul>
<li><b>None</b> (<code>pc.FOG_NONE</code>): Fog is disabled.</li>
<li><b>Linear</b> (<code>pc.FOG_LINEAR</code>): Fog fades in linearly between Start and End distances.</li>
<li><b>Exponential</b> (<code>pc.FOG_EXP</code>): Fog fades in exponentially based on density.</li>
<li><b>Exponential Squared</b> (<code>pc.FOG_EXP2</code>): Fog fades in with exponential squared falloff.</li>
</ul>`,
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
        description: 'The distances, in scene units, from the viewpoint where fog starts to fade in (start) and where it reaches maximum (end). Objects beyond the maximum distance are rendered with the fog color.',
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
        description: 'The name of the script to use for creating the application\'s loading screen. The script must call pc.script.createLoadingScreen.',
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
        description: 'Adds the required headers on the launch page to enable SharedArrayBuffer.'
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
        description: `Fill Mode decides how the canvas fills the browser window.
<ul>
<li><b>None</b>: Canvas uses the exact resolution specified.</li>
<li><b>Keep aspect ratio</b>: Canvas fills the window while maintaining aspect ratio.</li>
<li><b>Fill window</b>: Canvas fills the entire window, ignoring aspect ratio.</li>
</ul>`
    }, {
        name: 'settings:project:resolutionMode',
        title: 'Resolution Mode',
        description: `Resolution Mode decides whether the canvas resolution will change when it is resized.
<ul>
<li><b>Auto</b>: Canvas resolution automatically changes to match the canvas size.</li>
<li><b>Fixed</b>: Canvas resolution stays fixed at the specified width and height.</li>
</ul>`
    }, {
        name: 'settings:project:physics',
        description: 'When enabled, the physics library code is included in your app.'
    }, {
        name: 'settings:project:pixelRatio',
        title: 'Device Pixel Ratio',
        description: 'When enabled, the canvas back buffer resolution is multiplied by the device pixel ratio (e.g., 2x on Retina). This increases sharpness on high‑DPI displays but also increases GPU workload and memory usage.'
    }, {
        name: 'settings:project:deviceOrder',
        title: 'Device Order',
        description: 'The order in which attempts are made to create the graphics devices.'
    }, {
        name: 'settings:project:enableWebGpu',
        title: `Enable WebGPU${editor.projectEngineV2 ? '' : ' (beta)'}`,
        description: `When enabled, the application will try to use WebGPU${editor.projectEngineV2 ? '' : ' (beta)'} if available.`
    }, {
        name: 'settings:project:enableWebGl2',
        title: 'Enable WebGL 2.0',
        description: 'When enabled, the application will try to use WebGL 2.0 if available.'
    }, {
        name: 'settings:project:powerPreference',
        title: 'Power Preference',
        description: `Provides a hint to WebGL regarding the preferred power mode.
<ul>
<li><b>Default</b>: Let the browser decide the optimal GPU.</li>
<li><b>Low Power</b>: Prioritize power saving (e.g., integrated GPU).</li>
<li><b>High Performance</b>: Prioritize rendering performance (e.g., discrete GPU).</li>
</ul>`
    }, {
        name: 'settings:project:antiAlias',
        title: 'Anti-aliasing',
        description: 'When disabled, anti-aliasing is disabled for the back buffer.'
    }, {
        name: 'settings:project:transparentCanvas',
        title: 'Transparent Canvas',
        description: 'Makes the canvas background transparent so the web page (e.g., CSS backgrounds and DOM content) shows through. Useful for overlaying the app on custom page designs or UI.'
    }, {
        name: 'settings:project:preserveDrawingBuffer',
        title: 'Preserve drawing buffer',
        description: 'When enabled, the drawing buffer is preserved until it\'s explicitly cleared. Useful for taking screenshots.'
    }, {
        name: 'settings:input',
        title: 'Input',
        description: 'Enable or disable input devices (mouse, keyboard, etc.).'
    }, {
        name: 'settings:project:useKeyboard',
        title: 'Enable Keyboard input',
        description: 'Disable to ignore keyboard input in your application.'
    }, {
        name: 'settings:project:useMouse',
        title: 'Enable Mouse input',
        description: 'Disable to ignore mouse input in your application.'
    }, {
        name: 'settings:project:useTouch',
        title: 'Enable Touch input',
        description: 'Disable to ignore touch input in your application.'
    }, {
        name: 'settings:project:useGamepads',
        title: 'Enable Gamepad input',
        description: 'Disable to ignore gamepad input in your application.'
    }, {
        name: 'settings:network',
        title: 'Network',
        description: 'Network-related settings for the project.'
    }, {
        name: 'settings:project:maxAssetRetries',
        title: 'Max Asset Retries',
        description: 'The maximum number of times to retry loading an asset if it fails to load. If an asset request fails, it will be retried with exponential backoff.'
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
        description: `Specify the mesh compression to apply to imported models.
<ul>
<li><b>Disabled</b>: No mesh compression applied.</li>
<li><b>Draco</b>: Compress meshes using Google Draco for smaller file sizes.</li>
</ul>`
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
        title: 'Animation Naming Strategy',
        description: `Choose how to name animations when converting FBX files to GLB format.
<ul>
<li><b>Use Take Name</b>: Name animations after their take names from the source FBX.</li>
<li><b>Use FBX Filename</b>: Name animations after the source FBX filename.</li>
</ul>`
    }, {
        name: 'settings:asset-import:unwrapUv',
        title: 'Unwrap UV',
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
        name: 'settings:asset-import:useUniqueIndices',
        title: 'Use Unique Indices',
        description: 'Use vertex attribute indices to resolve uniqueness when importing FBX models. Otherwise use vertex attributes to resolve uniqueness. Enabling this option will generally result in more vertices being generated, but their order will be preserved.'
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
        description: 'Lightmapping settings such as resolution, mode, and ambient bake.'
    }, {
        name: 'settings:lightmapSizeMultiplier',
        title: 'lightmapSizeMultiplier',
        subTitle: '{Number}',
        description: 'The resolution of auto-generated lightmap textures is based on the area of geometry in world space and the size multipliers of the model and scene. Changing this value affects lightmap resolution across the whole scene.',
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
        subTitle: '{pc.BAKE_*}',
        description: `The lightmap baking mode.
<ul>
<li><b>Color Only</b> (<code>pc.BAKE_COLOR</code>): Bakes a single color lightmap.</li>
<li><b>Color and Direction</b> (<code>pc.BAKE_COLORDIR</code>): Bakes color plus dominant light direction for bump/specular.</li>
</ul>`,
        url: 'https://api.playcanvas.com/engine/classes/Scene.html#lightmapmode'
    }, {
        name: 'settings:project:lightmapFilterEnabled',
        title: 'lightmapFilterEnabled',
        subTitle: 'boolean',
        description: 'Enable a bilateral filter on runtime-baked lightmaps.',
        url: 'https://api.playcanvas.com/engine/classes/Scene.html#lightmapfilterenabled'
    }, {
        name: 'settings:project:lightmapFilterRange',
        title: 'lightmapFilterRange',
        subTitle: 'number',
        description: 'The range parameter of the bilateral filter.',
        url: 'https://api.playcanvas.com/engine/classes/Scene.html#lightmapfilterrange'
    }, {
        name: 'settings:project:lightmapFilterSmoothness',
        title: 'lightmapFilterSmoothness',
        subTitle: 'number',
        description: 'The spatial parameter of the bilateral filter.',
        url: 'https://api.playcanvas.com/engine/classes/Scene.html#lightmapfiltersmoothness'
    }, {
        name: 'settings:project:ambientBake',
        title: 'ambientBake',
        subTitle: 'boolean',
        description: 'Bake ambient light into lightmaps.',
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
        description: 'The portion of the sphere to include when baking ambient light.',
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
        description: 'Enable clustered lighting.',
        url: 'https://api.playcanvas.com/engine/classes/Scene.html#clusteredlightingenabled'
    }, {
        name: 'settings:lightingCells',
        title: 'lightingCells',
        description: 'Number of cells per world-space axis used to subdivide the space containing lights.',
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
        description: `The type of shadow filtering used by all shadows.
<ul>
<li><b>Shadow Map PCF 1x1</b>: Basic shadow mapping with no filtering.</li>
<li><b>Shadow Map PCF 3x3</b>: Percentage-closer filtering with 3x3 kernel for softer shadows.</li>
<li><b>Shadow Map PCF 5x5</b>: Percentage-closer filtering with 5x5 kernel for smoother shadows.</li>
</ul>`,
        url: 'https://api.playcanvas.com/engine/classes/LightingParams.html#shadowtype'
    }, {
        name: 'settings:lightingCookiesEnabled',
        title: 'lightingCookiesEnabled',
        description: 'Clustered lights support cookies.',
        url: 'https://api.playcanvas.com/engine/classes/LightingParams.html#cookiesenabled'
    }, {
        name: 'settings:lightingAreaLightsEnabled',
        title: 'lightingAreaLightsEnabled',
        description: 'Clustered lights support area lights.',
        url: 'https://api.playcanvas.com/engine/classes/LightingParams.html#arealightsenabled'
    }, {
        name: 'settings:lightingShadowsEnabled',
        title: 'lightingShadowsEnabled',
        description: 'Clustered lights support shadows.',
        url: 'https://api.playcanvas.com/engine/classes/LightingParams.html#shadowsenabled'
    }, {
        name: 'settings:batchGroups',
        title: 'Batch Groups',
        description: 'Manage batch groups for this project. Batch groups reduce draw calls by batching similar models and elements together.'
    }, {
        name: 'settings:batchGroups:name',
        title: 'name',
        subTitle: '{String}',
        description: 'The name of the batch group.'
    }, {
        name: 'settings:batchGroups:dynamic',
        title: 'dynamic',
        subTitle: '{Boolean}',
        description: 'Enable to allow objects in this batch group to move, rotate, or scale after being batched. If your objects are completely static, disable this setting.'
    }, {
        name: 'settings:batchGroups:maxAabbSize',
        title: 'maxAabbSize',
        subTitle: '{Number}',
        description: 'The maximum size of any dimension of a bounding box around batched objects. A larger size batches more objects, generating fewer draw calls, but creates larger batched objects that are harder to cull. A smaller size generates more draw calls (but fewer than without batching) while producing smaller batched objects that are easier to cull.'
    }, {
        name: 'settings:batchGroups:layers',
        title: 'layers',
        subTitle: '{Number[]}',
        description: 'The layers that this batch group belongs to.'
    }, {
        name: 'settings:layers',
        title: 'Layers',
        description: 'Manage rendering layers and their order.'
    }, {
        name: 'settings:layers:name',
        title: 'name',
        subTitle: '{String}',
        description: 'The name of the layer.',
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
        description: 'Enables or disables this part of the layer. When a part is disabled, the mesh instances of that part will not be rendered.'
    }, {
        name: 'settings:localization',
        title: 'Localization',
        description: 'Settings for adding localization assets.'
    }, {
        name: 'settings:localization:i18nAssets',
        title: 'Localization Assets',
        description: 'JSON assets that contain localization data. Assets in this list are automatically parsed for localization data when loaded. These are used to localize your text elements.'
    }, {
        name: 'settings:localization:createAsset',
        description: 'Creates a new localization JSON asset with the default en-US format.'
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
