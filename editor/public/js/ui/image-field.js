"use strict";

function ImageField(args) {
    ui.Element.call(this);
    args = args || { };

    this.element = document.createElement('div');
    this.element.classList.add('ui-image-field', 'empty');

    this.elementImage = new Image();
    this.elementImage.classList.add('preview');
    this.element.appendChild(this.elementImage);

    this._value = 0;

    this.on('change', function() {
        if (! this.renderChanges)
            return;

        this.class.add('changed');
        setTimeout(this._onChangeDelay.bind(this), 200);
    });
}
ImageField.prototype = Object.create(ui.Element.prototype);


ImageField.prototype._onChangeDelay = function() {
    this.class.remove('changed');
};


ImageField.prototype._onLinkChange = function(value) {
    this._value = value;
    this.emit('change', value);
};


Object.defineProperty(ImageField.prototype, 'image', {
    get: function() {
        return this.elementImage.src;
    },
    set: function(value) {
        if (this.elementImage.src === value)
            return;

        if (! value) {
            this.class.add('empty');
        } else {
            this.class.remove('empty');
        }

        this.elementImage.src = value;
    }
});


Object.defineProperty(ImageField.prototype, 'value', {
    get: function() {
        if (this._link) {
            return this._link.get(this.path);
        } else {
            return this._value;
        }
    },
    set: function(value) {
        if (this._link) {
            if (! this._link.set(this.path, value))
                this._value = this._link.get(this.path)
        } else {
            value = parseInt(value, 10) || 0;
            if (this._value === value)
                return;

            this._value = value;
            this.emit('change', value);
        }
    }
});


window.ui.ImageField = ImageField;
