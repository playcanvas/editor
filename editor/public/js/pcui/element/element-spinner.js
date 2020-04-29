Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'pcui-spinner';

    function createSpinnerTemplate(size) {
        const spinner = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        spinner.classList.add('spin');
        spinner.setAttribute('width', size);
        spinner.setAttribute('height', size);
        spinner.setAttribute('x', 0);
        spinner.setAttribute('y', 0);
        spinner.setAttribute('viewBox', '0 0 64 64');
        return spinner;
    }

    function createSmallThick(size) {
        const spinner = createSpinnerTemplate(size);
        spinner.innerHTML = '<g width="65" height="65"><path fill="#773417" d="M31,62A31,31,0,1,1,62,31,31,31,0,0,1,31,62Zm0-52A21,21,0,1,0,52,31,21,21,0,0,0,31,10Z"/><path class="spin" fill="#f60" d="M31,62V52A21,21,0,0,0,52,31H62A31,31,0,0,1,31,62Z"/></g>';
        return spinner;
    }

    class Spinner extends pcui.Element {
        constructor(args) {
            args = Object.assign({
                type: Spinner.TYPE_SMALL_THICK
            }, args);

            let dom = null;

            if (args.type === Spinner.TYPE_SMALL_THICK) {
                dom = createSmallThick(args.size || 12);
            }

            super(dom, args);

            this.class.add(CLASS_ROOT);
        }
    }

    Spinner.TYPE_SMALL_THICK = 'small-thick';
    // add more types here

    return {
        Spinner: Spinner
    };
})());
