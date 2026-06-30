import { LegacyTooltip } from '@/common/ui/tooltip';

import type { AttributeReference, LegacyAttributeReference } from './reference.type';

editor.once('load', () => {
    const root = editor.call('layout.root');
    const panel = editor.call('layout.attributes');

    const legacyMissing: Set<string> = new Set();
    const legacyReferenceIndex: Record<string, LegacyAttributeReference> = {};

    const referenceIndex: Record<string, AttributeReference> = {};

    const sanitize = function (str: string) {
        return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };

    editor.method('attributes:reference:add', (attr: AttributeReference) => {
        referenceIndex[attr.name] = attr;
    });

    editor.method('attributes:reference:get', (name) => {
        if (!referenceIndex[name]) {
            console.warn(`Cannot find reference ${name}`);
            return;
        }
        return referenceIndex[name];
    });

    editor.method('attributes:reference:addLegacy', (attr: LegacyAttributeReference) => {
        legacyReferenceIndex[attr.name] = editor.call('attributes:reference', attr);
    });

    editor.method('attributes:reference:attach', (name, target, element, panel) => {
        const tooltip = legacyReferenceIndex[name];

        if (!tooltip) {
            if (!legacyMissing.has(name)) {
                legacyMissing.add(name);
                console.log(`Cannot find legacy reference ${name}`);
            }
            return;
        }

        // FIXME: tooltip.attach is not a function
        // tooltip.attach({
        //     target: target,
        //     panel: panel,
        //     element: element || target.element
        // });

        return tooltip;
    });

    editor.method('attributes:reference', (attr: LegacyAttributeReference) => {
        const tooltip = new LegacyTooltip({
            align: 'right'
        });
        tooltip.hoverable = true;
        tooltip.class.add('reference');

        tooltip.html = '';
        if (attr.title) {
            tooltip.html += `<h1>${sanitize(attr.title)}</h1>`;
        }
        if (attr.subTitle) {
            tooltip.html += `<h2>${sanitize(attr.subTitle)}</h2>`;
        }
        if (attr.description) {
            let description = sanitize(attr.description);
            description = description.replace(/&lt;b&gt;/g, '<b>').replace(/&lt;\/b&gt;/g, '</b>'); // bold
            description = description.replace(/&lt;ul&gt;/g, '<ul>').replace(/&lt;\/ul&gt;/g, '</ul>'); // lists
            description = description.replace(/&lt;li&gt;/g, '<li>').replace(/&lt;\/li&gt;/g, '</li>'); // list items
            description = description.replace(/&lt;code&gt;/g, '<code>').replace(/&lt;\/code&gt;/g, '</code>'); // code
            description = description.replace(/\n/g, '<br />'); // new lines
            // Clean up line breaks around list elements
            description = description.replace(/<br \/>\s*<ul>/g, '<ul>');
            description = description.replace(/<ul><br \/>/g, '<ul>');
            description = description.replace(/<br \/>\s*<\/ul>/g, '</ul>');
            description = description.replace(/<\/ul><br \/>/g, '</ul>');
            description = description.replace(/<br \/>\s*<li>/g, '<li>');
            description = description.replace(/<\/li><br \/>/g, '</li>');
            tooltip.html += `<p>${description}</p>`;
        }
        if (attr.url) {
            tooltip.html += `<a class="reference" href="${sanitize(attr.url)}" target="_blank">API Reference</a>`;
        }

        let timerHover = null;
        let timerBlur = null;

        tooltip.attach = function (args: {
            target?: HTMLElement,
            element?: HTMLElement,
            panel?: HTMLElement
        }) {
            let target = args.target;
            let element = args.element;
            let targetPanel = args.panel || panel;
            targetPanel = targetPanel.dom || targetPanel.element;

            const show = function () {
                if (!target || target.hidden) {
                    return;
                }
                // fix top offset for new framework
                const topOffset = (element.ui instanceof Element ? 6 : 16);
                tooltip.position(targetPanel.getBoundingClientRect().left, element.getBoundingClientRect().top + topOffset);
                tooltip.hidden = false;
            };

            const hide = () => {
                tooltip.hidden = true;
            };

            const evtHide = function () {
                clearTimeout(timerHover);
                clearTimeout(timerBlur);
                tooltip.hidden = true;
            };

            const evtHover = function () {
                clearTimeout(timerBlur);
                timerHover = setTimeout(show, 500);
            };

            const evtBlur = function () {
                clearTimeout(timerHover);
                timerBlur = setTimeout(hide, 200);
            };

            const evtClick = function () {
                clearTimeout(timerBlur);
                clearTimeout(timerHover);
                show();
            };

            target.on('hide', evtHide);

            target.once('destroy', () => {
                element.removeEventListener('mouseover', evtHover);
                element.removeEventListener('mouseout', evtBlur);
                element.removeEventListener('click', evtClick);
                target.unbind('hide', evtHide);
                target = null;
                element = null;
                clearTimeout(timerHover);
                clearTimeout(timerBlur);
                tooltip.hidden = true;
            });

            element.addEventListener('mouseover', evtHover, false);
            element.addEventListener('mouseout', evtBlur, false);
            element.addEventListener('click', evtClick, false);
        };

        tooltip.on('hover', () => {
            clearTimeout(timerBlur);
        });

        root.append(tooltip);

        return tooltip;
    });
});
