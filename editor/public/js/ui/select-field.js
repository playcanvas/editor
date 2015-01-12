"use strict";

function SelectField(args) {
    ui.Element.call(this);
    args = args || { };

    this.options = args.options || { };

    this.element = document.createElement('div');
    this.element.classList.add('ui-select-field', 'noSelect');

    this.elementValue = document.createElement('div');
    this.elementValue.classList.add('value');
    this.element.appendChild(this.elementValue);

    this._oldValue = null;
    this._value = null;
    this._number = !! args.number;

    this.elementValue.addEventListener('click', function(evt) {
        if (this.element.classList.contains('active')) {
            this.element.classList.remove('active');
        } else {
            this.element.classList.add('active');

            var rect = this.element.getBoundingClientRect();

            // top
            var top = (rect.top + 1);
            if (this.optionElements[this._value]) {
                top -= this.optionElements[this._value].offsetTop + 1;
            }
            // limit to bottom of screen
            if (top + this.elementOptions.clientHeight > window.innerHeight) {
                top = window.innerHeight - this.elementOptions.clientHeight;
            }
            this.elementOptions.style.top = top + 'px';
            // left
            this.elementOptions.style.left = rect.left + 'px';
            // right
            this.elementOptions.style.width = (this.element.clientWidth + 2) + 'px';


            setTimeout(function() {
                var looseActive = function() {
                    this.element.classList.remove('active');
                    window.removeEventListener('click', looseActive);
                }.bind(this);

                window.addEventListener('click', looseActive);
            }.bind(this), 0);
        }
    }.bind(this));

    this.elementOptions = document.createElement('ul');
    this.element.appendChild(this.elementOptions);

    this.optionElements = { };

    if (args.default !== undefined && this.options[args.default] !== undefined) {
        this._value = args.default;
        if (this._number)
            this._value = parseInt(this._value, 10);
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
}
SelectField.prototype = Object.create(ui.Element.prototype);

SelectField.prototype._updateOptions = function(options) {
    if (options !== undefined)
        this.options = options;

    if (! this._optionSelectHandler)
        this._optionSelectHandler = this._onOptionSelect.bind(this);

    for(var value in this.optionElements) {
        this.optionElements[value].removeEventListener('click', this._onOptionSelect);
    }

    this.optionElements = { };
    this.elementOptions.innerHTML = '';

    for(var key in this.options) {
        if (! this.options.hasOwnProperty(key))
            continue;

        var element = document.createElement('li');
        element.textContent = this.options[key];
        element.uiElement = this;
        element.uiValue = key;
        element.addEventListener('click', this._onOptionSelect);
        this.elementOptions.appendChild(element);
        this.optionElements[key] = element;
    }
};

SelectField.prototype._onOptionSelect = function() {
    this.uiElement.value = this.uiValue;
};

SelectField.prototype._onLinkChange = function(value) {
    if (this.optionElements[this._oldValue]) {
        this.optionElements[this._oldValue].classList.remove('selected');
    }

    this._value = value;
    if (this._number)
        this._value = parseInt(this._value, 10);
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
    set: function(value) {
        if (this._number)
            value = parseInt(value, 10);

        if (this._link) {
            this._oldValue = this._value;
            this.emit('change:before', value);
            this._link.set(this.path, value);
        } else {
            if (this._value === value) return;
            if (this.options[value] === undefined) return;

            // deselect old one
            if (this.optionElements[this._oldValue]) {
                this.optionElements[this._oldValue].classList.remove('selected');
            }

            this._value = value;
            if (this._number)
                this._value = parseInt(this._value, 10);

            this.emit('change:before', this._value);
            this._oldValue = this._value;
            this.elementValue.textContent = this.options[this._value];
            this.optionElements[this._value].classList.add('selected');
            this.emit('change', this._value);
        }
    }
});


window.ui.SelectField = SelectField;
