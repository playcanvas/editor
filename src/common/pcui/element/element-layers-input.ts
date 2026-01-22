import type { Observer } from '@playcanvas/observer';
import { Element, SelectInput, SelectInputArgs } from '@playcanvas/pcui';

const CLASS_ROOT = 'pcui-layers-input';

/**
 * The arguments for the {@link LayersInput} constructor.
 */
interface LayersInputArgs extends SelectInputArgs {
    /** The project settings observer */
    projectSettings?: Observer;
    /** Layer IDs to exclude from the options */
    excludeLayers?: number[];
}

/**
 * A select input for choosing layers.
 */
class LayersInput extends SelectInput {
    private _projectSettings?: Observer;

    private _excludeLayers: number[];

    constructor(args: LayersInputArgs = {}) {
        const selectArgs: LayersInputArgs = {
            ...args,
            multiSelect: true,
            options: [],
            type: 'number'
        };

        super(selectArgs);

        this.class.add(CLASS_ROOT);

        this._projectSettings = args.projectSettings;

        this._excludeLayers = args.excludeLayers ? args.excludeLayers.slice() : [];

        this._updateOptions();
    }

    protected _updateOptions() {
        const options: { v: number, t: string }[] = [];
        const layers = this._projectSettings?.get('layers');

        if (layers) {
            this._excludeLayers.forEach((id) => {
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

    link(observers: Observer | Observer[], paths: string | string[]) {
        // order is important here
        // we have to update the options first
        // and then link because updating options
        // hides tags
        this._updateOptions();
        super.link(observers, paths);
    }
}

Element.register('layers', LayersInput, { renderChanges: true });

export { LayersInput };
