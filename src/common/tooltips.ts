import type { Observer, ObserverList } from '@playcanvas/observer';
import { Button, Container, Label } from '@playcanvas/pcui';

import type { Tooltip } from './pcui/element/element-tooltip.js';

export const tooltip = (): Tooltip => editor.call('layout.tooltip');

/**
 * Creates a new simple tooltip item
 *
 * @param {object} args - The arguments.
 * @param {string} args.text - The description.
 * @param {string[]} [args.classNames] - The class names.
 * @returns {Container} The tooltip.
 */
export const tooltipSimpleItem = ({
    text,
    classNames = []
}) => {
    const item = new Container({
        class: ['tooltip-simple', ...classNames]
    });

    item.append(new Label({
        class: 'text',
        text: text
    }));

    return item;
};

/**
 * Creates a new API reference tooltip item
 *
 * @param {object} args - The arguments.
 * @param {object} args.reference - The reference data.
 * @returns {Container} The tooltip.
 */
export const tooltipRefItem = ({
    reference
}) => {
    const item = new Container({
        class: ['tooltip-reference'],
        flex: true
    });

    item.append(new Label({
        class: 'title',
        text: reference.title
    }));
    item.append(new Label({
        class: 'subtitle',
        text: reference.subTitle
    }));
    item.append(new Label({
        class: 'desc',
        text: reference.description
    }));
    item.append(new Label({
        class: 'webgl2',
        text: 'WebGL 2.0 Only',
        hidden: !reference.webgl2
    }));
    item.append(new Label({
        class: 'code',
        text: reference.code,
        hidden: !reference.code
    }));

    const btnUrl = new Button({
        class: 'api',
        text: 'API REFERENCE',
        flexGrow: 1,
        hidden: !reference.url
    });
    if (reference.url) {
        btnUrl.on('click', () => {
            window.open(reference.url);
        });
    }
    item.append(btnUrl);

    return item;
};

/**
 * Creates a new override tooltip item
 *
 * @param args - The arguments.
 * @param args.templateRoot - The entity that represents the template root in the scene.
 * @param args.entities - The entities observer list.
 * @param args.override - The override.
 * @returns The tooltip.
 */
export const tooltipOverrideItem = ({
    templateRoot,
    entities,
    override
}: {
    templateRoot: Observer;
    entities: ObserverList;
    override: object;
}) => {
    const title = 'Override';
    let subTitle = '';

    if (override.override_type === 'override_reorder_scripts') {
        subTitle = 'Reorder scripts';
    } else if (override.override_type === 'override_add_script') {
        subTitle = 'Add script';
    } else {
        subTitle = 'Adjustment';
    }

    const item = new Container({
        class: ['tooltip-override'],
        flex: true
    });
    item.append(new Label({
        class: 'title',
        text: title
    }));
    item.append(new Label({
        class: 'subtitle',
        text: subTitle
    }));

    const templates = editor.call('templates:findApplyCandidatesForOverride', override, entities, templateRoot);
    templates.forEach((template) => {
        // button to apply override
        const apply = new Button({
            class: 'apply',
            text: `APPLY TO "${template.get('name')}"`,
            flexGrow: 1
        });
        apply.on('click', () => {
            apply.enabled = false;
            if (!editor.call('templates:applyOverride', template, override)) {
                apply.enabled = true;
            }
        });
        item.append(apply);
    });
    const revert = new Button({
        class: 'revert',
        text: 'REVERT',
        flexGrow: 1
    });
    revert.on('click', () => {
        editor.call('templates:revertOverride', override, entities);
    });
    item.append(revert);

    return item;
};
