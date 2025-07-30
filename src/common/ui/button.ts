import { LegacyElement } from './element.ts';

class LegacyButton extends LegacyElement {
    constructor(args = {}) {
        super();
        this._text = args.text || '';

        this.element = document.createElement('div');
        this._element.classList.add('ui-button');
        this._element.innerHTML = this._text;

        this._element.ui = this;
        this._element.tabIndex = 0;

        this._element.addEventListener('keydown', this._onKeyDown.bind(this), false);
        this.on('click', this._onClick.bind(this));
    }

    set text(value) {
        if (this._text === value) return;
        this._text = value;
        this._element.innerHTML = this._text;
    }

    get text() {
        return this._text;
    }

    _onKeyDown(evt) {
        if (evt.keyCode === 27) {
            return this._element.blur();
        }

        if (evt.keyCode !== 32 || this.disabled) {
            return;
        }

        evt.stopPropagation();
        evt.preventDefault();
        this.emit('click');
    }

    _onClick() {
        this._element.blur();
    }

    _onLinkChange(value) {
        this._element.value = value;
    }
}

export { LegacyButton };
