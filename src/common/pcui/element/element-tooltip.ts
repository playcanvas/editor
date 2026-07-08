import type { EventHandle } from '@playcanvas/observer';
import type { Element } from '@playcanvas/pcui';
import { Container } from '@playcanvas/pcui';

/**
 * A floating tooltip that can be attached to a target element.
 */
class Tooltip extends Container {
    private _margin = 10;

    private _delay = 200;

    private _targets = new Map<
        Element,
        {
            container: Container;
            target: Element;
            arrow: HTMLDivElement;
            events: EventHandle[];
        }
    >();

    // the single container currently shown; the singleton shows one at a time (gh 2133)
    private _shown: Container | null = null;

    /**
     * Creates new tooltip.
     *
     * @param args - The arguments.
     */
    constructor({ id, delay, margin }: { id?: string; delay?: number; margin?: number } = {}) {
        super({
            id,
            class: 'pcui-tooltip',
            hidden: true
        });
        this.margin = margin;
        this.delay = delay;
    }

    /**
     * The margin in pixels between the tooltip and the target element.
     */
    set margin(value: number) {
        this._margin = value ?? this._margin;
    }

    get margin() {
        return this._margin;
    }

    /**
     * The delay in milliseconds before the tooltip is shown.
     */
    set delay(value: number) {
        this._delay = value ?? this._delay;
    }

    get delay() {
        return this._delay;
    }

    /**
     * @param align - The side of the tooltip that is aligned to the target element.
     * @param horzAlignEl - The tooltip will use this element to align itself horizontally
     * depending on the {@link Tooltip#align } property.
     * @param vertAlignEl - The tooltip will use this element to align itself vertically
     * depending on the {@link Tooltip#align} property.
     */
    private _realign(align: 'top' | 'bottom' | 'left' | 'right', horzAlignEl: Element, vertAlignEl: Element) {
        if (!horzAlignEl || horzAlignEl.destroyed) {
            return;
        }
        if (!vertAlignEl || vertAlignEl.destroyed) {
            return;
        }

        const horizontalAlignRect = horzAlignEl.dom.getBoundingClientRect();
        const verticalAlignRect = vertAlignEl.dom.getBoundingClientRect();

        this.style.left = '';
        this.style.right = '';
        this.style.bottom = '';
        this.style.top = '';

        const rect = this.dom.getBoundingClientRect();

        if (align !== 'left' && align !== 'right') {
            const left = Math.max(0, horizontalAlignRect.left + (horizontalAlignRect.width - rect.width) / 2);
            if (left + rect.width > window.innerWidth) {
                this.style.right = '0px';
            } else {
                this.style.left = `${left}px`;
            }

            let top = 0;
            if (align === 'top') {
                top = Math.max(0, verticalAlignRect.bottom + this._margin);
            } else {
                top = Math.max(0, verticalAlignRect.top - rect.height - this._margin);
            }

            if (top + rect.height > window.innerHeight) {
                this.style.bottom = '0px';
            } else {
                this.style.top = `${top}px`;
            }
        }

        if (align !== 'top' && align !== 'bottom') {
            const top = Math.max(0, verticalAlignRect.top - rect.height / 2);
            if (top + rect.height > window.innerHeight) {
                this.style.bottom = '0px';
            } else {
                this.style.top = `${top}px`;
            }

            let left = 0;
            if (align === 'left') {
                left = Math.max(0, horizontalAlignRect.right + this._margin);
            } else {
                left = Math.max(0, horizontalAlignRect.left - rect.width - this._margin);
            }

            if (left + rect.width > window.innerWidth) {
                this.style.right = '0px';
            } else {
                this.style.left = `${left}px`;
            }
        }
    }

    /**
     * Attaches the tooltip to a target element.
     *
     * @param args - The arguments
     * @returns The tooltip.
     */
    attach({
        container,
        target,
        horzAlignEl,
        vertAlignEl,
        align = 'right',
        arrowAlign
    }: {
        container: Container;
        target: Element;
        horzAlignEl?: Element;
        vertAlignEl?: Element;
        align?: 'top' | 'bottom' | 'left' | 'right';
        arrowAlign?: 'start' | 'end';
    }) {
        const horz = horzAlignEl ?? target;
        const vert = vertAlignEl ?? target;

        const events = [];
        let timeout = null;

        const defer = () => {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            return new Promise<void>((resolve) => {
                timeout = setTimeout(() => {
                    timeout = null;
                    resolve();
                }, this._delay);
            });
        };

        const hover = () => {
            defer().then(() => {
                // drop whatever was shown before. a field destroyed while its tooltip is
                // up never fires hoverend, so its container would otherwise linger and
                // stack with the next one shown (gh 2133)
                if (this._shown && this._shown !== container) {
                    this.remove(this._shown);
                }
                this._shown = container;
                this.hidden = false;
                if (container.parent !== this) {
                    this.append(container);
                }
                this._realign(align, horz, vert);
            });
        };

        const hoverend = () => {
            defer().then(() => {
                // a later hover may have taken the singleton over; leave that one alone
                if (this._shown !== container) {
                    return;
                }
                this.hidden = true;
                this.remove(container);
                this._shown = null;
            });
        };

        events.push(target.on('hover', hover));
        events.push(target.on('hoverend', hoverend));
        events.push(container.on('hover', hover));
        events.push(container.on('hoverend', hoverend));
        events.push(container.on('append', () => this._realign(align, horz, vert)));
        events.push(container.on('remove', () => this._realign(align, horz, vert)));

        const arrow = document.createElement('div');
        arrow.classList.add('arrow', align);
        if (arrowAlign) {
            arrow.classList.add(`arrow-${arrowAlign}`);
        }
        container.append(arrow);

        this._targets.set(target, {
            container,
            target,
            arrow,
            events
        });

        return this;
    }

    /**
     * Detaches the tooltip from a target element.
     *
     * @param target - The target element.
     * @returns The tooltip.
     */
    detach(target: Element): Tooltip {
        const data = this._targets.get(target);
        if (!data) {
            return this;
        }
        const { container, arrow, events } = data;

        events.forEach((evt: EventHandle) => evt.unbind());
        arrow.remove();
        this.remove(container);
        if (this._shown === container) {
            this._shown = null;
        }
        this._targets.delete(target);

        return this;
    }

    destroy() {
        if (this._destroyed) {
            return;
        }

        for (const target of this._targets.keys()) {
            this.detach(target);
        }

        super.destroy();
    }
}

export { Tooltip };
