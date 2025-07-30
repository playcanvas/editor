/**
 * @type {AttributeReference[]}
 */
export const fields  = [{
    name: 'button:component',
    title: 'pc.ButtonComponent',
    subTitle: '{pc.Component}',
    description: 'A ButtonComponent enables a group of entities to behave like a button, with different visual states for hover and press interactions.',
    url: 'https://api.playcanvas.com/engine/classes/ButtonComponent.html'
}, {
    name: 'button:active',
    title: 'active',
    subTitle: '{Boolean}',
    description: 'If set to false, the button will be visible but will not respond to hover or touch interactions.',
    url: 'https://api.playcanvas.com/engine/classes/ButtonComponent.html#active'
}, {
    name: 'button:imageEntity',
    title: 'imageEntity',
    subTitle: '{pc.Entity}',
    url: 'https://api.playcanvas.com/engine/classes/ButtonComponent.html#imageentity',
    description: 'A reference to the entity to be used as the button background. The entity must have an ImageElement component.'
}, {
    name: 'button:hitPadding',
    title: 'hitPadding',
    subTitle: '{pc.Vec4}',
    description: 'Padding to be used in hit-test calculations. Can be used to expand the bounding box so that the button is easier to tap.',
    url: 'https://api.playcanvas.com/engine/classes/ButtonComponent.html#hitpadding'
}, {
    name: 'button:transitionMode',
    title: 'transitionMode',
    subTitle: '{pc.BUTTON_TRANSITION_MODE}',
    description: 'Controls how the button responds when the user hovers over it/presses it.',
    url: 'https://api.playcanvas.com/engine/classes/ButtonComponent.html#transitionmode'
}, {
    name: 'button:hoverTint',
    title: 'hoverTint',
    subTitle: '{pc.Color}',
    description: 'Color to be used on the button image when the user hovers over it.',
    url: 'https://api.playcanvas.com/engine/classes/ButtonComponent.html#hovertint'
}, {
    name: 'button:pressedTint',
    title: 'pressedTint',
    subTitle: '{pc.Color}',
    description: 'Color to be used on the button image when the user presses it.',
    url: 'https://api.playcanvas.com/engine/classes/ButtonComponent.html#pressedtint'
}, {
    name: 'button:inactiveTint',
    title: 'inactiveTint',
    subTitle: '{pc.Color}',
    description: 'Color to be used on the button image when the button is not interactive.',
    url: 'https://api.playcanvas.com/engine/classes/ButtonComponent.html#inactivetint'
}, {
    name: 'button:fadeDuration',
    title: 'fadeDuration',
    subTitle: '{Number}',
    description: 'Duration to be used when fading between tints, in milliseconds.',
    url: 'https://api.playcanvas.com/engine/classes/ButtonComponent.html#fadeduration'
}, {
    name: 'button:hoverSpriteAsset',
    title: 'hoverSpriteAsset',
    subTitle: '{pc.Asset}',
    description: 'Sprite to be used as the button image when the user hovers over it.',
    url: 'https://api.playcanvas.com/engine/classes/ButtonComponent.html#hoverspriteasset'
}, {
    name: 'button:hoverSpriteFrame',
    title: 'hoverSpriteFrame',
    subTitle: '{Number}',
    description: 'Frame to be used from the hover sprite.',
    url: 'https://api.playcanvas.com/engine/classes/ButtonComponent.html#hoverspriteframe'
}, {
    name: 'button:pressedSpriteAsset',
    title: 'pressedSpriteAsset',
    subTitle: '{pc.Asset}',
    description: 'Sprite to be used as the button image when the user presses it.',
    url: 'https://api.playcanvas.com/engine/classes/ButtonComponent.html#pressedspriteasset'
}, {
    name: 'button:pressedSpriteFrame',
    title: 'pressedSpriteFrame',
    subTitle: '{Number}',
    description: 'Frame to be used from the pressed sprite.',
    url: 'https://api.playcanvas.com/engine/classes/ButtonComponent.html#pressedspriteframe'
}, {
    name: 'button:inactiveSpriteAsset',
    title: 'inactiveSpriteAsset',
    subTitle: '{pc.Asset}',
    description: 'Sprite to be used as the button image when the button is not interactive.',
    url: 'https://api.playcanvas.com/engine/classes/ButtonComponent.html#inactivespriteasset'
}, {
    name: 'button:inactiveSpriteFrame',
    title: 'inactiveSpriteFrame',
    subTitle: '{Number}',
    description: 'Frame to be used from the inactive sprite.',
    url: 'https://api.playcanvas.com/engine/classes/ButtonComponent.html#inactivespriteframe'
}];
