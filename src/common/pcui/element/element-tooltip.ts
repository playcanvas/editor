import { Container } from '@playcanvas/pcui';

/** @import { Element } from '@playcanvas/pcui'; */
/** @import { EventHandle } from '@playcanvas/observer'; */

/**
 * A floating tooltip that can be attached to a target element.
 */
class Tooltip extends Container {
    /**
     * @type {number}
     * @private
     */
    _margin = 10;

    /**
     * @type {number}
     * @private
     */
    _delay = 200;

    /**
     * @type {Map<Element, {
     * container: Container,
     * target: Element,
     * arrow: HTMLDivElement,
     * events: EventHandle[]
     * }>}
     * @private
     */
    _targets = new Map();

    /**
     * Creates new tooltip.
     *
     * @param {object} [args] - The arguments.
     * @param {string} [args.id] - The element id.
     * @param {number} [args.delay] - The delay in milliseconds before the tooltip is shown.
     * @param {number} [args.margin] - The margin in pixels between the tooltip and the target element.
     */
    constructor({ id, delay, margin } = {}) {
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
     *
     * @type {number}
     */
    set margin(value) {
        this._margin = value ?? this._margin;
    }

    get margin() {
        return this._margin;
    }

    /**
     * The delay in milliseconds before the tooltip is shown.
     *
     * @type {number}
     */
    set delay(value) {
        this._delay = value ?? this._delay;
    }

    get delay() {
        return this._delay;
    }

    /**
     * @param {'top'|'bottom'|'left'|'right'} align - The side of the tooltip that is aligned to the
     * target element.
     * @param {Element} horzAlignEl - The tooltip will use this element to align itself horizontally
     * depending on the {@link Tooltip#align } property.
     * @param {Element} vertAlignEl - The tooltip will use this element to align itself vertically
     * depending on the {@link Tooltip#align} property.
     * @private
     */
    _realign(align, horzAlignEl, vertAlignEl) {
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
     * @param {object} args - The arguments
     * @param {Container} args.container - The tooltip element.
     * @param {Element} args.target - The target element.
     * @param {Element} [args.horzAlignEl] - The tooltip will use this element to
     * align itself horizontally depending on the Tooltip#align property.
     * @param {Element} [args.vertAlignEl] - The tooltip will use this element to align
     * @param {'top'|'bottom'|'left'|'right'} [args.align] - The side of the tooltip that is aligned to the target element.
     * @returns {Tooltip} The tooltip.
     */
    attach({
        container,
        target,
        horzAlignEl,
        vertAlignEl,
        align = 'right'
    }) {
        const horz = horzAlignEl ?? target;
        const vert = vertAlignEl ?? target;

        const events = [];
        let timeout = null;
        let appended = false;

        const defer = () => {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            return new Promise((resolve) => {
                timeout = setTimeout(() => {
                    timeout = null;
                    resolve();
                }, this._delay);
            });
        };

        const hover = () => {
            defer().then(() => {
                this.hidden = false;
                if (!appended) {
                    this.append(container);
                    appended = true;
                }
                this._realign(align, horz, vert);
            });
        };

        const hoverend = () => {
            defer().then(() => {
                this.hidden = true;
                if (appended) {
                    this.remove(container);
                    appended = false;
                }
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
     * @param {Element} target - The target element.
     * @returns {Tooltip} The tooltip.
     */
    detach(target) {
        const data = this._targets.get(target);
        if (!data) {
            return this;
        }
        const { container, arrow, events }  = data;

        events.forEach(evt => evt.unbind());
        arrow.remove();
        this.remove(container);
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
