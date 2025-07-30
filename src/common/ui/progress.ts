import { LegacyElement } from './element.ts';

class LegacyProgress extends LegacyElement {
    constructor(args = {}) {
        super();
        this._progress = args.progress ? Math.max(0, Math.min(1, args.progress)) : 0;
        this._targetProgress = this._progress;
        this._lastProgress = Math.floor(this._progress * 100);

        this.element = document.createElement('div');
        this._element.classList.add('ui-progress');

        this._inner = document.createElement('div');
        this._inner.classList.add('inner');
        this._inner.style.width = `${this._progress * 100}%`;
        this._element.appendChild(this._inner);

        this._speed = args.speed || 1;
        this._now = Date.now();
        this._animating = false;
        this._failed = false;

        this._animateHandler = this._animate.bind(this);
    }

    set progress(value) {
        value = Math.max(0, Math.min(1, value));

        if (this._targetProgress === value) {
            return;
        }

        this._targetProgress = value;

        if (this._speed === 0 || this._speed === 1) {
            this._progress = this._targetProgress;
            this._inner.style.width = `${this._progress * 100}%`;

            const progress = Math.max(0, Math.min(100, Math.round(this._progress * 100)));
            if (progress !== this._lastProgress) {
                this._lastProgress = progress;
                this.emit(`progress:${progress}`);
                this.emit('progress', progress);
            }
        } else if (!this._animating) {
            requestAnimationFrame(this._animateHandler);
        }
    }

    get progress() {
        return this._progress;
    }

    set speed(value) {
        this._speed = Math.max(0, Math.min(1, value));
    }

    get speed() {
        return this._speed;
    }

    set failed(value) {
        this._failed = !!value;

        if (this._failed) {
            this.class.add('failed');
        } else {
            this.class.remove('failed');
        }
    }

    get failed() {
        return this._failed;
    }

    _animate() {
        if (Math.abs(this._targetProgress - this._progress) < 0.01) {
            this._progress = this._targetProgress;
            this._animating = false;
        } else {
            if (!this._animating) {
                this._now = Date.now() - (1000 / 60);
                this._animating = true;
            }
            requestAnimationFrame(this._animateHandler);

            const dt = Math.max(0.1, Math.min(3, (Date.now() - this._now) / (1000 / 60)));
            this._now = Date.now();
            this._progress += ((this._targetProgress - this._progress) * (this._speed * dt));
        }

        const progress = Math.max(0, Math.min(100, Math.round(this._progress * 100)));
        if (progress !== this._lastProgress) {
            this._lastProgress = progress;
            this.emit(`progress:${progress}`);
            this.emit('progress', progress);
        }

        this._inner.style.width = `${this._progress * 100}%`;
    }
}

export { LegacyProgress };
