editor.once('load', function () {
    var fields = [{
        name: 'component',
        title: 'pc.ButtonComponent',
        subTitle: '{pc.Component}',
        description: 'A ButtonComponent enables a group of entities to behave like a button, with different visual states for hover and press interactions.',
        url: 'https://developer.playcanvas.com/api/pc.ButtonComponent.html'
    }, {
        title: 'active',
        subTitle: '{Boolean}',
        description: 'If set to false, the button will be visible but will not respond to hover or touch interactions.',
        url: 'https://developer.playcanvas.com/api/pc.ButtonComponent.html#active'
    }, {
        title: 'imageEntity',
        subTitle: '{pc.Entity}',
        url: 'https://developer.playcanvas.com/api/pc.ButtonComponent.html#imageEntity',
        description: 'A reference to the entity to be used as the button background. The entity must have an ImageElement component.'
    }, {
        title: 'hitPadding',
        subTitle: '{pc.Vec4}',
        description: 'Padding to be used in hit-test calculations. Can be used to expand the bounding box so that the button is easier to tap.',
        url: 'https://developer.playcanvas.com/api/pc.ButtonComponent.html#hitPadding'
    }, {
        title: 'transitionMode',
        subTitle: '{pc.BUTTON_TRANSITION_MODE}',
        description: 'Controls how the button responds when the user hovers over it/presses it.',
        url: 'https://developer.playcanvas.com/api/pc.ButtonComponent.html#transitionMode'
    }, {
        title: 'hoverTint',
        subTitle: '{pc.Color}',
        description: 'Color to be used on the button image when the user hovers over it.',
        url: 'https://developer.playcanvas.com/api/pc.ButtonComponent.html#hoverTint'
    }, {
        title: 'pressedTint',
        subTitle: '{pc.Color}',
        description: 'Color to be used on the button image when the user presses it.',
        url: 'https://developer.playcanvas.com/api/pc.ButtonComponent.html#pressedTint'
    }, {
        title: 'inactiveTint',
        subTitle: '{pc.Color}',
        description: 'Color to be used on the button image when the button is not interactive.',
        url: 'https://developer.playcanvas.com/api/pc.ButtonComponent.html#inactiveTint'
    }, {
        title: 'fadeDuration',
        subTitle: '{Number}',
        description: 'Duration to be used when fading between tints, in milliseconds.',
        url: 'https://developer.playcanvas.com/api/pc.ButtonComponent.html#fadeDuration'
    }, {
        title: 'hoverSpriteAsset',
        subTitle: '{pc.Asset}',
        description: 'Sprite to be used as the button image when the user hovers over it.',
        url: 'https://developer.playcanvas.com/api/pc.ButtonComponent.html#hoverSpriteAsset'
    }, {
        title: 'hoverSpriteFrame',
        subTitle: '{Number}',
        description: 'Frame to be used from the hover sprite.',
        url: 'https://developer.playcanvas.com/api/pc.ButtonComponent.html#hoverSpriteFrame'
    }, {
        title: 'pressedSpriteAsset',
        subTitle: '{pc.Asset}',
        description: 'Sprite to be used as the button image when the user presses it.',
        url: 'https://developer.playcanvas.com/api/pc.ButtonComponent.html#pressedSpriteAsset'
    }, {
        title: 'pressedSpriteFrame',
        subTitle: '{Number}',
        description: 'Frame to be used from the pressed sprite.',
        url: 'https://developer.playcanvas.com/api/pc.ButtonComponent.html#pressedSpriteFrame'
    }, {
        title: 'inactiveSpriteAsset',
        subTitle: '{pc.Asset}',
        description: 'Sprite to be used as the button image when the button is not interactive.',
        url: 'https://developer.playcanvas.com/api/pc.ButtonComponent.html#inactiveSpriteAsset'
    }, {
        title: 'inactiveSpriteFrame',
        subTitle: '{Number}',
        description: 'Frame to be used from the inactive sprite.',
        url: 'https://developer.playcanvas.com/api/pc.ButtonComponent.html#inactiveSpriteFrame'
    }];

    for (let i = 0; i < fields.length; i++) {
        fields[i].name = 'button:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
