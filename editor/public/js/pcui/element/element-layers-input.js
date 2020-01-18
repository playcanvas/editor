Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'pcui-layers-input';

    class LayersInput extends pcui.SelectInput {
        constructor(args) {
            if (!args) args = {};

            args.multiSelect = true;
            args.options = [];
            args.type = 'number';

            super(args);

            this.class.add(CLASS_ROOT);

            this._projectSettings = args.projectSettings;

            this._excludeLayers = (args.excludeLayers ? args.excludeLayers.slice() : []);

            this._updateOptions();
        }

        _updateOptions() {
            const options = [];
            const layers = this._projectSettings.get('layers');

            if (layers) {
                this._excludeLayers.forEach(id => {
                    delete layers[id];
                });

                for (const key in layers) {
                    options.push({
                        v: parseInt(key, 10), t: layers[key].name
                    });
                }
            }


            this.options = options;
        }

        link(observers, paths) {
            // order is important here
            // we have to update the options first
            // and then link because updating options
            // hides tags
            this._updateOptions();
            super.link(observers, paths);
        }
    }

    pcui.Element.register('layers', LayersInput, { renderChanges: true });

    return {
        LayersInput: LayersInput
    };
})());
