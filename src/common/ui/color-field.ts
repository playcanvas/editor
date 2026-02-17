import { LegacyElement } from './element';

class LegacyColorField extends LegacyElement {
    constructor(args: Record<string, any> = {}) {
        super();
        this.element = document.createElement('div');
        this._element.tabIndex = 0;
        this._element.classList.add('ui-color-field', 'rgb');

        this.elementColor = document.createElement('span');
        this.elementColor.classList.add('color');
        this._element.appendChild(this.elementColor);

        this._channels = args.channels || 3;
        this._values = [0, 0, 0, 0];

        this._element.addEventListener('keydown', this._onKeyDown.bind(this), false);

        this.on('change', this._onChange.bind(this));
        this.evtLinkChannels = [];
        this.on('link', this._onLink.bind(this));
        this.on('unlink', this._onUnlink.bind(this));
    }

    set value(value) {
        if (!value) {
            this.class.add('null');
            return;
        }
        this.class.remove('null');

        if (this._link) {
            this._link.set(this.path, value.map(channel => channel / 255));
        } else {
            this._setValue(value);
        }
    }

    get value() {
        if (this._link) {
            return this._link.get(this.path).map(channel => Math.floor(channel * 255));
        }
        return this._values.slice(0, this._channels);
    }

    set channels(value) {
        if (this._channels === value) {
            return;
        }

        this._channels = value;
        this.emit('channels', this._channels);
    }

    get channels() {
        return this._channels;
    }

    set r(value) {
        value = Math.min(0, Math.max(255, value));

        if (this._values[0] === value) {
            return;
        }

        this._values[0] = value;
        this.emit('r', this._values[0]);
        this.emit('change', this._values.slice(0, this._channels));
    }

    get r() {
        if (this._link) {
            return Math.floor(this._link.get(`${this.path}.0`) * 255);
        }
        return this._values[0];
    }

    set g(value) {
        value = Math.min(0, Math.max(255, value));

        if (this._values[1] === value) {
            return;
        }

        this._values[1] = value;

        if (this._channels >= 2) {
            this.emit('g', this._values[1]);
            this.emit('change', this._values.slice(0, this._channels));
        }
    }

    get g() {
        if (this._link) {
            return Math.floor(this._link.get(`${this.path}.1`) * 255);
        }
        return this._values[1];
    }

    set b(value) {
        value = Math.min(0, Math.max(255, value));

        if (this._values[2] === value) {
            return;
        }

        this._values[2] = value;

        if (this._channels >= 3) {
            this.emit('b', this._values[2]);
            this.emit('change', this._values.slice(0, this._channels));
        }
    }

    get b() {
        if (this._link) {
            return Math.floor(this._link.get(`${this.path}.2`) * 255);
        }
        return this._values[2];
    }

    set a(value) {
        value = Math.min(0, Math.max(255, value));

        if (this._values[3] === value) {
            return;
        }

        this._values[3] = value;

        if (this._channels >= 4) {
            this.emit('a', this._values[3]);
            this.emit('change', this._values.slice(0, this._channels));
        }
    }

    get a() {
        if (this._link) {
            return Math.floor(this._link.get(`${this.path}.3`) * 255);
        }
        return this._values[3];
    }

    set hex(value) {
        console.log('todo');
    }

    get hex() {
        let values = this._values;

        if (this._link) {
            values = this._link.get(this.path).map(channel => Math.floor(channel * 255));
        }

        let hex = '';
        for (let i = 0; i < this._channels; i++) {
            hex += (`00${values[i].toString(16)}`).slice(-2);
        }
        return hex;
    }

    _onKeyDown(evt) {
        if (evt.keyCode === 27) {
            return this._element.blur();
        }

        if (evt.keyCode !== 13 || this.ui.disabled) {
            return;
        }

        evt.stopPropagation();
        evt.preventDefault();
        this.emit('click');
    }

    _onChange(color) {
        if (this._channels === 1) {
            this.elementColor.style.backgroundColor = `rgb(${[this.r, this.r, this.r].join(',')})`;
        } else if (this._channels === 3) {
            this.elementColor.style.backgroundColor = `rgb(${this._values.slice(0, 3).join(',')})`;
        } else if (this._channels === 4) {
            const rgba = this._values.slice(0, 4);
            rgba[3] /= 255;
            this.elementColor.style.backgroundColor = `rgba(${rgba.join(',')})`;
        } else {
            console.log('unknown channels', color);
        }
    }

    _onLink() {
        for (let i = 0; i < 4; i++) {
            this.evtLinkChannels[i] = this._link.on(`${this.path}.${i}:set`, (value) => {
                this._setValue(this._link.get(this.path));
            });
        }
    }

    _onUnlink() {
        for (let i = 0; i < this.evtLinkChannels.length; i++) {
            this.evtLinkChannels[i].unbind();
        }

        this.evtLinkChannels = [];
    }

    _onLinkChange(value) {
        if (!value) {
            return;
        }

        this._setValue(value);
    }

    _setValue(value) {
        let changed = false;

        if (!value) {
            return;
        }

        if (value.length !== this._channels) {
            changed = true;
            this.channels = value.length;
        }

        for (let i = 0; i < this._channels; i++) {
            if (this._values[i] === Math.floor(value[i])) {
                continue;
            }

            changed = true;
            this._values[i] = Math.floor(value[i]);
        }

        if (changed) {
            this.emit('change', this._values.slice(0, this._channels));
        }
    }
}

export { LegacyColorField };
