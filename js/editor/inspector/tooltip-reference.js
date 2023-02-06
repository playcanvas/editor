import { Label, Button } from '@playcanvas/pcui';

Object.assign(pcui, (function () {
    const CLASS_ROOT = 'tooltip-reference';
    const CLASS_WEBGL2 = CLASS_ROOT + '-webgl2';
    const CLASS_API = CLASS_ROOT + '-api';
    const CLASS_CODE = CLASS_ROOT + '-code';

    class TooltipReference extends pcui.Tooltip {
        constructor(args) {
            args = args || {};
            args.flex = true;
            super(args);

            this.class.add(CLASS_ROOT);

            this._labelWebgl2 = new Label({
                class: CLASS_WEBGL2,
                text: 'WebGL 2.0 Only',
                hidden: true
            });
            this.append(this._labelWebgl2);

            this._labelCode = new Label({
                class: CLASS_CODE,
                hidden: true
            });
            this.append(this._labelCode);

            this._btnUrl = new Button({
                text: 'API REFERENCE',
                class: CLASS_API,
                flexGrow: 1,
                hidden: true
            });
            this.append(this._btnUrl);

            this._btnUrl.on('click', this._onUrlClick.bind(this));

            if (args.reference) {
                this.reference = args.reference;
            }
        }

        _onUrlClick() {
            if (this._reference && this._reference.url) {
                window.open(this._reference.url);
            }
        }

        set reference(value) {
            this._reference = value;

            this.title = this._reference && this._reference.title || '';
            this.subTitle = this._reference && this._reference.subTitle || '';
            this.description = this._reference && this._reference.description || '';

            if (this._reference && this._reference.code) {
                this._labelCode.text = this._reference.code;
                this._labelCode.hidden = false;
            } else {
                this._labelCode.hidden = true;
            }

            this._labelWebgl2.hidden = !this._reference || !this._reference.webgl2;
            this._btnUrl.hidden = !this._reference || !this._reference.url;
        }

        get reference() {
            return this._reference;
        }
    }

    return {
        TooltipReference: TooltipReference
    };
})());
