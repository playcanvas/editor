Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'pcui-code';
    const CLASS_INNER = CLASS_ROOT + '-inner';

    class Code extends pcui.Container {
        constructor(args) {
            if (!args) args = {};
            super(document.createElement('div'), args);
            this.class.add(CLASS_ROOT);

            this._inner = new pcui.Label();
            this.append(this._inner);
            this._inner.class.add(CLASS_INNER);
        }

        set text(value) {
            this._text = value;
            this._inner.text = value;
        }

        get text() {
            return this._text;
        }
    }

    pcui.Element.register('code', Code);

    return {
        Code: Code
    };
})());
