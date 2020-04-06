Object.assign(pcui, (function () {
    'use strict';

    const CLASS_CELL = 'pcui-table-cell';

    class TableCell extends pcui.Container {
        constructor(args) {
            let dom;
            if (args && args.header) {
                dom = document.createElement('th');
                dom.setAttribute('scope', 'col');
            } else {
                dom = document.createElement('td');
            }

            args = Object.assign({
                dom: dom
            }, args);

            super(args);

            this.class.add(CLASS_CELL);
        }
    }

    return {
        TableCell: TableCell
    };
})());
