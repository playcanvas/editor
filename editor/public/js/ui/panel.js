"use strict";

function Panel(header) {
    ui.ContainerElement.call(this);

    this.element = document.createElement('div');
    this.element.classList.add('ui-panel');

    // header
    this.headerElement = document.createElement('header');
    this.headerElement.classList.add('ui-header');
    this.headerElement.textContent = header || '';
    if (! this.headerElement.textContent) {
        this.class.add('noHeader');
    }
    this.element.appendChild(this.headerElement);

    // content
    this.innerElement = document.createElement('div');
    this.innerElement.classList.add('content');
    this.element.appendChild(this.innerElement);
}
Panel.prototype = Object.create(ui.ContainerElement.prototype);


Object.defineProperty(Panel.prototype, 'header', {
    get: function() {
        return this.headerElement.textContent;
    },
    set: function(value) {
        this.headerElement.textContent = value || '';

        if (! this.headerElement.textContent) {
            this.class.add('noHeader');
        } else {
            this.class.remove('noHeader');
        }
    }
})


window.ui.Panel = Panel;
