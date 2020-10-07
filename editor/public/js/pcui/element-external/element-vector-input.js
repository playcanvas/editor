Object.assign(pcui, (function () {
    'use strict';

    const VectorInput = pcuiExternal.VectorInput;

    utils.implements(VectorInput, pcui.IBindable);
    utils.implements(VectorInput, pcui.IFocusable);

    // register with ElementFactory
    pcui.Element.register('vec2', VectorInput, { dimensions: 2, renderChanges: true });
    pcui.Element.register('vec3', VectorInput, { dimensions: 3, renderChanges: true });
    pcui.Element.register('vec4', VectorInput, { dimensions: 4, renderChanges: true });

    return {
        VectorInput: VectorInput
    };
})());
