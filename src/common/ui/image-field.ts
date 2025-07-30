import { LegacyElement } from './element.ts';

class LegacyImageField extends LegacyElement {
    constructor(args = {}) {
        super();
        this.element = document.createElement('div');
        this._element.classList.add('ui-image-field', 'empty');

        if (args.canvas) {
            this.elementImage = document.createElement('canvas');
            this.elementImage.width = 64;
            this.elementImage.height = 64;
        } else {
            this.elementImage = new Image();
        }

        this.elementImage.classList.add('preview');
        this._element.appendChild(this.elementImage);

        this._value = null;

        this._element.removeEventListener('click', this._evtClick);
        this._element.addEventListener('click', this._onClick.bind(this), false);
        this.on('change', this._onChange.bind(this));

        this._element.addEventListener('keydown', this._onKeyDown.bind(this), false);
    }

    set image(value) {
        if (this.elementImage.src === value) {
            return;
        }

        this.elementImage.src = value;
    }

    get image() {
        return this.elementImage.src;
    }

    set empty(value) {
        if (this.class.contains('empty') === !!value) {
            return;
        }

        if (value) {
            this.class.add('empty');
            this.image = '';
        } else {
            this.class.remove('empty');
        }
    }

    get empty() {
        return this.class.contains('empty');
    }

    set value(value) {
        value = value && parseInt(value, 10) || null;

        if (this._link) {
            if (!this._link.set(this.path, value)) {
                this._value = this._link.get(this.path);
            }
        } else {
            if (this._value === value && !this.class.contains('null')) {
                return;
            }

            this._value = value;
            this.emit('change', value);
        }
    }

    get value() {
        if (this._link) {
            return this._link.get(this.path);
        }
        return this._value;
    }

    _onClick(evt) {
        this.emit('click', evt);
    }

    _onChange() {
        if (!this.renderChanges) {
            return;
        }

        this.flash();
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
        this.emit('pick');
    }

    _onLinkChange(value) {
        this._value = value;
        this.emit('change', value);
    }
}

export { LegacyImageField };
