Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'pcui-progress';
    const CLASS_INNER = CLASS_ROOT + '-inner';

    class Progress extends pcui.Container {
        constructor(args) {
            if (!args) args = {};
            super(document.createElement('div'), args);
            this.class.add(CLASS_ROOT);

            this._inner = new pcui.Element();
            this.append(this._inner);
            this._inner.class.add(CLASS_INNER);

            if (args.value !== undefined) {
                this.value = args.value;
            }
        }

        set value(val) {
            if (this._value === val) return;

            this._value = val;
            this._inner.width = `${this._value}%`;
            this.emit('change', val);
        }

        get value() {
            return this._value;
        }
    }

    pcui.Element.register('progress', Progress);

    return {
        Progress: Progress
    };
})());
