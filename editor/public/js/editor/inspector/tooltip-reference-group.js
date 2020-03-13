Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'tooltip-reference-group';

    class TooltipReferenceGroup extends pcui.TooltipGroup {
        constructor(args) {
            super(args);

            this.class.add(CLASS_ROOT);

            this.reference = args.reference;
        }

        get reference() {
            return this._reference;
        }

        set reference(value) {
            this._reference = value;

            if (value) {
                this._referenceTooltip = new pcui.Tooltip({

                });
            }

            this.title = this._reference.title || '';
            this.subTitle = this._reference.subTitle || '';
            this.description = this._reference.description || '';
        }

        get templateOverride() {
            return this._templateOverride;
        }

        set templateOverride(value) {
            this._templateOverride = value;
        }
    }

    return {
        TooltipReferenceGroup: TooltipReferenceGroup
    };
})());
