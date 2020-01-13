Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'pcui-divider';

    class Divider extends pcui.Element {
        constructor(args) {
            if (!args) args = {};
            super(document.createElement('div'), args);

            this.class.add(CLASS_ROOT);
        }
    }

    pcui.Element.register('divider', Divider);

    return {
        Divider: Divider
    };
})());
