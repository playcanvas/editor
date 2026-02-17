import { LegacyContainer } from './container';

class LegacyOverlay extends LegacyContainer {
    constructor(args: Record<string, any> = {}) {
        super();
        this.element = document.createElement('div');
        this._element.classList.add('ui-overlay', 'center');

        this.elementOverlay = document.createElement('div');
        this.elementOverlay.ui = this;
        this.elementOverlay.classList.add('overlay', 'clickable');
        this._element.appendChild(this.elementOverlay);

        this.elementOverlay.addEventListener('mousedown', this._onMouseDown.bind(this), false);

        this.innerElement = document.createElement('div');
        this.innerElement.classList.add('content');
        this._element.appendChild(this.innerElement);
    }

    set center(value) {
        if (value) {
            this._element.classList.add('center');
            this.innerElement.style.left = '';
            this.innerElement.style.top = '';
        } else {
            this._element.classList.remove('center');
        }
    }

    get center() {
        return this._element.classList.contains('center');
    }

    set transparent(value) {
        if (value) {
            this._element.classList.add('transparent');
        } else {
            this._element.classList.remove('transparent');
        }
    }

    get transparent() {
        return this._element.classList.contains('transparent');
    }

    set clickable(value) {
        if (value) {
            this.elementOverlay.classList.add('clickable');
        } else {
            this.elementOverlay.classList.remove('clickable');
        }
    }

    get clickable() {
        return this.elementOverlay.classList.contains('clickable');
    }

    get rect() {
        return this.innerElement.getBoundingClientRect();
    }

    setCloseCallback(callback) {
        this._closeCallback = callback;
    }

    _onMouseDown(evt) {
        if (this._closeCallback && !this._closeCallback()) {
            return false;
        }

        if (!this.clickable) {
            return false;
        }

        document.body.blur();

        requestAnimationFrame(() => {
            this.hidden = true;
        });

        evt.preventDefault();
    }

    position(x, y) {
        const area = this.elementOverlay.getBoundingClientRect();
        const rect = this.innerElement.getBoundingClientRect();

        x = Math.max(0, Math.min(area.width - rect.width, x));
        y = Math.max(0, Math.min(area.height - rect.height, y));

        this.innerElement.style.left = `${x}px`;
        this.innerElement.style.top = `${y}px`;
    }
}

export { LegacyOverlay };
