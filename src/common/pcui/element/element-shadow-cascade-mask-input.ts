import type { ElementArgs } from '@playcanvas/pcui';
import { BooleanInput, Container, Element, Label } from '@playcanvas/pcui';
import { SHADOW_CASCADE_0, SHADOW_CASCADE_1, SHADOW_CASCADE_2, SHADOW_CASCADE_3, SHADOW_CASCADE_ALL } from 'playcanvas';

const CASCADES = [SHADOW_CASCADE_0, SHADOW_CASCADE_1, SHADOW_CASCADE_2, SHADOW_CASCADE_3];

type ShadowCascadeMaskInputArgs = ElementArgs & {
    renderChanges?: boolean;
};

class ShadowCascadeMaskInput extends Container {
    private _inputs: BooleanInput[];

    private _values: number[];

    private _updating = false;

    private _renderChanges = false;

    constructor(args: ShadowCascadeMaskInputArgs = {}) {
        super({
            ...args,
            flex: true,
            flexDirection: 'row',
            alignItems: 'center'
        });

        this._values = [SHADOW_CASCADE_ALL];
        this._renderChanges = args.renderChanges ?? false;
        this._inputs = CASCADES.map((bit, i) => {
            const input = new BooleanInput();
            const group = new Container({ flex: true, flexDirection: 'row', alignItems: 'center' });
            group.append(new Label({ text: `${i}` }));
            group.append(input);
            this.append(group);

            input.on('change', (value: boolean | null) => {
                if (this._updating || value === null) {
                    return;
                }

                const values = this._values.map((mask) => (value ? mask | bit : mask & ~bit));
                this._setValues(values);
                if (this._renderChanges) {
                    this.flash();
                }
                this.emit('change', values[0]);
                this._binding?.setValues(values);
            });

            return input;
        });

        this.value = SHADOW_CASCADE_ALL;
    }

    private _setValues(values: number[]) {
        this._values = values;
        this._updating = true;
        this._inputs.forEach((input, i) => {
            input.values = values.map((mask) => !!(mask & CASCADES[i]));
        });
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
