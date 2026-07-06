import {
    BooleanInput,
    Button,
    Code,
    Container,
    Label,
    NumericInput,
    Overlay,
    Panel,
    Progress,
    SelectInput,
    SliderInput,
    TextAreaInput,
    TextInput
} from '@playcanvas/pcui';

import { toOptions } from '@/common/pcui/compat-utils';
import { AssetInput } from '@/common/pcui/element/element-asset-input';
import { ColorInput } from '@/common/pcui/element/element-color-input';
import { CurveInput } from '@/common/pcui/element/element-curve-input';
import { EntityInput } from '@/common/pcui/element/element-entity-input';
import { GradientInput } from '@/common/pcui/element/element-gradient-input';

const defineAlias = (element: any, name: string, descriptor: PropertyDescriptor) => {
    if (!Object.getOwnPropertyDescriptor(element, name)) {
        Object.defineProperty(element, name, {
            configurable: true,
            ...descriptor
        });
    }
};

const syncEnabledClass = (element: any) => {
    if (element.enabled) {
        element.class.remove('disabled');
    } else {
        element.class.add('disabled');
    }
};

const withCompat = (element: any, ...classes: string[]) => {
    for (const cls of classes) {
        element.class.add(cls);
    }

    element.element = element.dom;
    if (element.domContent) {
        element.innerElement = element.domContent;
        element.domContent.classList.add('content');
    }

    if (element.input) {
        element.elementInput = element.input;
    }

    defineAlias(element, 'disabled', {
        get() {
            return !this.enabled;
        },
        set(value: boolean) {
            this.enabled = !value;
        }
    });

    defineAlias(element, 'proxy', {
        get() {
            return this.dom.getAttribute('proxy');
        },
        set(value: string | null | undefined) {
            if (value === null || value === undefined || value === '') {
                this.dom.removeAttribute('proxy');
            } else {
                this.dom.setAttribute('proxy', value);
            }
        }
    });

    defineAlias(element, 'WebkitFlexWrap', {
        get() {
            return this.style.webkitFlexWrap;
        },
        set(value: string) {
            this.style.webkitFlexWrap = value;
        }
    });

    if (!element.focus) {
        element.focus = () => element.dom.focus();
    }

    element.on('enable', () => syncEnabledClass(element));
    element.on('disable', () => syncEnabledClass(element));
    syncEnabledClass(element);

    return element;
};

const withPanelCompat = (panel: any, headerText = '') => {
    withCompat(panel, 'ui-panel');

    if (panel.header) {
        panel.headerElement = panel.header.dom;
        panel.headerElement.classList.add('ui-header');
        panel.headerElementTitle = panel.header.dom.querySelector('.pcui-panel-header-title');
        panel.headerElementTitle?.classList.add('title');
        panel.headerAppend = (element: any) => panel.header.append(element);

        defineAlias(panel, 'foldable', {
            get() {
                return this.collapsible;
            },
            set(value: boolean) {
                this.collapsible = !!value;
            }
        });

        defineAlias(panel, 'folded', {
            get() {
                return this.collapsed;
            },
            set(value: boolean) {
                this.collapsed = !!value;
            }
        });
    } else {
        panel.class.add('noHeader');
        panel.headerAppend = (element: any) => panel.append(element);
        panel.headerElement = null;
        panel.headerElementTitle = null;
        panel.foldable = false;
        panel.folded = false;
    }

    if (headerText) {
        panel.headerText = headerText;
    }

    return panel;
};

const createPanel = (headerText = '') => {
    if (headerText) {
        const header = document.createElement('header');
        return withPanelCompat(new Panel({ header, headerText }), headerText);
    }

    return withPanelCompat(new Container({ flex: true }));
};

const createButton = (args: any = {}) =>
    withCompat(
        new Button({
            ...args,
            unsafe: args.unsafe ?? true
        }),
        'ui-button'
    );

const createCheckbox = (args: any = {}) => {
    const field = withCompat(new BooleanInput(args), 'ui-checkbox', 'noSelect');
    const sync = (value: boolean | null) => {
        field.class.toggle('checked', !!value);
        field.class.toggle('null', value === null);
    };

    field._onLinkChange = sync;
    field.on('change', sync);
    sync(field.value);

    return field;
};

const createCode = (args: any = {}) => withCompat(new Code(args), 'ui-code');

const createColorInput = (args: any = {}) => withCompat(new ColorInput(args), 'ui-color-field');

const withCurveLink = (field: any, arrayValue = true) => {
    field._link = null;
    field._paths = [];
    field._linkSetHandlers = [];
    field.suspendEvents = false;

    field.link = (link: any, paths: string[]) => {
        field.unlink();
        field._link = link;
        field._paths = paths;

        const update = () => {
            if (field.suspendEvents) {
                return;
            }

            const values = paths.map((path) => {
                const value = link.get(path);
                return value !== undefined ? value : null;
            });
            field.value = arrayValue ? values : values[0];
        };

        field._linkSetHandlers.push(
            link.on('*:set', (path: string) => {
                if (paths.some((p) => path.indexOf(p) === 0)) {
                    update();
                }
            })
        );

        update();
    };

    field.unlink = () => {
        field._linkSetHandlers.forEach((handler: any) => handler.unbind());
        field._linkSetHandlers.length = 0;
        field._link = null;
        field._paths = [];
    };

    return field;
};

const createCurveInput = (args: any = {}) => {
    const field = withCurveLink(withCompat(new CurveInput(args), 'ui-curve-field'));
    field._openCurvePicker = () => {};
    return field;
};

const createGradientInput = (args: any = {}) =>
    withCurveLink(withCompat(new GradientInput(args), 'ui-curve-field'), false);

const createAssetInput = (args: any = {}) => withCompat(new AssetInput(args), 'ui-image-field');

const createEntityInput = (args: any = {}) => {
    const field = withCompat(new EntityInput(args), 'ui-label', 'add-entity');
    defineAlias(field, 'text', {
        get() {
            return this._label?.value;
        },
        set(value: string) {
            this._label.value = value || '';
        }
    });

    if (args.pickEntityFn) {
        field._pickEntity = args.pickEntityFn;
    }
    return field;
};

const createLabel = (args: any = {}) => withCompat(new Label(args), 'ui-label');

const createList = () => {
    const list = withCompat(new Container({ flex: true }), 'ui-list');
    const append = list.append.bind(list);
    const appendAfter = list.appendAfter.bind(list);
    const bind = (item: any) => item.on('click', () => list.emit('select', item));

    list.append = (item: any) => {
        bind(item);
        append(item);
    };

    list.appendAfter = (item: any, after: any) => {
        bind(item);
        appendAfter(item, after);
    };

    return list;
};

const createListItem = (args: any = {}) => {
    const item = withCompat(new Container({ flex: true }), 'ui-list-item');
    const label = createLabel({ text: args.text || '' });
    item.append(label);
    item.isListItem = true;

    defineAlias(item, 'text', {
        get() {
            return label.text;
        },
        set(value: string) {
            label.text = value;
        }
    });

    return item;
};

const createOverlay = (args: any = {}) => withCompat(new Overlay(args), 'ui-overlay');

const createNumberInput = (args: any = {}) => withCompat(new NumericInput(args), 'ui-number-field');

const createProgress = (args: any = {}) => withCompat(new Progress(args), 'ui-progress');

const createSelectInput = (args: any = {}) => {
    let options = toOptions(args.options, args.type);
    const hidden = new Set<any>();
    const field = withCompat(
        new SelectInput({
            ...args,
            options,
            defaultValue: args.default,
            value: args.default
        }),
        'ui-select-field',
        'noSelect'
    );
    const applyOptions = () => {
        field.options = options.filter((option: any) => !hidden.has(option.v));
    };

    field.optionElements = {
        '': {
            style: {
                set display(value: string) {
                    if (value === 'none') {
                        hidden.add('');
                    } else {
                        hidden.delete('');
                    }
                    applyOptions();
                },
                get display() {
                    return hidden.has('') ? 'none' : '';
                }
            }
        }
    };
    field._updateOptions = (value: any = args.options) => {
        options = toOptions(value, args.type);
        applyOptions();
    };

    return field;
};

const createSliderInput = (args: any = {}) => {
    const field = withCompat(new SliderInput(args), 'ui-slider');
    const onSlideStart = field._onSlideStart.bind(field);
    const onSlideEnd = field._onSlideEnd.bind(field);

    field._onSlideStart = (pageX: number) => {
        field.emit('start');
        onSlideStart(pageX);
    };

    field._onSlideEnd = (pageX: number) => {
        onSlideEnd(pageX);
        field.emit('end');
    };

    return field;
};

const createTextAreaInput = (args: any = {}) => withCompat(new TextAreaInput(args), 'ui-textarea-field');

const createTextInput = (args: any = {}) => withCompat(new TextInput(args), 'ui-text-field');

export {
    createAssetInput,
    createButton,
    createCheckbox,
    createCode,
    createColorInput,
    createCurveInput,
    createEntityInput,
    createGradientInput,
    createLabel,
    createList,
    createListItem,
    createOverlay,
    createNumberInput,
    createPanel,
    createProgress,
    createSelectInput,
    createSliderInput,
    createTextAreaInput,
    createTextInput,
    toOptions
};
