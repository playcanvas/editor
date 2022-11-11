Object.assign(pcui, (function () {
    'use strict';

    const ATTRIBUTES = [{
        label: 'Orientation',
        path: 'components.layoutgroup.orientation',
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
        label: 'Reverse X',
        path: 'components.layoutgroup.reverseX',
        type: 'boolean'
    }, {
        label: 'Reverse Y',
        path: 'components.layoutgroup.reverseY',
        type: 'boolean'
    }, {
        label: 'Alignment',
        path: 'components.layoutgroup.alignment',
        type: 'vec2',
        args: {
            placeholder: ['↔', '↕'],
            precision: 2,
            step: 0.1,
            min: 0,
            max: 1
        }
    }, {
        label: 'Padding',
        path: 'components.layoutgroup.padding',
        type: 'vec4',
        args: {
            placeholder: ['←', '↓', '→', '↑']
        }
    }, {
        label: 'Spacing',
        path: 'components.layoutgroup.spacing',
        type: 'vec2',
        args: {
            placeholder: ['↔', '↕']
        }
    }, {
        label: 'Width Fitting',
        path: 'components.layoutgroup.widthFitting',
        type: 'select',
        args: {
            type: 'number',
            options: [{
                v: FITTING_NONE, t: 'None'
            }, {
                v: FITTING_STRETCH, t: 'Stretch'
            }, {
                v: FITTING_SHRINK, t: 'Shrink'
            }, {
                v: FITTING_BOTH, t: 'Both'
            }]
        }
    }, {
        label: 'Height Fitting',
        path: 'components.layoutgroup.heightFitting',
        type: 'select',
        args: {
            type: 'number',
            options: [{
                v: FITTING_NONE, t: 'None'
            }, {
                v: FITTING_STRETCH, t: 'Stretch'
            }, {
                v: FITTING_SHRINK, t: 'Shrink'
            }, {
                v: FITTING_BOTH, t: 'Both'
            }]
        }
    }, {
        label: 'Wrap',
        path: 'components.layoutgroup.wrap',
        type: 'boolean'
    }];

    ATTRIBUTES.forEach((attr) => {
        const parts = attr.path.split('.');
        attr.reference = `layoutgroup:${parts[parts.length - 1]}`;
    });

    class LayoutgroupComponentInspector extends pcui.ComponentInspector {
        constructor(args) {
            args = Object.assign({}, args);
            args.component = 'layoutgroup';

            super(args);

            this._attributesInspector = new pcui.AttributesInspector({
                history: args.history,
                attributes: ATTRIBUTES,
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
        LayoutgroupComponentInspector: LayoutgroupComponentInspector
    };
})());
