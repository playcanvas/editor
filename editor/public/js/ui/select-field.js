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

    this.elementValue.addEventListener('click', function(evt) {
        if (this.element.classList.contains('active')) {
            this.element.classList.remove('active');
        } else {
            this.element.classList.add('active');

            if (this.optionElements[this._value]) {
                this.elementOptions.style.top = '-' + (this.optionElements[this._value].offsetTop + 1) + 'px';
            } else {
                this.elementOptions.style.top = '-1px';
            }

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
    if (this.optionElements[this._value])
        this.optionElements[this._value].classList.remove('selected');

    this._value = value;
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
        if (this._link) {
            this._value = value;
            this.emit('change:before', value);
            if (! this._link.set(this.path, this._value)) {
                this._value = this._link.get(this.path);
                this.elementValue.textContent = this.options[this._value];
            }
        } else {
            if (this._value === value) return;
            if (this.options[value] === undefined) return;

            this._value = value;
            this.emit('change:before', this._value);
            this.elementValue.textContent = this.options[this._value];
            this.emit('change', this._value);
        }
    }
});


window.ui.SelectField = SelectField;
