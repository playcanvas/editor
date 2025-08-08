import { LegacyElement } from './element.ts';

class LegacySelectField extends LegacyElement {
    constructor(args = {}) {
        super();
        this.options = args.options || {};
        this.optionsKeys = [];
        if (this.options instanceof Array) {
            const options = {};
            for (let i = 0; i < this.options.length; i++) {
                this.optionsKeys.push(this.options[i].v);
                options[this.options[i].v] = this.options[i].t;
            }
            this.options = options;
        } else {
            this.optionsKeys = Object.keys(this.options);
        }

        this.element = document.createElement('div');
        this._element.tabIndex = 0;
        this._element.classList.add('ui-select-field', 'noSelect');

        this.elementValue = document.createElement('div');
        this.elementValue.ui = this;
        this.elementValue.classList.add('value');
        this._element.appendChild(this.elementValue);

        this._oldValue = null;
        this._value = null;
        this._type = args.type || 'string';

        this._optionClassNamePrefix = args.optionClassNamePrefix || null;

        this.timerClickAway = null;
        this.evtTouchId = null;
        this.evtTouchSecond = false;
        this.evtMouseDist = [0, 0];
        this.evtMouseUp = (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
            this._onHoldSelect(evt.target, evt.pageX, evt.pageY);
        };

        this.evtTouchEnd = (evt) => {
            for (let i = 0; i < evt.changedTouches.length; i++) {
                const touch = evt.changedTouches[i];
                if (touch.identifier !== this.evtTouchId) {
                    continue;
                }

                this.evtTouchId = null;

                evt.preventDefault();
                evt.stopPropagation();

                const target = document.elementFromPoint(touch.pageX, touch.pageY);

                this._onHoldSelect(target, touch.pageX, touch.pageY);
            }

            if (this.evtTouchSecond) {
                evt.preventDefault();
                evt.stopPropagation();
                this.close();
            } else if (this._element.classList.contains('active')) {
                this.evtTouchSecond = true;
            }
        };

        this.elementValue.addEventListener('mousedown', this._onMouseDown.bind(this), false);
        this.elementValue.addEventListener('touchstart', this._onTouchStart.bind(this), { passive: false });

        this.elementOptions = document.createElement('ul');
        this._element.appendChild(this.elementOptions);

        this.optionElements = {};

        if (args.default !== undefined && this.options[args.default] !== undefined) {
            this._value = this.valueToType(args.default);
            this._oldValue = this._value;
        }

        this.on('link', this._onLink.bind(this));
        this._updateOptions();

        this.on('change', this._onChange.bind(this));

        this._element.addEventListener('keydown', this._onKeyDown.bind(this), false);

        if (args.placeholder) {
            this.placeholder = args.placeholder;
        }
    }

    set value(raw) {
        let value = this.valueToType(raw);

        if (this._link) {
            this._oldValue = this._value;
            this.emit('change:before', value);
            this._link.set(this.path, value);
        } else {
            if ((value === null || value === undefined || raw === '') && this.optionElements['']) {
                value = '';
            }

            if (this._oldValue === value) {
                return;
            }
            if (value !== null && this.options[value] === undefined) {
                return;
            }

            if (this.optionElements[this._oldValue]) {
                this.optionElements[this._oldValue].classList.remove('selected');
            }

            this._value = value;
            if (value !== '') {
                this._value = this.valueToType(this._value);
            }

            this.emit('change:before', this._value);
            this._oldValue = this._value;
            if (this.options[this._value]) {
                this.elementValue.textContent = this.options[this._value];
                this.optionElements[this._value].classList.add('selected');
            } else {
                this.elementValue.textContent = '';
            }
            this.emit('change', this._value);
        }
    }

    get value() {
        if (this._link) {
            return this._link.get(this.path);
        }
        return this._value;
    }

    set placeholder(value) {
        if (!value) {
            this.elementValue.removeAttribute('placeholder');
        } else {
            this.elementValue.setAttribute('placeholder', value);
        }
    }

    get placeholder() {
        return this.elementValue.getAttribute('placeholder');
    }

    _onHoldSelect(target, x, y) {
        if (target && target.uiElement && target.uiElement === this && target.classList.contains('selected')) {
            return;
        }

        if ((Math.abs(x - this.evtMouseDist[0]) + Math.abs(y - this.evtMouseDist[1])) < 8) {
            return;
        }

        if (target && target.uiElement && target.uiElement === this) {
            this._onOptionSelect.call(target);
        }

        this.close();
    }

    _onMouseDown(evt) {
        if (this.disabled && !this.disabledClick) {
            return;
        }

        if (this._element.classList.contains('active')) {
            this.close();
        } else {
            evt.preventDefault();
            evt.stopPropagation();
            this.evtMouseDist[0] = evt.pageX;
            this.evtMouseDist[1] = evt.pageY;
            this.element.focus();
            this.open();
            window.addEventListener('mouseup', this.evtMouseUp);
        }
    }

    _onTouchStart(evt) {
        if (this.disabled && !this.disabledClick) {
            return;
        }

        if (this._element.classList.contains('active')) {
            this.close();
        } else {
            evt.preventDefault();
            evt.stopPropagation();

            let touch;

            for (let i = 0; i < evt.changedTouches.length; i++) {
                if (evt.changedTouches[i].target !== this) {
                    continue;
                }

                touch = evt.changedTouches[i];

                break;
            }

            if (!touch) {
                return;
            }

            this.evtTouchId = touch.identifier;
            this.evtMouseDist[0] = touch.pageX;
            this.evtMouseDist[1] = touch.pageY;
            this.element.focus();
            this.open();
            window.addEventListener('touchend', this.evtTouchEnd);
        }
    }

    _onLink(path) {
        if (this._link.schema && this._link.schema.has(path)) {
            const field = this._link.schema.get(path);
            const options = field.options || {};
            this._updateOptions(options);
        }
    }

    _onChange() {
        if (!this.renderChanges) {
            return;
        }

        this.flash();
    }

    _onKeyDown(evt) {
        if (evt.keyCode === 27) {
            this.close();
            this._element.blur();
            return;
        }

        if ((this.disabled && !this.disabledClick) || [38, 40].indexOf(evt.keyCode) === -1) {
            return;
        }

        evt.stopPropagation();
        evt.preventDefault();

        const keys = Object.keys(this.options);
        const ind = keys.indexOf(this.value !== undefined ? this.value.toString() : null);

        const y = evt.keyCode === 38 ? -1 : 1;

        if (y === -1 && ind <= 0) {
            return;
        }

        if (y === 1 && ind === (keys.length - 1)) {
            return;
        }

        this.value = keys[ind + y];
    }

    valueToType(value) {
        switch (this._type) {
            case 'boolean':
                return !!value;
            case 'number':
                return parseInt(value, 10);
            case 'string':
                return `${value}`;
        }
    }

    open() {
        if ((this.disabled && !this.disabledClick) || this._element.classList.contains('active')) {
            return;
        }

        this._element.classList.add('active');

        const rect = this._element.getBoundingClientRect();

        const left = Math.round(rect.left) + ((Math.round(rect.width) - this._element.clientWidth) / 2);

        let top = rect.top;
        if (this.optionElements[this._value]) {
            top -= this.optionElements[this._value].offsetTop;
            top += (Math.round(rect.height) - this.optionElements[this._value].clientHeight) / 2;
        }

        if (top + this.elementOptions.clientHeight > window.innerHeight) {
            top = window.innerHeight - this.elementOptions.clientHeight + 1;
        } else if (top < 0) {
            top = 0;
        }

        this.elementOptions.style.top = `${Math.max(0, top)}px`;
        this.elementOptions.style.left = `${left}px`;
        this.elementOptions.style.width = `${Math.round(this._element.clientWidth)}px`;
        if (top <= 0 && this.elementOptions.offsetHeight >= window.innerHeight) {
            this.elementOptions.style.bottom = '0';
            this.elementOptions.style.height = 'auto';

            if (this.optionElements[this._value]) {
                const off = this.optionElements[this._value].offsetTop - rect.top;
                this.elementOptions.scrollTop = off;
            }
        } else {
            this.elementOptions.style.bottom = '';
            this.elementOptions.style.height = '';
        }

        this.timerClickAway = setTimeout(() => {
            const looseActive = () => {
                this.element.classList.remove('active');
                this.element.blur();
                window.removeEventListener('click', looseActive);
            };

            window.addEventListener('click', looseActive);
        }, 300);

        this.emit('open');
    }

    close() {
        if ((this.disabled && !this.disabledClick) || !this._element.classList.contains('active')) {
            return;
        }

        window.removeEventListener('mouseup', this.evtMouseUp);
        window.removeEventListener('touchend', this.evtTouchEnd);

        if (this.timerClickAway) {
            clearTimeout(this.timerClickAway);
            this.timerClickAway = null;
        }

        this._element.classList.remove('active');

        this.elementOptions.style.top = '';
        this.elementOptions.style.right = '';
        this.elementOptions.style.bottom = '';
        this.elementOptions.style.left = '';
        this.elementOptions.style.width = '';
        this.elementOptions.style.height = '';

        this.emit('close');

        this.evtTouchSecond = false;
    }

    toggle() {
        if (this._element.classList.contains('active')) {
            this.close();
        } else {
            this.open();
        }
    }

    _updateOptions(options) {
        if (options !== undefined) {
            if (options instanceof Array) {
                this.options = {};
                this.optionsKeys = [];
                for (let i = 0; i < options.length; i++) {
                    this.optionsKeys.push(options[i].v);
                    this.options[options[i].v] = options[i].t;
                }
            } else {
                this.options = options;
                this.optionsKeys = Object.keys(options);
            }
        }

        this.optionElements = {};
        this.elementOptions.innerHTML = '';

        for (let i = 0; i < this.optionsKeys.length; i++) {
            if (!this.options.hasOwnProperty(this.optionsKeys[i])) {
                continue;
            }

            const element = document.createElement('li');
            element.textContent = this.options[this.optionsKeys[i]];
            element.uiElement = this;
            element.uiValue = this.optionsKeys[i];
            element.addEventListener('touchstart', this._onOptionSelect, { passive: true });
            element.addEventListener('mouseover', this._onOptionHover);
            element.addEventListener('mouseout', this._onOptionOut);

            if (this._optionClassNamePrefix) {
                element.classList.add(`${this._optionClassNamePrefix}-${element.textContent.toLowerCase().replace(/ /g, '-')}`);
            }

            this.elementOptions.appendChild(element);
            this.optionElements[this.optionsKeys[i]] = element;
        }
    }

    _onOptionSelect() {
        this.uiElement.value = this.uiValue;
    }

    _onOptionHover() {
        this.classList.add('hover');
    }

    _onOptionOut() {
        this.classList.remove('hover');
    }

    _onLinkChange(value) {
        if (this.optionElements[value] === undefined) {
            return;
        }

        if (this.optionElements[this._oldValue]) {
            this.optionElements[this._oldValue].classList.remove('selected');
        }

        this._value = this.valueToType(value);
        this.elementValue.textContent = this.options[value];
        this.optionElements[value].classList.add('selected');
        this.emit('change', value);
    }
}

export { LegacySelectField };
