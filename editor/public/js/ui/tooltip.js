"use strict";

function Tooltip(args) {
    var self = this;

    args = args || { };
    ui.ContainerElement.call(this);

    this.element = document.createElement('div');
    this.element.classList.add('ui-tooltip', 'align-left');

    this.innerElement = document.createElement('div');
    this.innerElement.classList.add('inner');
    this.element.appendChild(this.innerElement);

    this.hoverable = args.hoverable || false;

    this.x = args.x || 0;
    this.y = args.y || 0;

    this._align = 'left';
    this.align = args.align || 'left';

    this.on('show', this._reflow);
    this.hidden = args.hidden !== undefined ? args.hidden : true;
    this.text = args.text || '';

    this.element.addEventListener('mouseover', function() {
        if (! self.hoverable)
            return;

        self.hidden = false;
    }, false);
    this.element.addEventListener('mouseleave', function() {
        if (! self.hoverable)
            return;

        self.hidden = true;
    }, false);
}
Tooltip.prototype = Object.create(ui.ContainerElement.prototype);


Object.defineProperty(Tooltip.prototype, 'align', {
    get: function() {
        return this._align;
    },
    set: function(value) {
        if (this._align === value)
            return;

        this.class.remove('align-' + this._align);
        this._align = value;
        this.class.add('align-' + this._align);

        this._reflow();
    }
});


Object.defineProperty(Tooltip.prototype, 'text', {
    get: function() {
        return this.innerElement.textContent;
    },
    set: function(value) {
        if (this.innerElement.textContent === value)
            return;

        this.innerElement.textContent = value;
    }
});


Object.defineProperty(Tooltip.prototype, 'html', {
    get: function() {
        return this.innerElement.innerHTML;
    },
    set: function(value) {
        if (this.innerElement.innerHTML === value)
            return;

        this.innerElement.innerHTML = value;
    }
});


Tooltip.prototype._reflow = function() {
    if (this.hidden)
        return;

    this.element.style.top = '';
    this.element.style.right = '';
    this.element.style.bottom = '';
    this.element.style.left = '';

    this.element.style.display = 'block';

    switch(this._align) {
        case 'top':
            this.element.style.top = this.y + 'px';
            this.element.style.left = this.x + 'px';
            break;
        case 'right':
            this.element.style.top = this.y + 'px';
            this.element.style.right = 'calc(100% - ' + this.x + 'px)';
            break;
        case 'bottom':
            this.element.style.bottom = 'calc(100% - ' + this.y + 'px)';
            this.element.style.left = this.x + 'px';
            break;
        case 'left':
            this.element.style.top = this.y + 'px';
            this.element.style.left = this.x + 'px';
            break;
    }

    this.element.style.display = '';
};


Tooltip.prototype.position = function(x, y) {
    x = Math.floor(x);
    y = Math.floor(y);

    if (this.x === x && this.y === y)
        return;

    this.x = x;
    this.y = y;

    this._reflow();
};


Tooltip.attach = function(args) {
    var item = new ui.Tooltip({
        text: args.text || '',
        align: args.align
    });

    args.target.on('hover', function() {
        var rect = args.target.element.getBoundingClientRect();

        switch(item.align) {
            case 'top':
                item.position(rect.left + rect.width / 2, rect.bottom);
                break;
            case 'right':
                item.position(rect.left, rect.top + rect.height / 2);
                break;
            case 'bottom':
                item.position(rect.left + rect.width / 2, rect.top);
                break;
            case 'left':
                item.position(rect.right, rect.top + rect.height / 2);
                break;
        }

        item.hidden = false;
    });

    args.target.on('blur', function() {
        item.hidden = true;
    });

    args.root.append(item);

    return item;
};


window.ui.Tooltip = Tooltip;
