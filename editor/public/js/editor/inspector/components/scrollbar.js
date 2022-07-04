Object.assign(pcui, (function () {
    'use strict';

    const ATTRIBUTES = [{
        label: 'Orientation',
        path: 'components.scrollbar.orientation',
        type: 'select',
        args: {
            type: 'number',
            options: [{
                v: ORIENTATION_HORIZONTAL, t: 'Horizontal'
            }, {
                v: ORIENTATION_VERTICAL, t: 'Vertical'
            }]
        }
    }, {
        label: 'Value',
        path: 'components.scrollbar.value',
        type: 'number',
        args: {
            precision: 3,
            step: 0.01,
            min: 0,
            max: 1
        }
    }, {
        label: 'Handle',
        path: 'components.scrollbar.handleEntity',
        type: 'entity'
    }, {
        label: 'Handle Size',
        path: 'components.scrollbar.handleSize',
        type: 'number',
        args: {
            precision: 3,
            step: 0.01,
            min: 0,
            max: 1
        }
    }];

    ATTRIBUTES.forEach((attr) => {
        const parts = attr.path.split('.');
        attr.reference = `scrollbar:${parts[parts.length - 1]}`;
    });

    class ScrollbarComponentInspector extends pcui.ComponentInspector {
        constructor(args) {
            args = Object.assign({}, args);
            args.component = 'scrollbar';

            super(args);

            const attrs = utils.deepCopy(ATTRIBUTES);
            attrs.forEach((attr) => {
                if (attr.type === 'entity') {
                    attr.args = attr.args || {};
                    attr.args.entities = args.entities;
                }
            });

            this._attributesInspector = new pcui.AttributesInspector({
                history: args.history,
                entities: args.entities,
                attributes: attrs,
                templateOverridesInspector: this._templateOverridesInspector
            });
            this.append(this._attributesInspector);
        }

        link(entities) {
            super.link(entities);
            this._attributesInspector.link(entities);
        }

        unlink() {
            super.unlink();
            this._attributesInspector.unlink();
        }
    }

    return {
        ScrollbarComponentInspector: ScrollbarComponentInspector
    };
})());
