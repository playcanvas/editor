Object.assign(pcui, (function () {
    'use strict';

    const ATTRIBUTES = [{
        label: 'Scroll Mode',
        path: 'components.scrollview.scrollMode',
        type: 'select',
        args: {
            type: 'number',
            options: [{
                v: SCROLL_MODE_CLAMP, t: 'Clamp'
            }, {
                v: SCROLL_MODE_BOUNCE, t: 'Bounce'
            }, {
                v: SCROLL_MODE_INFINITE, t: 'Infinite'
            }]
        }
    }, {
        label: 'Bounce',
        path: 'components.scrollview.bounceAmount',
        type: 'number',
        args: {
            precision: 3,
            step: 0.01,
            min: 0,
            max: 10
        }
    }, {
        label: 'Friction',
        path: 'components.scrollview.friction',
        type: 'number',
        args: {
            precision: 3,
            step: 0.01,
            min: 0,
            max: 10
        }
    }, {
        label: 'Viewport',
        path: 'components.scrollview.viewportEntity',
        type: 'entity'
    }, {
        label: 'Content',
        path: 'components.scrollview.contentEntity',
        type: 'entity'
    }, {
        type: 'divider'
    }, {
        label: 'Horizontal',
        path: 'components.scrollview.horizontal',
        type: 'boolean'
    }, {
        label: 'Scrollbar',
        path: 'components.scrollview.horizontalScrollbarEntity',
        type: 'entity'
    }, {
        label: 'Visibility',
        path: 'components.scrollview.horizontalScrollbarVisibility',
        type: 'select',
        args: {
            type: 'number',
            options: [{
                v: SCROLLBAR_VISIBILITY_SHOW_ALWAYS, t: 'Show Always'
            }, {
                v: SCROLLBAR_VISIBILITY_SHOW_WHEN_REQUIRED, t: 'Show When Required'
            }]
        }
    }, {
        type: 'divider'
    }, {
        label: 'Vertical',
        path: 'components.scrollview.vertical',
        type: 'boolean'
    }, {
        label: 'Scrollbar',
        path: 'components.scrollview.verticalScrollbarEntity',
        type: 'entity'
    }, {
        label: 'Visibility',
        path: 'components.scrollview.verticalScrollbarVisibility',
        type: 'select',
        args: {
            type: 'number',
            options: [{
                v: SCROLLBAR_VISIBILITY_SHOW_ALWAYS, t: 'Show Always'
            }, {
                v: SCROLLBAR_VISIBILITY_SHOW_WHEN_REQUIRED, t: 'Show When Required'
            }]
        }
    }];

    ATTRIBUTES.forEach(attr => {
        if (!attr.path) return;
        const parts = attr.path.split('.');
        attr.reference = `scrollview:${parts[parts.length - 1]}`;
    });

    class ScrollviewComponentInspector extends pcui.ComponentInspector {
        constructor(args) {
            args = Object.assign({}, args);
            args.component = 'scrollview';

            super(args);

            const attrs = utils.deepCopy(ATTRIBUTES);
            attrs.forEach(attr => {
                if (attr.type === 'entity') {
                    attr.args = attr.args || {};
                    attr.args.entities = args.entities;
                }
            });

            this._attributesInspector = new pcui.AttributesInspector({
                entities: args.entities,
                history: args.history,
                attributes: attrs,
                templateOverridesInspector: this._templateOverridesInspector
            });
            this.append(this._attributesInspector);

            ['scrollMode', 'vertical', 'horizontal'].forEach(field => {
                this._field(field).on('change', this._toggleFields.bind(this));
            });

            this._suppressToggleFields = false;
        }

        _field(name) {
            return this._attributesInspector.getField(`components.scrollview.${name}`);
        }

        _toggleFields() {
            if (this._suppressToggleFields) return;

            const isBounceMode = this._field('scrollMode').value === SCROLL_MODE_BOUNCE;
            const verticalScrollingEnabled = this._field('vertical').value === true;
            const horizontalScrollingEnabled = this._field('horizontal').value === true;

            this._field('bounceAmount').parent.hidden = !isBounceMode;
            this._field('verticalScrollbarEntity').parent.hidden = !verticalScrollingEnabled;
            this._field('verticalScrollbarVisibility').parent.hidden = !verticalScrollingEnabled;
            this._field('horizontalScrollbarEntity').parent.hidden = !horizontalScrollingEnabled;
            this._field('horizontalScrollbarVisibility').parent.hidden = !horizontalScrollingEnabled;
        }

        link(entities) {
            super.link(entities);
            this._suppressToggleFields = true;
            this._attributesInspector.link(entities);
            this._suppressToggleFields = false;
            this._toggleFields();
        }

        unlink() {
            super.unlink();
            this._attributesInspector.unlink();
        }
    }

    return {
        ScrollviewComponentInspector: ScrollviewComponentInspector
    };
})());
