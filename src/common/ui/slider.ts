import { LegacyElement } from './element';

class LegacySlider extends LegacyElement {
    constructor(args: { precision?: number; min?: number; max?: number } = {}) {
        super();
        this._value = 0;
        this._lastValue = 0;

        this.precision = isNaN(args.precision) ? 2 : args.precision;
        this._min = isNaN(args.min) ? 0 : args.min;
        this._max = isNaN(args.max) ? 1 : args.max;

        this.element = document.createElement('div');
        this.element.classList.add('ui-slider');

        this.elementBar = document.createElement('div');
        this.elementBar.ui = this;
        this.elementBar.classList.add('bar');
        this.element.appendChild(this.elementBar);

        this.elementHandle = document.createElement('div');
        this.elementHandle.ui = this;
        this.elementHandle.tabIndex = 0;
        this.elementHandle.classList.add('handle');
        this.elementBar.appendChild(this.elementHandle);

        this.element.addEventListener('mousedown', this._onMouseDown.bind(this), false);
        this.element.addEventListener('touchstart', this._onTouchStart.bind(this), false);

        this.evtMouseMove = (evt: MouseEvent) => {
            evt.stopPropagation();
            evt.preventDefault();
            this._onSlideMove(evt.pageX);
        };
        this.evtMouseUp = (evt: MouseEvent) => {
            evt.stopPropagation();
            evt.preventDefault();
            this._onSlideEnd(evt.pageX);
        };

        this.evtTouchId = null;

        this.evtTouchMove = (evt: TouchEvent) => {
            for (let i = 0; i < evt.changedTouches.length; i++) {
                const touch = evt.changedTouches[i];

                if (touch.identifier !== this.evtTouchId) {
                    continue;
                }

                evt.stopPropagation();
                evt.preventDefault();

                this._onSlideMove(touch.pageX);
                break;
            }
        };
        this.evtTouchEnd = (evt: TouchEvent) => {
            for (let i = 0; i < evt.changedTouches.length; i++) {
                const touch = evt.changedTouches[i];

                if (touch.identifier !== this.evtTouchId) {
                    continue;
                }

                evt.stopPropagation();
                evt.preventDefault();

                this._onSlideEnd(touch.pageX);
                this.evtTouchId = null;
                break;
            }
        };

        this.on('change', this._onChange.bind(this));

        this.element.addEventListener('keydown', this._onKeyDown.bind(this), false);
    }

    set min(value) {
        if (this._min === value) {
            return;
        }

        this._min = value;
        this._updateHandle(this._value);
    }

    get min() {
        return this._min;
    }

    set max(value) {
        if (this._max === value) {
            return;
        }

        this._max = value;
        this._updateHandle(this._value);
    }

    get max() {
        return this._max;
    }

    set value(value) {
        if (this._link) {
            if (!this._link.set(this.path, value)) {
                this._updateHandle(this._link.get(this.path));
            }
        } else {
            if (this._max !== null && this._max < value) {
                value = this._max;
            }

            if (this._min !== null && this._min > value) {
                value = this._min;
            }

            if (value === null) {
                this.class.add('null');
            } else {
                if (typeof value !== 'number') {
                    value = undefined;
                }

                value = (value !== undefined && this.precision !== null) ? parseFloat(value.toFixed(this.precision)) : value;
                this.class.remove('null');
            }

            this._updateHandle(value);
            this._value = value;

            if (this._lastValue !== value) {
                this._lastValue = value;
                this.emit('change', value);
            }
        }
    }

    get value() {
        if (this._link) {
            return this._link.get(this.path);
        }
        return this._value;
    }

    _onChange() {
        if (!this.renderChanges) {
            return;
        }

        this.flash();
    }

    _onKeyDown(evt: KeyboardEvent) {
        if (evt.keyCode === 27) {
            return this.element.blur();
        }

        if (this.disabled || [37, 39].indexOf(evt.keyCode) === -1) {
            return;
        }

        evt.stopPropagation();
        evt.preventDefault();

        let x = evt.keyCode === 37 ? -1 : 1;

        if (evt.shiftKey) {
            x *= 10;
        }

        const rect = this._element.getBoundingClientRect();
        const step = (this._max - this._min) / rect.width;
        let value = Math.max(this._min, Math.min(this._max, this.value + x * step));
        value = parseFloat(value.toFixed(this.precision));

        this.renderChanges = false;
        this._updateHandle(value);
        this.value = value;
        this.renderChanges = true;
    }

    _onLinkChange(value: any) {
        this._updateHandle(value);
        this._value = value;
        this.emit('change', value || 0);
    }

    _updateHandle(value: number) {
        this.elementHandle.style.left = `${Math.max(0, Math.min(1, ((value || 0) - this._min) / (this._max - this._min))) * 100}%`;
    }

    _onMouseDown(evt: MouseEvent) {
        if (evt.button !== 0 || this.disabled) {
            return;
        }

        this._onSlideStart(evt.pageX);
    }

    _onTouchStart(evt: TouchEvent) {
        if (this.disabled) {
            return;
        }

        for (let i = 0; i < evt.changedTouches.length; i++) {
            const touch = evt.changedTouches[i];
            if (!touch.target.ui || touch.target.ui !== this) {
                continue;
            }

            this.evtTouchId = touch.identifier;
            this._onSlideStart(touch.pageX);
            break;
        }
    }

    _onSlideStart(pageX: number) {
        this.elementHandle.focus();

        this.renderChanges = false;

        if (this.evtTouchId === null) {
            window.addEventListener('mousemove', this.evtMouseMove, false);
            window.addEventListener('mouseup', this.evtMouseUp, false);
        } else {
            window.addEventListener('touchmove', this.evtTouchMove, false);
            window.addEventListener('touchend', this.evtTouchEnd, false);
        }

        this.class.add('active');

        this.emit('start', this.value);

        this._onSlideMove(pageX);

        if (this._link && this._link.history) {
            this._link.history.combine = true;
        }
    }

    _onSlideMove(pageX: number) {
        const rect = this.element.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (pageX - rect.left) / rect.width));

        const range = this._max - this._min;
        let value = (x * range) + this._min;
        value = parseFloat(value.toFixed(this.precision));

        this._updateHandle(value);
        this.value = value;
    }

    _onSlideEnd(pageX: number) {
        this._onSlideMove(pageX);

        this.renderChanges = true;

        this.class.remove('active');

        if (this.evtTouchId === null) {
            window.removeEventListener('mousemove', this.evtMouseMove);
            window.removeEventListener('mouseup', this.evtMouseUp);
        } else {
            window.removeEventListener('touchmove', this.evtTouchMove);
            window.removeEventListener('touchend', this.evtTouchEnd);
        }

        if (this._link && this._link.history) {
            this._link.history.combine = false;
        }

        this.emit('end', this.value);
    }
}

export { LegacySlider };
