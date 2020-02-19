Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'pcui-asset-preview';
    const CLASS_CONTAINER = CLASS_ROOT + '-container';
    const CLASS_CONTAINER_LARGE = CLASS_CONTAINER + '-large';

    class AssetInspectorPreviewBase extends pcui.Container {
        constructor(args) {
            super(args);
            this.class.add(CLASS_CONTAINER);
            this._handleClick = this._handleClick.bind(this);
        }

        _handleClick() {
            if (this.class.contains(CLASS_CONTAINER_LARGE)) {
                this.class.remove(CLASS_CONTAINER_LARGE);
            } else {
                this.class.add(CLASS_CONTAINER_LARGE);
            }
        }

        link() {
            this.unlink();
            this._dom.addEventListener('click', this._handleClick);
        }

        unlink() {
            super.unlink();
            this._dom.removeEventListener('click', this._handleClick);
        }
    }

    return {
        AssetInspectorPreviewBase: AssetInspectorPreviewBase
    };
})());
