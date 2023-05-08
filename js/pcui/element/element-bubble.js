import { Element } from '@playcanvas/pcui';

const CLASS_ROOT = 'pcui-bubble';

class Bubble extends Element {
    constructor(args = {}) {
        super(args);

        this.class.add(CLASS_ROOT);

        const pulseCircle = document.createElement('div');
        pulseCircle.classList.add('pulse');
        this.dom.appendChild(pulseCircle);

        const centerCircle = document.createElement('div');
        centerCircle.classList.add('center');
        this.dom.appendChild(centerCircle);

        this.on('click', this._onClick);
    }

    _onClick() {
        if (this.class.contains('active')) {
            this.deactivate();
        } else {
            this.activate();
        }
    }

    activate() {
        this.class.add('active');
        this.emit('activate');
    }

    deactivate() {
        this.class.remove('active');
        this.emit('deactivate');
    }

    position(x = 0, y = 0) {
        this.style.left = (typeof x === 'number') ? x + 'px' : x;
        this.style.top = (typeof y === 'number') ? y + 'px' : y;
    }
}

export { Bubble };
