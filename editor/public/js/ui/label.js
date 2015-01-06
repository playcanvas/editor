"use strict";

function Label(text) {
    ui.Element.call(this);

    this._text = text || '';

    this.element = document.createElement('label');
    this.element.classList.add('ui-label');
    this.element.innerHTML = this._text;
}
Label.prototype = Object.create(ui.Element.prototype);


Label.prototype._onLinkChange = function(value) {
    this.text = value;
};


Object.defineProperty(Label.prototype, 'text', {
    get: function() {
        return this._text;
    },
    set: function(value) {
        if (this._text === value) return;
        this._text = value;
        this.element.innerHTML = this._text;
    }
});


// Object.defineProperty(Label.prototype, 'value', {
//     get: function() {
//         return this.text;
//     },
//     set: function(value) {
//         this.text = value;
//     }
// });


window.ui.Label = Label;
