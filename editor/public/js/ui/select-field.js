"use strict";

function SelectField(args) {
    var self = this;
    ui.Element.call(this);
    args = args || { };

    this.options = args.options || { };
    this.optionsKeys = [ ];
    if (this.options instanceof Array) {
        var options = { };
        for(var i = 0; i < this.options.length; i++) {
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

    this.timerClickAway = null;
    this.evtTouchId = null;
    this.evtTouchSecond = false;
    this.evtMouseDist = [ 0, 0 ];
    this.evtMouseUp = function(evt) {
        evt.preventDefault();
        evt.stopPropagation();

        self._onHoldSelect(evt.target, evt.pageX, evt.pageY);
    };

    this.evtTouchEnd = function(evt) {
        for(var i = 0; i < evt.changedTouches.length; i++) {
            var touch = evt.changedTouches[i];
            if (touch.identifier !== self.evtTouchId)
                continue;

            self.evtTouchId = null;

            evt.preventDefault();
            evt.stopPropagation();

            var target = document.elementFromPoint(touch.pageX, touch.pageY);

            self._onHoldSelect(target, touch.pageX, touch.pageY);
        }

        if (self.evtTouchSecond) {
            evt.preventDefault();
            evt.stopPropagation();
            self.close();
        } else if (self._element.classList.contains('active')) {
            self.evtTouchSecond = true;
        }
    };

    this.elementValue.addEventListener('mousedown', this._onMouseDown, false);
    this.elementValue.addEventListener('touchstart', this._onTouchStart, false);

    this.elementOptions = document.createElement('ul');
    this._element.appendChild(this.elementOptions);

    this.optionElements = { };

    if (args.default !== undefined && this.options[args.default] !== undefined) {
        this._value = this.valueToType(args.default);
        this._oldValue = this._value;
    }

    this.on('link', this._onLink);
    this._updateOptions();

    this.on('change', this._onChange);

    // arrows - change
    this._element.addEventListener('keydown', this._onKeyDown, false);
}
SelectField.prototype = Object.create(ui.Element.prototype);


SelectField.prototype._onHoldSelect = function(target, x, y) {
    if (target && target.uiElement && target.uiElement === this && target.classList.contains('selected'))
        return;

    if ((Math.abs(x - this.evtMouseDist[0]) + Math.abs(y - this.evtMouseDist[1])) < 8)
        return;

    if (target && target.uiElement && target.uiElement === this)
        this._onOptionSelect.call(target);

    this.close();
};

SelectField.prototype._onMouseDown = function(evt) {
    if (this.ui.disabled && ! this.ui.disabledClick)
        return;

    if (this.ui.element.classList.contains('active')) {
        this.ui.close();
    } else {
        evt.preventDefault();
        evt.stopPropagation();
        this.ui.evtMouseDist[0] = evt.pageX;
        this.ui.evtMouseDist[1] = evt.pageY;
        this.ui.element.focus();
        this.ui.open();
        window.addEventListener('mouseup', this.ui.evtMouseUp);
    }
};

SelectField.prototype._onTouchStart = function(evt) {
    if (this.ui.disabled && ! this.ui.disabledClick)
        return;

    if (this.ui.element.classList.contains('active')) {
        this.ui.close();
    } else {
        evt.preventDefault();
        evt.stopPropagation();

        var touch;

        for(var i = 0; i < evt.changedTouches.length; i++) {
            if (evt.changedTouches[i].target !== this)
                continue;

            touch = evt.changedTouches[i];

            break;
        }

        if (! touch) return;

        this.ui.evtTouchId = touch.identifier;
        this.ui.evtMouseDist[0] = touch.pageX;
        this.ui.evtMouseDist[1] = touch.pageY;
        this.ui.element.focus();
        this.ui.open();
        window.addEventListener('touchend', this.ui.evtTouchEnd);
    }
};

SelectField.prototype._onLink = function(path) {
    if (this._link.schema && this._link.schema.has(path)) {
        var field = this._link.schema.get(path);
        var options = field.options || { };
        this._updateOptions(options);
    }
};

SelectField.prototype._onChange = function() {
    if (! this.renderChanges)
        return;

    this.flash();
};

SelectField.prototype._onKeyDown = function(evt) {
    if (evt.keyCode === 27) {
        this.ui.close();
        this.blur();
        return;
    }

    if ((this.ui.disabled && ! this.ui.disabledClick) || [ 38, 40 ].indexOf(evt.keyCode) === -1)
        return;

    evt.stopPropagation();
    evt.preventDefault();

    var keys = Object.keys(this.ui.options);
    var ind = keys.indexOf(this.ui.value !== undefined ? this.ui.value.toString() : null);

    var y = evt.keyCode === 38 ? -1 : 1;

    // already first item
    if (y === -1 && ind <= 0)
        return;

    // already last item
    if (y === 1 && ind === (keys.length - 1))
        return

    // set new item
    this.ui.value = keys[ind + y];
};

SelectField.prototype.valueToType = function(value) {
    switch(this._type) {
        case 'boolean':
            return !! value;
            break;
        case 'number':
            return parseInt(value, 10);
            break;
        case 'string':
            return '' + value;
            break;
    }
};


SelectField.prototype.open = function() {
    if ((this.disabled && ! this.disabledClick) || this._element.classList.contains('active'))
        return;

    this._element.classList.add('active');

    var rect = this._element.getBoundingClientRect();

    // left
    var left = Math.round(rect.left) + ((Math.round(rect.width) - this._element.clientWidth) / 2);

    // top
    var top = rect.top;
    if (this.optionElements[this._value]) {
        top -= this.optionElements[this._value].offsetTop;
        top += (Math.round(rect.height) - this.optionElements[this._value].clientHeight) / 2;
    }

    // limit to bottom / top of screen
    if (top + this.elementOptions.clientHeight > window.innerHeight) {
        top = window.innerHeight - this.elementOptions.clientHeight + 1;
    } else if (top < 0) {
        top = 0;
    }

    // top
    this.elementOptions.style.top = Math.max(0, top) + 'px';
    // left
    this.elementOptions.style.left = left + 'px';
    // right
    this.elementOptions.style.width = Math.round(this._element.clientWidth) + 'px';
    // bottom
    if (top <= 0 && this.elementOptions.offsetHeight >= window.innerHeight) {
        this.elementOptions.style.bottom = '0';
        this.elementOptions.style.height = 'auto';

        // scroll to item
        if (this.optionElements[this._value]) {
            var off = this.optionElements[this._value].offsetTop - rect.top;
            this.elementOptions.scrollTop = off;
        }
    } else {
        this.elementOptions.style.bottom = '';
        this.elementOptions.style.height = '';
    }

    var self = this;
    this.timerClickAway = setTimeout(function() {
        var looseActive = function() {
            self.element.classList.remove('active');
            self.element.blur();
            window.removeEventListener('click', looseActive);
        };

        window.addEventListener('click', looseActive);
    }, 300);

    this.emit('open');
};


SelectField.prototype.close = function() {
    if ((this.disabled && ! this.disabledClick) || ! this._element.classList.contains('active'))
        return;

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
};


SelectField.prototype.toggle = function() {
    if (this._element.classList.contains('active')) {
        this.close();
    } else {
        this.open();
    }
};


SelectField.prototype._updateOptions = function(options) {
    if (options !== undefined) {
        if (options instanceof Array) {
            this.options = { };
            this.optionsKeys = [ ];
            for(var i = 0; i < options.length; i++) {
                this.optionsKeys.push(options[i].v);
                this.options[options[i].v] = options[i].t;
            }
        } else {
            this.options = options;
            this.optionsKeys = Object.keys(options);
        }
    }

    this.optionElements = { };
    this.elementOptions.innerHTML = '';

    for(var i = 0; i < this.optionsKeys.length; i++) {
        if (! this.options.hasOwnProperty(this.optionsKeys[i]))
            continue;

        var element = document.createElement('li');
        element.textContent = this.options[this.optionsKeys[i]];
        element.uiElement = this;
        element.uiValue = this.optionsKeys[i];
        element.addEventListener('touchstart', this._onOptionSelect);
        element.addEventListener('mouseover', this._onOptionHover);
        element.addEventListener('mouseout', this._onOptionOut);
        this.elementOptions.appendChild(element);
        this.optionElements[this.optionsKeys[i]] = element;
    }
};

SelectField.prototype._onOptionSelect = function() {
    this.uiElement.value = this.uiValue;
};

SelectField.prototype._onOptionHover = function() {
    this.classList.add('hover');
};

SelectField.prototype._onOptionOut = function() {
    this.classList.remove('hover');
};

SelectField.prototype._onLinkChange = function(value) {
    if (this.optionElements[value] === undefined)
        return;

    if (this.optionElements[this._oldValue]) {
        this.optionElements[this._oldValue].classList.remove('selected');
    }

    this._value = this.valueToType(value);
    this.elementValue.textContent = this.options[value];
    this.optionElements[value].classList.add('selected');
    this.emit('change', value);
};


Object.defineProperty(SelectField.prototype, 'value', {
    get: function() {
        if (this._link) {
            return this._link.get(this.path);
        } else {
            return this._value;
        }
    },
    set: function(raw) {
        var value = this.valueToType(raw);

        if (this._link) {
            this._oldValue = this._value;
            this.emit('change:before', value);
            this._link.set(this.path, value);
        } else {
            if ((value === null || value === undefined || raw === '') && this.optionElements[''])
                value = '';

            if (this._oldValue === value) return;
            if (value !== null && this.options[value] === undefined) return;

            // deselect old one
            if (this.optionElements[this._oldValue])
                this.optionElements[this._oldValue].classList.remove('selected');

            this._value = value;
            if (value !== '')
                this._value = this.valueToType(this._value);

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
});


window.ui.SelectField = SelectField;
