Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'pcui-tooltip';
    const CLASS_TITLE = CLASS_ROOT + '-title';
    const CLASS_SUBTITLE = CLASS_ROOT + '-subtitle';
    const CLASS_DESC = CLASS_ROOT + '-desc';

    const TOOLTIP_MARGIN = 16;
    const TOOLTIP_DELAY_SHOW = 600;
    const TOOLTIP_DELAY_HIDE = 300;

    /**
     * @name pcui.Tooltip
     * @classdesc A floating tooltip that can be attached to a target element.
     * @augments pcui.Container
     * @property {string} title The tooltip title
     * @property {string} subTitle The tooltip sub title
     * @property {string} description The tooltip description
     * @property {string} align The tooltip alignment. Can be one of 'top', 'bottom', 'right', 'left'. E.g. if 'right' then the target element will appear on the right side of the tooltip.
     */
    class Tooltip extends pcui.Container {
        /**
         * Creates new tooltip.
         *
         * @param {object} args - The arguments.
         * @param {number} [args.showDelay] - The delay in milliseconds before showing the tooltip.
         * @param {number} [args.hideDelay] - The delay in milliseconds before hiding the tooltip.
         */
        constructor(args) {
            args = Object.assign({
                hidden: true
            }, args);

            super(args);

            this.class.add(CLASS_ROOT);

            this._showDelay = (args.showDelay !== undefined ? args.showDelay : TOOLTIP_DELAY_SHOW);
            this._hideDelay = (args.hideDelay !== undefined ? args.hideDelay : TOOLTIP_DELAY_HIDE);

            this._target = null;
            this._elementForHorizontalAlign = null;
            this._elementForVerticalAlign = null;
            this._alignToPanel = null;
            this._targetEvents = [];

            this._toggleTimeout = null;

            this._labelTitle = new pcui.Label({
                class: CLASS_TITLE
            });
            this.append(this._labelTitle);

            this._labelSubTitle = new pcui.Label({
                class: CLASS_SUBTITLE
            });
            this.append(this._labelSubTitle);

            this._labelDesc = new pcui.Label({
                class: CLASS_DESC
            });
            this.append(this._labelDesc);

            this.title = args.title;
            this.subTitle = args.subTitle;
            this.description = args.description;

            this.align = args.align || 'right';

            this.on('hover', this._onHover.bind(this));
            this.on('hoverend', this._onHoverEnd.bind(this));
            this.on('show', this._realign.bind(this));
            this.on('append', this._realign.bind(this));
            this.on('remove', this._realign.bind(this));
        }

        _onHover(evt) {
            if (this.parent instanceof pcui.TooltipGroup) return;

            this._deferToggle(true);
        }

        _onHoverEnd(evt) {
            if (this.parent instanceof pcui.TooltipGroup) return;

            this._deferToggle(false);
        }

        _realign() {
            if (!this._elementForHorizontalAlign || this._elementForHorizontalAlign.destroyed) return;
            if (!this._elementForVerticalAlign || this._elementForVerticalAlign.destroyed) return;

            const horizontalAlignRect = this._elementForHorizontalAlign.dom.getBoundingClientRect();
            const verticalAlignRect = this._elementForVerticalAlign.dom.getBoundingClientRect();

            this.style.left = '';
            this.style.right = '';
            this.style.bottom = '';
            this.style.top = '';

            const rect = this.dom.getBoundingClientRect();

            if (this.align !== 'left' && this.align !== 'right') {
                const left = Math.max(0, horizontalAlignRect.left + (horizontalAlignRect.width - rect.width) / 2);
                if (left + rect.width > window.innerWidth) {
                    this.style.right = '0px';
                } else {
                    this.style.left = `${left}px`;
                }

                let top = 0;
                if (this.align === 'top') {
                    top = Math.max(0, verticalAlignRect.bottom + TOOLTIP_MARGIN);
                } else {
                    top = Math.max(0, verticalAlignRect.top - rect.height - TOOLTIP_MARGIN);
                }

                if (top + rect.height > window.innerHeight) {
                    this.style.bottom = '0px';
                } else {
                    this.style.top = `${top}px`;
                }
            }

            if (this.align !== 'top' && this.align !== 'bottom') {
                const top = Math.max(0, verticalAlignRect.top - rect.height / 2);
                if (top + rect.height > window.innerHeight) {
                    this.style.bottom = '0px';
                } else {
                    this.style.top = `${top}px`;
                }

                let left = 0;
                if (this.align === 'left') {
                    left = Math.max(0, horizontalAlignRect.right + TOOLTIP_MARGIN);
                } else {
                    left = Math.max(0, horizontalAlignRect.left - rect.width - TOOLTIP_MARGIN);
                }

                if (left + rect.width > window.innerWidth) {
                    this.style.right = '0px';
                } else {
                    this.style.left = `${left}px`;
                }
            }
        }

        _onTargetHover(evt) {
            this._deferToggle(true);
        }

        _onTargetHoverEnd(evt) {
            this._deferToggle(false);
        }

        _onTargetHide() {
            this._cancelToggle();
            this.hidden = true;
        }

        _onTargetDestroy() {
            this.destroy();
        }

        _clearTargetEvents() {
            if (!this._target) return;

            this._targetEvents.forEach(evt => evt.unbind());
            this._targetEvents.length = 0;
        }

        _deferToggle(show) {
            this._cancelToggle();

            this._toggleTimeout = setTimeout(() => {
                this._toggleTimeout = null;
                this.hidden = !show;
            }, show ? this._showDelay : this._hideDelay);
        }

        _cancelToggle() {
            if (this._toggleTimeout) {
                clearTimeout(this._toggleTimeout);
                this._toggleTimeout = null;
            }
        }

        /**
         * @name pcui.Tooltip#attach
         * @description Attaches the tooltip to an element. When the user hovers on the element
         * the tooltip will show up.
         * @param {object} args - The arguments
         * @param {pcui.Element} args.target - The target element. When the user hovers over the target element that will show the tooltip.
         * @param {pcui.Element} args.elementForHorizontalAlign - The tooltip will use this element to align itself horizontally depending on the pcui.Tooltip#align property.
         * @param {pcui.Element} args.elementForVerticalAlign - The tooltip will use this element to align itself vertically depending on the pcui.Tooltip#align property.
         */
        attach(args) {
            this._clearTargetEvents();

            if (!this.parent) {
                editor.call('layout.root').append(this);
            }

            this._target = args.target;
            this._elementForHorizontalAlign = args.elementForHorizontalAlign || this._target;
            this._elementForVerticalAlign = args.elementForVerticalAlign || this._target;

            this._targetEvents.push(this._target.on('hover', this._onTargetHover.bind(this)));
            this._targetEvents.push(this._target.on('hoverend', this._onTargetHoverEnd.bind(this)));
            this._targetEvents.push(this._target.on('hideToRoot', this._onTargetHide.bind(this)));
            this._targetEvents.push(this._target.on('destroy', this._onTargetDestroy.bind(this)));

            if (!this.hidden) {
                this._realign();
            }
        }

        destroy() {
            if (this._destroyed) return;

            this._cancelToggle();
            this._clearTargetEvents();

            super.destroy();
        }

        set title(value) {
            this._labelTitle.text = value;
            this._labelTitle.hidden = !value;
        }

        get title() {
            return this._labelTitle.text;
        }

        set subTitle(value) {
            this._labelSubTitle.text = value;
            this._labelSubTitle.hidden = !value;
        }

        get subTitle() {
            return this._labelSubTitle.text;
        }

        set description(value) {
            this._labelDesc.text = value;
            this._labelDesc.hidden = !value;
        }

        get description() {
            return this._labelDesc.text;
        }

        set align(value) {
            this._align = value;
            if (!this.hidden) {
                this._realign();
            }
        }

        get align() {
            return this._align;
        }
    }

    return {
        Tooltip: Tooltip
    };
})());
