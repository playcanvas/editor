import { Container, Element, SelectInput } from '@playcanvas/pcui';

/**
 * A multi-select input that keeps its dropdown open while selecting
 * or deselecting values.
 */
class MultiSelectInput extends SelectInput {
    private _toggling = false;

    protected _onSelectValue(value: any) {
        this._toggling = true;
        super._onSelectValue(value);
        queueMicrotask(() => {
            this._toggling = false;
        });
    }

    protected _removeTag(tagElement: Container, value: unknown) {
        this._toggling = true;
        super._removeTag(tagElement, value);
        queueMicrotask(() => {
            this._toggling = false;
        });
    }

    close() {
        if (this._toggling) {
            return;
        }
        super.close();
    }
}

// Override PCUI's default registrations so all multi-select
// and tags instances get the dropdown-stays-open behavior.
Element.register('multiselect', MultiSelectInput, { multiSelect: true, renderChanges: true });
Element.register('tags', MultiSelectInput, { allowInput: true, allowCreate: true, multiSelect: true, renderChanges: true });

export { MultiSelectInput };
