"use strict";

function Code() {
    ui.ContainerElement.call(this);

    this.element = document.createElement('pre');
    this._element.classList.add('ui-code');
}
Code.prototype = Object.create(ui.ContainerElement.prototype);


Object.defineProperty(Code.prototype, 'text', {
    get: function() {
        return this._element.textContent;
    },
    set: function(value) {
        this._element.textContent = value;
    }
});


window.ui.Code = Code;
