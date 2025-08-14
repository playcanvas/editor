import { LegacyContainer } from './container.ts';

class LegacyTooltip extends LegacyContainer {
    constructor(args = {}) {
        super();
        this.element = document.createElement('div');
        this._element.classList.add('ui-tooltip', 'align-left');
        if (args.class) {
            this._element.classList.add(args.class);
        }

        this.innerElement = document.createElement('div');
        this.innerElement.classList.add('inner');
        this._element.appendChild(this.innerElement);

        this.arrow = document.createElement('div');
        this.arrow.classList.add('arrow');
        this._element.appendChild(this.arrow);

        this.hoverable = args.hoverable || false;

        this.x = args.x || 0;
        this.y = args.y || 0;

        this._align = 'left';
        this.align = args.align || 'left';

        this.on('show', this._reflow.bind(this));
        this.hidden = args.hidden !== undefined ? args.hidden : true;
        if (args.html) {
            this.html = args.html;
        } else {
            this.text = args.text || '';
        }

        this._element.addEventListener('mouseover', this._onMouseOver.bind(this), false);
        this._element.addEventListener('mouseleave', this._onMouseLeave.bind(this), false);
    }

    set align(value) {
        if (this._align === value) {
            return;
        }

        this.class.remove(`align-${this._align}`);
        this._align = value;
        this.class.add(`align-${this._align}`);

        this._reflow();
    }

    get align() {
        return this._align;
    }

    set flip(value) {
        if (this.class.contains('flip') === value) {
            return;
        }

        if (value) {
            this.class.add('flip');
        } else {
            this.class.remove('flip');
        }

        this._reflow();
    }

    get flip() {
        return this.class.contains('flip');
    }

    set text(value) {
        if (this.innerElement.textContent === value) {
            return;
        }

        this.innerElement.textContent = value;
    }

    get text() {
        return this.innerElement.textContent;
    }

    set html(value) {
        if (this.innerElement.innerHTML === value) {
            return;
        }

        this.innerElement.innerHTML = value;
    }

    get html() {
        return this.innerElement.innerHTML;
    }

    _onMouseOver(evt) {
        if (!this.hoverable) {
            return;
        }

        this.hidden = false;
        this.emit('hover', evt);
    }

    _onMouseLeave() {
        if (!this.hoverable) {
            return;
        }

        this.hidden = true;
    }

    _reflow() {
        if (this.hidden) {
            return;
        }

        this._element.style.top = '';
        this._element.style.right = '';
        this._element.style.bottom = '';
        this._element.style.left = '';

        this.arrow.style.top = '';
        this.arrow.style.right = '';
        this.arrow.style.bottom = '';
        this.arrow.style.left = '';

        this._element.style.display = 'block';

        switch (this._align) {
            case 'top':
                this._element.style.top = `${this.y}px`;
                if (this.flip) {
                    this._element.style.right = `calc(100% - ${this.x}px)`;
                } else {
                    this._element.style.left = `${this.x}px`;
                }
                break;
            case 'right':
                this._element.style.top = `${this.y}px`;
                this._element.style.right = `calc(100% - ${this.x}px)`;
                break;
            case 'bottom':
                this._element.style.bottom = `calc(100% - ${this.y}px)`;
                if (this.flip) {
                    this._element.style.right = `calc(100% - ${this.x}px)`;
                } else {
                    this._element.style.left = `${this.x}px`;
                }
                break;
            case 'left':
                this._element.style.top = `${this.y}px`;
                this._element.style.left = `${this.x}px`;
                break;
        }

        const rect = this._element.getBoundingClientRect();

        if (rect.left < 0) {
            this._element.style.left = '0px';
            this._element.style.right = '';
        }
        if (rect.top < 0) {
            this._element.style.top = '0px';
            this._element.style.bottom = '';
        }
        if (rect.right > window.innerWidth) {
            this._element.style.right = '0px';
            this._element.style.left = '';
            this.arrow.style.left = `${Math.floor(rect.right - window.innerWidth + 8)}px`;
        }
        if (rect.bottom > window.innerHeight) {
            this._element.style.bottom = '0px';
            this._element.style.top = '';
            this.arrow.style.top = `${Math.floor(rect.bottom - window.innerHeight + 8)}px`;
        }

        this._element.style.display = '';
    }

    position(x, y) {
        x = Math.floor(x);
        y = Math.floor(y);

        if (this.x === x && this.y === y) {
            return;
        }

        this.x = x;
        this.y = y;

        this._reflow();
    }

    static attach(args) {
        const data = {
            align: args.align,
            hoverable: args.hoverable,
            class: args.class ?? null
        };

        if (args.html) {
            data.html = args.html;
        } else {
            data.text = args.text || '';
        }

        const item = new LegacyTooltip(data);

        const evtHover = () => {
            const rect = args.target.getBoundingClientRect();
            let off = 16;

            switch (item.align) {
                case 'top':
                    if (rect.width < 64) {
                        off = rect.width / 2;
                    }
                    item.flip = rect.left + off > window.innerWidth / 2;
                    if (item.flip) {
                        item.position(rect.right - off, rect.bottom);
                    } else {
                        item.position(rect.left + off, rect.bottom);
                    }
                    break;
                case 'right':
                    if (rect.height < 64) {
                        off = rect.height / 2;
                    }
                    item.flip = false;
                    item.position(rect.left, rect.top + off);
                    break;
                case 'bottom':
                    if (rect.width < 64) {
                        off = rect.width / 2;
                    }
                    item.flip = rect.left + off > window.innerWidth / 2;
                    if (item.flip) {
                        item.position(rect.right - off, rect.top);
                    } else {
                        item.position(rect.left + off, rect.top);
                    }
                    break;
                case 'left':
                    if (rect.height < 64) {
                        off = rect.height / 2;
                    }
                    item.flip = false;
                    item.position(rect.right, rect.top + off);
                    break;
            }

            item.hidden = false;
        };

        const evtBlur = () => {
            item.hidden = true;
        };

        args.target.addEventListener('mouseover', evtHover, false);
        args.target.addEventListener('mouseout', evtBlur, false);

        item.on('destroy', () => {
            args.target.removeEventListener('mouseover', evtHover);
            args.target.removeEventListener('mouseout', evtBlur);
        });

        args.root.append(item);

        return item;
    }
}

export { LegacyTooltip };
