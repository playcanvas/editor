Object.assign(pcui, (function () {
    'use strict';

    const SelectInput = pcuiExternal.SelectInput;

    utils.implements(SelectInput, pcui.IBindable);
    utils.implements(SelectInput, pcui.IFocusable);

    pcui.Element.register('select', SelectInput, { renderChanges: true });
    pcui.Element.register('multiselect', SelectInput, { multiSelect: true, renderChanges: true });
    pcui.Element.register('tags', SelectInput, { allowInput: true, allowCreate: true, multiSelect: true, renderChanges: true });

    return {
        SelectInput: SelectInput
    };
})());
