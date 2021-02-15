Object.assign(pcui, (function () {
    'use strict';

    const Element = pcuiExternal.Element;
    const ArrayInput = pcuiExternal.ArrayInput;
    for (const name in pcui.DEFAULTS) {
        if (!ArrayInput.DEFAULTS.hasOwnProperty(name)) {
            Element.register(`array:${name}`, ArrayInput, { type: name, renderChanges: true });
        }
        ArrayInput.DEFAULTS[name] = utils.deepCopy(pcui.DEFAULTS[name]);

    }

    return {
        Element: Element,
        ArrayInput: ArrayInput,
        BooleanInput: pcuiExternal.BooleanInput,
        Button: pcuiExternal.Button,
        Code: pcuiExternal.Code,
        Container: pcuiExternal.Container,
        ContextMenu: pcuiExternal.ContextMenu,
        Divider: pcuiExternal.Divider,
        InfoBox: pcuiExternal.InfoBox,
        Label: pcuiExternal.Label,
        LabelGroup: pcuiExternal.LabelGroup,
        NumericInput: pcuiExternal.NumericInput,
        Overlay: pcuiExternal.Overlay,
        Panel: pcuiExternal.Panel,
        Progress: pcuiExternal.Progress,
        SelectInput: pcuiExternal.SelectInput,
        SliderInput: pcuiExternal.SliderInput,
        Spinner: pcuiExternal.Spinner,
        TextAreaInput: pcuiExternal.TextAreaInput,
        TextInput: pcuiExternal.TextInput,
        TreeViewItem: pcuiExternal.TreeViewItem,
        TreeView: pcuiExternal.TreeView,
        GridView: pcuiExternal.GridView,
        GridViewItem: pcuiExternal.GridViewItem,
        VectorInput: pcuiExternal.VectorInput
    };

})());
