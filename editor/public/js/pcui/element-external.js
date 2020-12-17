Object.assign(pcui, (function () {
    'use strict';

    const Element = pcuiExternal.Element;

    const ArrayInput = pcuiExternal.ArrayInput;
    ArrayInput.DEFAULTS = utils.deepCopy(pcui.DEFAULTS);
    for (const type in pcui.DEFAULTS) {
        Element.register(`array:${type}`, ArrayInput, { type: type, renderChanges: true });
    }
    Element.register('array:select', ArrayInput, { type: 'select', renderChanges: true });

    const BooleanInput = pcuiExternal.BooleanInput;
    Element.register('boolean', BooleanInput, { renderChanges: true });

    const Button = pcuiExternal.Button;
    Element.register('button', Button);

    const Code = pcuiExternal.Code;
    Element.register('code', Code);

    const Container = pcuiExternal.Container;
    Element.register('container', Container);

    const ContextMenu = pcuiExternal.ContextMenu;
    Element.register('contextmenu', ContextMenu);

    const Divider = pcuiExternal.Divider;
    Element.register('divider', Divider);

    const InfoBox = pcuiExternal.InfoBox;
    Element.register('infobox', InfoBox);

    const Label = pcuiExternal.Label;
    Element.register('label', Label);

    const NumericInput = pcuiExternal.NumericInput;
    Element.register('number', NumericInput, { renderChanges: true });

    const Overlay = pcuiExternal.Overlay;

    const Panel = pcuiExternal.Panel;
    Element.register('panel', Panel);

    const Progress = pcuiExternal.Progress;
    Element.register('progress', Progress);

    const SelectInput = pcuiExternal.SelectInput;
    Element.register('select', SelectInput, { renderChanges: true });
    Element.register('multiselect', SelectInput, { multiSelect: true, renderChanges: true });
    Element.register('tags', SelectInput, { allowInput: true, allowCreate: true, multiSelect: true, renderChanges: true });

    const SliderInput = pcuiExternal.SliderInput;
    utils.proxy(SliderInput, '_numericInput', SliderInput.PROXY_FIELDS);
    Element.register('slider', SliderInput, { renderChanges: true });

    const Spinner = pcuiExternal.Spinner;

    const TextAreaInput = pcuiExternal.TextAreaInput;
    Element.register('text', TextAreaInput, { renderChanges: true });

    const TextInput = pcuiExternal.TextInput;
    Element.register('string', TextInput, { renderChanges: true });

    const TreeViewItem = pcuiExternal.TreeViewItem;

    const TreeView = pcuiExternal.TreeView;

    const VectorInput = pcuiExternal.VectorInput;
    Element.register('vec2', VectorInput, { dimensions: 2, renderChanges: true });
    Element.register('vec3', VectorInput, { dimensions: 3, renderChanges: true });
    Element.register('vec4', VectorInput, { dimensions: 4, renderChanges: true });

    return {
        Element: Element,
        ArrayInput: ArrayInput,
        BooleanInput: BooleanInput,
        Button: Button,
        Code: Code,
        Container: Container,
        ContextMenu: ContextMenu,
        Divider: Divider,
        InfoBox: InfoBox,
        Label: Label,
        NumericInput: NumericInput,
        Overlay: Overlay,
        Panel: Panel,
        Progress: Progress,
        SelectInput: SelectInput,
        SliderInput: SliderInput,
        Spinner: Spinner,
        TextAreaInput: TextAreaInput,
        TextInput: TextInput,
        TreeViewItem: TreeViewItem,
        TreeView: TreeView,
        VectorInput: VectorInput
    };

})());
