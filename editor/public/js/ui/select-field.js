"use strict";

function SelectField(args) {
    ui.Element.call(this);
    args = args || { };

    this.options = args.options || [ ];

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

            var value = this.elementValue.textContent;
            if (this.optionElements[value]) {
                this.elementOptions.style.top = '-' + (this.optionElements[value].offsetTop + 1) + 'px';
            } else {
                this.elementOptions.style.top = '0';
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

    if (args.default !== undefined && this.options.indexOf(args.default)) {
        this._value = args.default;
    }

    this._optionSelectHandler = null;

    this.on('link', function(path) {
        if (this._link.schema && this._link.schema.has(path)) {
            var field = this._link.schema.get(path);
            var options = field.options || [ ];
            this._updateOptions(options);
        } else {
            this.element.textContent = '?';
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

    for(var i = 0; i < this.options.length; i++) {
        var element = document.createElement('li');
        element.textContent = this.options[i];
        element.uiElement = this;
        element.uiValue = this.options[i];
        element.addEventListener('click', this._onOptionSelect);
        this.elementOptions.appendChild(element);
        this.optionElements[this.options[i]] = element;
    }
};

SelectField.prototype._onOptionSelect = function() {
    var self = this.uiElement;
    self.value = this.uiValue;
};

SelectField.prototype._onLinkChange = function(value) {
    if (this.optionElements[this.elementValue.textContent])
        this.optionElements[this.elementValue.textContent].classList.remove('selected');

    this.elementValue.textContent = value;
    this.optionElements[value].classList.add('selected');
};

Object.defineProperty(SelectField.prototype, 'value', {
    get: function() {
        if (this._link) {
            return this._link.get(this.path);
        } else {
            return this.elementValue.textContent;
        }
    },
    set: function(value) {
        if (this._link) {
            if (this._link.set(this.path, value)) {
                this.emit('change', this._link.get(this.path));
            } else {
                this.elementValue.textContent = this._link.get(this.path);
            }
        } else {
            if (this.elementValue.textContent === value) return;
            if (this.options.indexOf(value) === -1) return;

            this.elementValue.textContent = value;
            this.emit('change', value);
        }
    }
});


window.ui.SelectField = SelectField;
