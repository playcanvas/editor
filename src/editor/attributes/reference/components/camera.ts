import type { AttributeReference } from '../reference.type';

export const fields: AttributeReference[]  = [{
    name: 'camera:component',
    title: 'pc.CameraComponent',
    subTitle: '{pc.Component}',
    description: 'Enables an entity to render a scene from a certain viewpoint.',
    url: 'https://api.playcanvas.com/engine/classes/CameraComponent.html'
}, {
    name: 'camera:clearColor',
    title: 'clearColor',
    subTitle: '{pc.Color}',
    description: 'The color used to clear the camera\'s render target.',
    url: 'https://api.playcanvas.com/engine/classes/CameraComponent.html#clearcolor'
}, {
    name: 'camera:clearColorBuffer',
    title: 'clearColorBuffer',
    subTitle: '{Boolean}',
    description: 'If selected, the camera will explicitly clear its render target to the chosen clear color before rendering the scene.',
    url: 'https://api.playcanvas.com/engine/classes/CameraComponent.html#clearcolorbuffer'
}, {
    name: 'camera:clearDepthBuffer',
    title: 'clearDepthBuffer',
    subTitle: '{Boolean}',
    description: 'If selected, the camera will explicitly clear the depth buffer of its render target before rendering the scene.',
    url: 'https://api.playcanvas.com/engine/classes/CameraComponent.html#cleardepthbuffer'
}, {
    name: 'camera:renderSceneDepthMap',
    title: 'renderSceneDepthMap',
    subTitle: '{Boolean}',
    description: 'If selected, the camera will request the scene to generate a texture containing the scene depth map.',
    url: 'https://api.playcanvas.com/engine/classes/CameraComponent.html#requestscenedepthmap'
}, {
    name: 'camera:renderSceneColorMap',
    title: 'renderSceneColorMap',
    subTitle: '{Boolean}',
    description: 'If selected, the camera will request the scene to generate a texture containing the scene color map.',
    url: 'https://api.playcanvas.com/engine/classes/CameraComponent.html#requestscenecolormap'
}, {
    name: 'camera:clip',
    title: 'nearClip / farClip',
    subTitle: '{Number}',
    description: 'The distance in camera space from the camera\'s eye point to the near and far clip planes.',
    url: 'https://api.playcanvas.com/engine/classes/CameraComponent.html#farclip'
}, {
    name: 'camera:nearClip',
    title: 'nearClip',
    subTitle: '{Number}',
    description: 'The distance in camera space from the camera\'s eye point to the near plane.',
    url: 'https://api.playcanvas.com/engine/classes/CameraComponent.html#nearclip'
}, {
    name: 'camera:farClip',
    title: 'farClip',
    subTitle: '{Number}',
    description: 'The distance in camera space from the camera\'s eye point to the far plane.',
    url: 'https://api.playcanvas.com/engine/classes/CameraComponent.html#farclip'
}, {
    name: 'camera:fov',
    title: 'fov',
    subTitle: '{Number}',
    description: 'Field of View is the angle between top and bottom clip planes of a perspective camera.',
    url: 'https://api.playcanvas.com/engine/classes/CameraComponent.html#fov'
}, {
    name: 'camera:frustumCulling',
    title: 'frustumCulling',
    subTitle: '{Boolean}',
    description: 'Controls the culling of mesh instances against the camera frustum. If true, culling is enabled. If false, all mesh instances in the scene are rendered by the camera, regardless of visibility. Defaults to false.',
    url: 'https://api.playcanvas.com/engine/classes/CameraComponent.html#frustumculling'
}, {
    name: 'camera:orthoHeight',
    title: 'orthoHeight',
    subTitle: '{Number}',
    description: 'The distance in world units between the top and bottom clip planes of an orthographic camera.',
    url: 'https://api.playcanvas.com/engine/classes/CameraComponent.html#orthoheight'
}, {
    name: 'camera:priority',
    title: 'priority',
    subTitle: '{Number}',
    description: 'A number that defines the order in which camera views are rendered by the engine. Smaller numbers are rendered first.',
    url: 'https://api.playcanvas.com/engine/classes/CameraComponent.html#priority'
}, {
    name: 'camera:projection',
    title: 'projection',
    subTitle: '{pc.PROJECTION_*}',
    description: `The projection type of the camera.
<ul>
<li><b>Perspective</b> (<code>pc.PROJECTION_PERSPECTIVE</code>): Objects appear smaller as they get further away. Used for most 3D scenes.</li>
<li><b>Orthographic</b> (<code>pc.PROJECTION_ORTHOGRAPHIC</code>): No perspective distortion. Useful for 2D games and UI.</li>
</ul>`,
    url: 'https://api.playcanvas.com/engine/classes/CameraComponent.html#projection'
}, {
    name: 'camera:rect',
    title: 'rect',
    subTitle: '{pc.Vec4}',
    description: 'A rectangle that specifies the viewport onto the camera\'s attached render target. This allows you to implement features like split-screen or picture-in-picture. It is defined by normalized coordinates (0 to 1) in the following format: x: The lower left x coordinate y: The lower left y coordinate w: The width of the rectangle h: The height of the rectangle',
    url: 'https://api.playcanvas.com/engine/classes/CameraComponent.html#rect'
}, {
    name: 'camera:layers',
    title: 'layers',
    subTitle: '{Number[]}',
    description: 'The layers that this camera will render.',
    url: 'https://api.playcanvas.com/engine/classes/CameraComponent.html#layers'
}, {
    name: 'camera:toneMapping',
    title: 'toneMapping',
    subTitle: '{pc.TONEMAP_*}',
    description: `Tonemapping compresses High Dynamic Range (HDR) colors into visible monitor output values.
<ul>
<li><b>Linear</b> (<code>pc.TONEMAP_LINEAR</code>): Scales HDR colors by exposure. Simple but can clip bright areas.</li>
<li><b>Filmic</b> (<code>pc.TONEMAP_FILMIC</code>): Softens bright spots while preserving dark shades. Good for high-contrast scenes.</li>
<li><b>Hejl</b> (<code>pc.TONEMAP_HEJL</code>): Attempt to mimic film stock.</li>
<li><b>ACES</b> (<code>pc.TONEMAP_ACES</code>): Industry standard filmic curve.</li>
<li><b>ACES2</b> (<code>pc.TONEMAP_ACES2</code>): Updated ACES curve with improved color handling.</li>
<li><b>Neutral</b> (<code>pc.TONEMAP_NEUTRAL</code>): Attempt to preserve original color while compressing brightness.</li>
</ul>`,
    url: 'https://api.playcanvas.com/engine/classes/CameraComponent.html#tonemapping'
}, {
    name: 'camera:gammaCorrection',
    title: 'gammaCorrection',
    subTitle: '{pc.GAMMA_*}',
    description: `Controls gamma correction for proper color rendering. Screens output perceptually linear (sRGB) signals, so lighting calculations must account for this.
<ul>
<li><b>1.0</b> (<code>pc.GAMMA_NONE</code>): No gamma correction. Colors may appear overly saturated.</li>
<li><b>2.2</b> (<code>pc.GAMMA_SRGB</code>): Standard sRGB gamma correction. Recommended for proper color after lighting.</li>
</ul>`,
    url: 'https://api.playcanvas.com/engine/classes/CameraComponent.html#gammacorrection'
}];
