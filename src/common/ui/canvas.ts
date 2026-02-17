import { LegacyElement } from './element';

class LegacyCanvas extends LegacyElement {
    constructor(args: Record<string, any> = {}) {
        super();
        this.element = document.createElement('canvas');
        this._element.classList.add('ui-canvas');

        if (args.id !== undefined) {
            this._element.id = args.id;
        }

        if (args.tabindex !== undefined) {
            this._element.setAttribute('tabindex', args.tabindex);
        }

        this._width = 300;
        this._height = 150;
        this._ratio = (args.useDevicePixelRatio !== undefined && args.useDevicePixelRatio) ? window.devicePixelRatio : 1;

        this._element.onselectstart = this.onselectstart;
    }

    set width(value) {
        if (this._width === value) {
            return;
        }

        this._width = value;
        this._element.width = this.pixelWidth;
        this._element.style.width = `${value}px`;
        this.emit('resize', this._width, this._height);
    }

    get width() {
        return this._width;
    }

    set height(value) {
        if (this._height === value) {
            return;
        }

        this._height = value;
        this._element.height = this.pixelHeight;
        this._element.style.height = `${value}px`;
        this.emit('resize', this._width, this._height);
    }

    get height() {
        return this._height;
    }

    get pixelWidth() {
        return Math.floor(this._width * this._ratio);
    }

    get pixelHeight() {
        return Math.floor(this._height * this._ratio);
    }

    get pixelRatio() {
        return this._ratio;
    }

    onselectstart() {
        return false;
    }

    resize(width, height) {
        if (this._width === width && this._height === height) {
            return;
        }

        this._width = width;
        this._height = height;
        this._element.width = this.pixelWidth;
        this._element.height = this.pixelHeight;
        this._element.style.width = `${width}px`;
        this._element.style.height = `${height}px`;
        this.emit('resize', width, height);
    }
}

export { LegacyCanvas };
