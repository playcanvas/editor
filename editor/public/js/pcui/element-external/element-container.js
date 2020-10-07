Object.assign(pcui, (function () {
    'use strict';

    const Container = pcuiExternal.Container;

    utils.implements(Container, pcui.IContainer);
    utils.implements(Container, pcui.IFlex);
    utils.implements(Container, pcui.IGrid);
    utils.implements(Container, pcui.IScrollable);
    utils.implements(Container, pcui.IResizable);

    pcui.Element.register('container', Container);

    return {
        Container: Container
    };
})());
