import type { ElementArgs } from '@playcanvas/pcui';
import { Container, Element, SelectInput } from '@playcanvas/pcui';
import { SHADOW_CASCADE_0, SHADOW_CASCADE_1, SHADOW_CASCADE_2, SHADOW_CASCADE_3, SHADOW_CASCADE_ALL } from 'playcanvas';

const CASCADES = [SHADOW_CASCADE_0, SHADOW_CASCADE_1, SHADOW_CASCADE_2, SHADOW_CASCADE_3];
const CASCADE_MASK = CASCADES.reduce((mask, bit) => mask | bit, 0);
const CASCADE_OPTIONS = CASCADES.map((v, i) => ({ v, t: `Cascade ${i}` }));

type ShadowCascadeMaskInputArgs = ElementArgs & {
    renderChanges?: boolean;
};

class CascadeSelectInput extends SelectInput {
    get selections() {
        return (this._values ?? [this.value]).map((values) => values?.slice() ?? []);
    }
}

class ShadowCascadeMaskInput extends Container {
    private _input: CascadeSelectInput;

    private _values: number[];

    private _updating = false;

    private _renderChanges = false;

    constructor(args: ShadowCascadeMaskInputArgs = {}) {
        super(args);

        this._values = [SHADOW_CASCADE_ALL];
        this._renderChanges = args.renderChanges ?? false;
        this._input = new CascadeSelectInput({
            multiSelect: true,
            options: CASCADE_OPTIONS,
            type: 'number'
        });
        this._input.style.width = '100%';
        this.append(this._input);

        this._input.on('change', () => {
            if (this._updating) {
                return;
            }

            const selections = this._input.selections;
            const values = this._values.map((mask, i) =>
                (selections[i] ?? selections[0]).reduce((value, bit) => value | bit, mask & ~CASCADE_MASK)
            );
            this._setValues(values);
            if (this._renderChanges) {
                this.flash();
            }
            this.emit('change', values[0]);
            this._binding?.setValues(values);
        });

        this.value = SHADOW_CASCADE_ALL;
    }

    private _setValues(values: number[]) {
        this._values = values;
        this._updating = true;
        this._input.values = values.map((mask) => CASCADES.filter((bit) => mask & bit));
        this._updating = false;
    }

    set value(value: number | null) {
        const mask = value ?? SHADOW_CASCADE_ALL;
        const changed = this._values.length !== 1 || this._values[0] !== mask;
        this._setValues([mask]);
        if (changed) {
            this.emit('change', mask);
            this._binding?.setValue(mask);
        }
    }

    get value() {
        return this._values[0];
    }

    set values(values: (number | null)[]) {
        this._setValues(values.map((value) => value ?? SHADOW_CASCADE_ALL));
    }

    get values() {
        return this._values.slice();
    }

    set renderChanges(value: boolean) {
        this._renderChanges = value;
    }

    get renderChanges() {
        return this._renderChanges;
    }
}

Element.register('shadow-cascade-mask', ShadowCascadeMaskInput, { renderChanges: true });

export { ShadowCascadeMaskInput };
