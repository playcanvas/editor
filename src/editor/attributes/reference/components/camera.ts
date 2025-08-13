import type { AttributeReference } from '../reference.type.ts';

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
    description: 'The projection type of the camera.',
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
    subTitle: '{Number}',
    description: 'Tonemapping is the process of compressing High Dynamic Range (HDR) colors into limited Low Dynamic Range (e.g. into visible monitor output values). There are two options for tonemapping. Linear: imply scales HDR colors by exposure. Filmic: More sophisticated curve, good at softening overly bright spots, while preserving dark shades as well. Linear tonemapping is active by default, it\'s simply (color * exposure). You can tweak exposure to make quick changes to brightness. Note that it\'s not just simple brightness à la Photoshop because your input can be HDR. e.g. If you have a light source with intensity = 8, it will still be quite bright (4) after exposure = 0.5. So, all visible things won\'t just fade out linearly. Filmic tonemapping is a good choice in high-contrast environments, like scenes lit by bright Sun, or interiors with bright lights being close to walls/ceiling. It will nicely remap out-of-range super bright values to something more perceptually realistic (our eyes and film do tonemapping as well, we don\'t see physically linear values). Well, ask any photographer: nobody likes to leave extremely bright spots as well as pitch black spots on a photo. Filmic tonemapping gives you nice abilities to get rid of such spots.',
    url: 'https://api.playcanvas.com/engine/classes/CameraComponent.html#tonemapping'
}, {
    name: 'camera:gammaCorrection',
    title: 'gammaCorrection',
    subTitle: '{pc.GAMMA_*}',
    description: 'Computer screens are set up to output not physically linear, but perceptually linear (sRGB) signal. However, for correct appearance when performing lighting calculations, color textures must be converted to physically linear space, and then the fully lit image must be fit again into sRGB. Rendering with gamma correction enabled reduces the number of ugly, overly saturated highlights and better preserves color after lighting, and it\'s generally recommended that this be enabled in your scene. The following image shows a simple scene with a sphere. On the left the scene has been gamma corrected while on the right, the scene is uncorrected.',
    url: 'https://api.playcanvas.com/engine/classes/CameraComponent.html#gammacorrection'
}];
