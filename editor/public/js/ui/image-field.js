"use strict";

function ImageField(args) {
    var self = this;
    ui.Element.call(this);
    args = args || { };

    this.element = document.createElement('div');
    this.element.tabIndex = 0;
    this.element.classList.add('ui-image-field', 'empty');

    this.elementImage = new Image();
    this.elementImage.classList.add('preview');
    this.element.appendChild(this.elementImage);

    this.elementClear = document.createElement('span');
    this.elementClear.classList.add('clear');
    this.elementClear.addEventListener('click', function(evt) {
        if (self.disabled)
            return;
        self.value = null;
        evt.stopPropagation();
    }, false);
    this.element.appendChild(this.elementClear);

    this._value = null;

    this.on('change', function() {
        if (! this.renderChanges)
            return;

        this.flash();
    });

    // space > click
    this.element.addEventListener('keydown', function(evt) {
        if (evt.keyCode !== 32 || self.disabled)
            return;

        evt.stopPropagation();
        evt.preventDefault();
        self.emit('click');
    }, false);
}
ImageField.prototype = Object.create(ui.Element.prototype);


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

        this.elementImage.src = value;
    }
});


Object.defineProperty(ImageField.prototype, 'empty', {
    get: function() {
        return this.class.contains('empty');
    },
    set: function(value) {
        if (this.class.contains('empty') === !! value)
            return;

        if (value) {
            this.class.add('empty');
            this.image = '';
        } else {
            this.class.remove('empty');
        }
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
            value = (value && parseInt(value, 10)) || null;
            if (this._value === value)
                return;

            this._value = value;
            this.emit('change', value);
        }
    }
});


window.ui.ImageField = ImageField;
