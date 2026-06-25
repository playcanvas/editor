import type { Observer, ObserverList } from '@playcanvas/observer';
import { Button, Container, Label } from '@playcanvas/pcui';

import type { Tooltip } from './pcui/element/element-tooltip.js';

export const tooltip = (): Tooltip => editor.call('layout.tooltip');

class TooltipHandle extends Container {
    arrow: HTMLElement;

    hoverable: boolean;

    x: number;

    y: number;

    private _align: 'top' | 'right' | 'bottom' | 'left';

    private _removeTarget?: () => void;

    constructor(args: {
        class?: string,
        hoverable?: boolean,
        x?: number,
        y?: number,
        align?: 'top' | 'right' | 'bottom' | 'left',
        hidden?: boolean,
        text?: string,
        html?: string
    } = {}) {
        super({
            class: 'pcui-tooltip',
            hidden: args.hidden ?? true
        });

        this.class.add('align-left');
        if (args.class) {
            this.class.add(args.class);
        }

        this.innerElement = document.createElement('div');
        this.innerElement.classList.add('inner');
        this.dom.appendChild(this.innerElement);

        this.arrow = document.createElement('div');
        this.arrow.classList.add('arrow');
        this.dom.appendChild(this.arrow);

        this.hoverable = args.hoverable || false;
        this.x = args.x || 0;
        this.y = args.y || 0;
        this._align = 'left';
        this.align = args.align || 'left';

        this.on('show', this._reflow.bind(this));
        if (args.html) {
            this.html = args.html;
        } else {
            this.text = args.text || '';
        }

        this.dom.addEventListener('mouseover', this._handleMouseOver.bind(this), false);
        this.dom.addEventListener('mouseleave', this._handleMouseLeave.bind(this), false);
        this.on('destroy', () => this.detach());
    }

    set align(value: 'top' | 'right' | 'bottom' | 'left') {
        if (this._align === value) {
            return;
        }

        this.class.remove(`align-${this._align}`);
        this._align = value;
        this.class.add(`align-${this._align}`);
        this._reflow();
    }

    get align() {
        return this._align;
    }

    set flip(value: boolean) {
        this.class.toggle('flip', value);
        this._reflow();
    }

    get flip() {
        return this.class.contains('flip');
    }

    set text(value: string) {
        this.innerElement.textContent = value;
    }

    get text() {
        return this.innerElement.textContent;
    }

    set html(value: string) {
        this.innerElement.innerHTML = value;
    }

    get html() {
        return this.innerElement.innerHTML;
    }

    _handleMouseOver(evt: MouseEvent) {
        if (!this.hoverable) {
            return;
        }

        this.hidden = false;
        this.emit('hover', evt);
    }

    _handleMouseLeave() {
        if (!this.hoverable) {
            return;
        }

        this.hidden = true;
    }

    _reflow() {
        if (this.hidden) {
            return;
        }

        this.style.top = '';
        this.style.right = '';
        this.style.bottom = '';
        this.style.left = '';
        this.arrow.style.top = '';
        this.arrow.style.right = '';
        this.arrow.style.bottom = '';
        this.arrow.style.left = '';
        this.style.display = 'block';

        if (this._align === 'top') {
            this.style.top = `${this.y}px`;
            if (this.flip) {
                this.style.right = `calc(100% - ${this.x}px)`;
            } else {
                this.style.left = `${this.x}px`;
            }
        } else if (this._align === 'right') {
            this.style.top = `${this.y}px`;
            this.style.right = `calc(100% - ${this.x}px)`;
        } else if (this._align === 'bottom') {
            this.style.bottom = `calc(100% - ${this.y}px)`;
            if (this.flip) {
                this.style.right = `calc(100% - ${this.x}px)`;
            } else {
                this.style.left = `${this.x}px`;
            }
        } else {
            this.style.top = `${this.y}px`;
            this.style.left = `${this.x}px`;
        }

        const rect = this.dom.getBoundingClientRect();

        if (rect.left < 0) {
            this.style.left = '0px';
            this.style.right = '';
        }
        if (rect.top < 0) {
            this.style.top = '0px';
            this.style.bottom = '';
        }
        if (rect.right > window.innerWidth) {
            this.style.right = '0px';
            this.style.left = '';
            this.arrow.style.left = `${Math.floor(rect.right - window.innerWidth + 8)}px`;
        }
        if (rect.bottom > window.innerHeight) {
            this.style.bottom = '0px';
            this.style.top = '';
            this.arrow.style.top = `${Math.floor(rect.bottom - window.innerHeight + 8)}px`;
        }

        this.style.display = '';
    }

    position(x: number, y: number) {
        x = Math.floor(x);
        y = Math.floor(y);

        if (this.x === x && this.y === y) {
            return;
        }

        this.x = x;
        this.y = y;
        this._reflow();
    }

    attach(target: HTMLElement) {
        if (this._removeTarget) {
            this.detach();
        }

        const hover = () => {
            const rect = target.getBoundingClientRect();
            let off = 16;

            if (this.align === 'top') {
                if (rect.width < 64) {
                    off = rect.width / 2;
                }
                this.flip = rect.left + off > window.innerWidth / 2;
                this.position(this.flip ? rect.right - off : rect.left + off, rect.bottom);
            } else if (this.align === 'right') {
                if (rect.height < 64) {
                    off = rect.height / 2;
                }
                this.flip = false;
                this.position(rect.left, rect.top + off);
            } else if (this.align === 'bottom') {
                if (rect.width < 64) {
                    off = rect.width / 2;
                }
                this.flip = rect.left + off > window.innerWidth / 2;
                this.position(this.flip ? rect.right - off : rect.left + off, rect.top);
            } else {
                if (rect.height < 64) {
                    off = rect.height / 2;
                }
                this.flip = false;
                this.position(rect.right, rect.top + off);
            }

            this.hidden = false;
        };
        const blur = () => {
            this.hidden = true;
        };

        target.addEventListener('mouseover', hover, false);
        target.addEventListener('mouseout', blur, false);
        this._removeTarget = () => {
            target.removeEventListener('mouseover', hover, false);
            target.removeEventListener('mouseout', blur, false);
        };

        if (target.matches(':hover')) {
            hover();
        }
    }

    detach() {
        if (!this._removeTarget) {
            return;
        }

        this._removeTarget();
        this._removeTarget = undefined;
    }

    static make(args: {
        root?: Container,
        text?: string,
        html?: string,
        align?: 'top' | 'right' | 'bottom' | 'left',
        hoverable?: boolean,
        class?: string
    }) {
        const item = new TooltipHandle(args);
        (args.root || editor.call('layout.root')).append(item);
        return item;
    }

    static attach(args: {
        root?: Container,
        target: HTMLElement,
        text?: string,
        html?: string,
        align?: 'top' | 'right' | 'bottom' | 'left',
        hoverable?: boolean,
        class?: string
    }) {
        const item = TooltipHandle.make(args);
        item.attach(args.target);
        return item;
    }
}

/**
 * Creates a new simple tooltip item
 *
 * @param args - The arguments.
 * @returns The tooltip.
 */
export const tooltipSimpleItem = ({
    text,
    classNames = []
}: {
    text: string;
    classNames?: string[];
}): Container => {
    const item = new Container({
        class: ['tooltip-simple', ...classNames]
    });

    item.append(new Label({
        class: 'text',
        text: text
    }));

    return item;
};

export { TooltipHandle };

/**
 * Creates a new API reference tooltip item
 *
 * @param args - The arguments.
 * @returns The tooltip.
 */
export const tooltipRefItem = ({
    reference
}: {
    reference: { title: string; subTitle: string; description: string; webgl2?: boolean; code?: string; url?: string };
}): Container => {
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
        text: reference.description,
        unsafe: true
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
    override: { override_type?: string };
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
    templates.forEach((template: Observer) => {
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
