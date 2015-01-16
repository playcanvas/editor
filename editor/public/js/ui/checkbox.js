"use strict";

function Checkbox(args) {
    ui.Element.call(this);
    args = args || { };

    this._text = args.text || '';

    this.element = document.createElement('div');
    this.element.classList.add('ui-checkbox', 'noSelect');
    // this.element.innerHTML = this._text;

    this.on('click', this._onClick.bind(this));

    this.on('change', function() {
        if (! this.renderChanges)
            return;

        this.class.add('changed');
        setTimeout(this._onChangeDelay.bind(this), 200);
    });
}
Checkbox.prototype = Object.create(ui.Element.prototype);


Checkbox.prototype._onChangeDelay = function() {
    this.class.remove('changed');
};


Checkbox.prototype._onLinkChange = function(value) {
    if (value) {
        this.element.classList.add('checked');
    } else {
        this.element.classList.remove('checked');
    }
    this.emit('change', value);
};


Checkbox.prototype._onClick = function(evt) {
    this.value = ! this.value;
};


Object.defineProperty(Checkbox.prototype, 'value', {
    get: function() {
        if (this._link) {
            return this._link.get(this.path);
        } else {
            return this.element.classList.contains('checked');
        }
    },
    set: function(value) {
        if (this._link) {
            this._link.set(this.path, value);
        } else {
            if (this.element.classList.contains('checked') !== value) {
                if (value) {
                    this.element.classList.add('checked');
                } else {
                    this.element.classList.remove('checked');
                }
                this.emit('change', value);
            }
        }
    }
});


window.ui.Checkbox = Checkbox;
