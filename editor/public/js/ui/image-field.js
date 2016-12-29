"use strict";

function ImageField(args) {
    var self = this;
    ui.Element.call(this);
    args = args || { };

    this.element = document.createElement('div');
    this._element.tabIndex = 0;
    this._element.classList.add('ui-image-field', 'empty');

    if (args.canvas) {
        this.elementImage = document.createElement('canvas');
        this.elementImage.width = 64;
        this.elementImage.height = 64;
    } else {
        this.elementImage = new Image();
    }

    this.elementImage.classList.add('preview');
    this._element.appendChild(this.elementImage);

    this._value = null;

    this._element.removeEventListener('click', this._evtClick);
    this._element.addEventListener('click', this._onClick, false);
    this.on('change', this._onChange);

    // space > click
    this._element.addEventListener('keydown', this._onKeyDown, false);
}
ImageField.prototype = Object.create(ui.Element.prototype);


ImageField.prototype._onClick = function() {
    this.ui.emit('click', evt);
};

ImageField.prototype._onChange = function() {
    if (! this.renderChanges)
        return;

    this.flash();
};

ImageField.prototype._onKeyDown = function(evt) {
    if (evt.keyCode === 27)
        return this.blur();

    if (evt.keyCode !== 32 || this.ui.disabled)
        return;

    evt.stopPropagation();
    evt.preventDefault();
    this.ui.emit('pick');
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
        value = value && parseInt(value, 10) || null;

        if (this._link) {
            if (! this._link.set(this.path, value))
                this._value = this._link.get(this.path);
        } else {
            if (this._value === value && ! this.class.contains('null'))
                return;

            this._value = value;
            this.emit('change', value);
        }
    }
});


window.ui.ImageField = ImageField;
