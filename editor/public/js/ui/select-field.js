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
    this.element.tabIndex = 0;
    this.element.classList.add('ui-select-field', 'noSelect');

    this.elementValue = document.createElement('div');
    this.elementValue.classList.add('value');
    this.element.appendChild(this.elementValue);

    this._oldValue = null;
    this._value = null;
    this._type = args.type || 'string';

    this.timerClickAway = null;
    this.evtMouseDist = [ 0, 0 ];
    this.evtMouseUp = function(evt) {
        evt.preventDefault();
        evt.stopPropagation();

        if (evt.target && evt.target.uiElement && evt.target.classList.contains('selected'))
            return;

        if ((Math.abs(evt.clientX - self.evtMouseDist[0]) + Math.abs(evt.clientY - self.evtMouseDist[1])) < 8)
            return;

        if (evt.target && evt.target.uiElement)
            self._onOptionSelect.call(evt.target);

        self.close();
    };

    this.elementValue.addEventListener('mousedown', function(evt) {
        if (self.disabled)
            return;

        if (self.element.classList.contains('active')) {
            self.close();
        } else {
            evt.preventDefault();
            evt.stopPropagation();
            self.evtMouseDist[0] = evt.clientX;
            self.evtMouseDist[1] = evt.clientY;
            self.element.focus();
            self.open();
            window.addEventListener('mouseup', self.evtMouseUp);
        }
    });

    this.elementOptions = document.createElement('ul');
    this.element.appendChild(this.elementOptions);

    this.optionElements = { };

    if (args.default !== undefined && this.options[args.default] !== undefined) {
        this._value = this.valueToType(args.default);
        this._oldValue = this._value;
    }

    this._optionSelectHandler = null;

    this.on('link', function(path) {
        if (this._link.schema && this._link.schema.has(path)) {
            var field = this._link.schema.get(path);
            var options = field.options || { };
            this._updateOptions(options);
        }
    });

    this._updateOptions();

    this.on('change', function() {
        if (! this.renderChanges)
            return;

        this.flash();
    });

    // arrows - change
    this.element.addEventListener('keydown', function(evt) {
        if (evt.keyCode === 27) {
            self.close();
            self.element.blur();
            return;
        }

        if (self.disabled || [ 38, 40 ].indexOf(evt.keyCode) === -1)
            return;

        evt.stopPropagation();
        evt.preventDefault();

        var keys = Object.keys(self.options);
        var ind = keys.indexOf(self.value !== undefined ? self.value.toString() : null);

        var y = evt.keyCode === 38 ? -1 : 1;

        // already first item
        if (y === -1 && ind <= 0)
            return;

        // already last item
        if (y === 1 && ind === (keys.length - 1))
            return

        // set new item
        self.value = keys[ind + y];
    }, false);
}
SelectField.prototype = Object.create(ui.Element.prototype);


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
    if (this.disabled || this.element.classList.contains('active'))
        return;

    this.element.classList.add('active');

    var rect = this.element.getBoundingClientRect();

    // left
    var left = Math.round(rect.left) + ((Math.round(rect.width) - this.element.clientWidth) / 2);

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

    this.elementOptions.style.top = top + 'px';
    // left
    this.elementOptions.style.left = left + 'px';
    // right
    this.elementOptions.style.width = Math.round(this.element.clientWidth) + 'px';


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
    if (this.disabled || ! this.element.classList.contains('active'))
        return;

    window.removeEventListener('mouseup', this.evtMouseUp);
    if (this.timerClickAway) {
        clearTimeout(this.timerClickAway);
        this.timerClickAway = null;
    }

    this.element.classList.remove('active');

    this.emit('close');
};


SelectField.prototype.toggle = function() {
    if (this.element.classList.contains('active')) {
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

    if (! this._optionSelectHandler)
        this._optionSelectHandler = this._onOptionSelect.bind(this);

    for(var value in this.optionElements) {
        this.optionElements[value].removeEventListener('click', this._onOptionSelect);
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
        element.addEventListener('click', this._onOptionSelect);
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
