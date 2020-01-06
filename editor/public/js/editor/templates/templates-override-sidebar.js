Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'template-override-sidebar';
    const CLASS_MARKER = CLASS_ROOT + '-marker';
    const CLASS_DROPDOWN_MENU = CLASS_ROOT + '-dropdown';
    const CLASS_HIGHLIGHT = CLASS_ROOT + '-highlight';

    const HIGHLIGHT_PADDING = 3;

    class Marker extends pcui.Element {
        constructor(override, elementDom) {
            super(document.createElement('div'));

            this.class.add(CLASS_MARKER);

            this._override = override;
            this._elementDom = elementDom;
        }

        destroy() {
            if (this._destroyed) return;

            window.removeEventListener('click', this._evtWindowClick);

            if (this._evtMessenger) {
                this._evtMessenger.unbind();
                this._evtMessenger = null;
            }

            super.destroy();
        }
    }

    class TemplateOverrideSidebar extends pcui.Container {
        constructor(args) {
            super(args);

            this.class.add(CLASS_ROOT);

            this._markers = {};
            this._registeredElements = {};

            this._hoveredElement = null;
            this._refreshTimeout = null;

            this._elementHighlight = new pcui.Element(null, {
                class: CLASS_HIGHLIGHT
            });

            this._entityEvents = [];
            this._evtPartOfTemplate = null;

            this.append(this._elementHighlight);

            this._evtMessenger = editor.on('messenger:template.apply', this._onTemplateApply.bind(this));

            this._evtWindowClick = this._onWindowClick.bind(this);

            this._dropdownMenu = new pcui.Container({
                class: CLASS_DROPDOWN_MENU,
                flex: true,
                hidden: true
            });

            this._dropdownMenu.on('show', () => {
                window.addEventListener('click', this._evtWindowClick);
            });

            this._dropdownMenu.on('hide', () => {
                window.removeEventListener('click', this._evtWindowClick);
            });

            this.append(this._dropdownMenu);

            this._dropdownMarker = null;
        }

        _onTemplateApply(data) {
            // if current entity is part of this template
            // then refresh overrides
            if (!this._entity) return;

            var template = editor.call('entities:get', data.entity_id);
            if (!template) return;

            if (!template.has('template_ent_ids.' + this._entity.get('resource_id'))) {
                return;
            }

            this._deferRefreshOverrides();
        }

        _onWindowClick(e) {
            if (this._dropdownMarker && this._dropdownMarker.dom.contains(e.target)) {
                return;
            }

            this._dropdownMenu.hidden = true;
        }

        _getMarkerKey(override) {
            return `${override.override_type}${override.resource_id}${override.path}`;
        }

        _bindEntityEvents(entity) {
            this._entityEvents.push(entity.on('*:set', this._deferRefreshOverrides.bind(this)));
            this._entityEvents.push(entity.on('*:unset', this._deferRefreshOverrides.bind(this)));
            this._entityEvents.push(entity.on('*:insert', this._deferRefreshOverrides.bind(this)));
            this._entityEvents.push(entity.on('*:remove', this._deferRefreshOverrides.bind(this)));
            this._entityEvents.push(entity.on('*:move', this._deferRefreshOverrides.bind(this)));
        }

        _unbindEntityEvents() {
            this._entityEvents.forEach(evt => evt.unbind());
            this._entityEvents.length = 0;
        }

        _addOverride(override, elementDom) {
            const key = this._getMarkerKey(override);
            if (this._markers[key]) {
                this._markers[key].destroy();
            }

            if (elementDom.ui && elementDom.ui.hidden) return;

            const marker = new Marker(override, elementDom);
            this._markers[key] = marker;

            this.append(marker);

            const parentRect = this.parent.dom.getBoundingClientRect();
            let elementRect = elementDom.getBoundingClientRect();
            marker.style.top = (elementRect.top - parentRect.top) + 'px';

            const top = `${elementRect.top - parentRect.top - HIGHLIGHT_PADDING}px`;

            marker.on('hover', () => {
                if (this._hoveredElement === elementDom) return;

                this._hoveredElement = elementDom;

                const parentRect = this.parent.dom.getBoundingClientRect();
                let elementRect = elementDom.getBoundingClientRect();

                const right = `${parentRect.right - elementRect.right - HIGHLIGHT_PADDING}px`;
                const width = `${elementRect.width + 2 * HIGHLIGHT_PADDING}px`;
                const height = `${elementRect.height + 2 * HIGHLIGHT_PADDING}px`;

                this._elementHighlight.hidden = false;
                this._elementHighlight.style.width = width;
                this._elementHighlight.style.height = height;
                this._elementHighlight.style.right = right;
                this._elementHighlight.style.top = top;
            });

            marker.on('hoverend', () => {
                if (this._hoveredElement) {
                    this._hoveredElement = null;
                    this._elementHighlight.hidden = true;
                }
            });

            marker.on('click', (e) => {
                this._showDropdown(e, marker, override);
            });

            this.hidden = false;
        }

        _showDropdown(e, marker, override) {
            this._dropdownMenu.clear();

            if (this._dropdownMarker === marker) {
                this._dropdownMenu.hidden = !this._dropdownMenu.hidden;
            } else {
                this._dropdownMenu.hidden = false;
            }

            if (this._dropdownMenu.hidden) {
                this._dropdownMarker = null;
                return;
            }

            this._dropdownMarker = marker;

            const templates = editor.call('templates:findApplyCandidatesForOverride', override);

            templates.forEach(template => {
                const apply = new pcui.Label({
                    text: `Apply to ${template.get('name')}`
                });

                apply.on('click', () => {
                    this._dropdownMenu.hidden = true;
                    apply.enabled = false;
                    if (!editor.call('templates:applyOverride', template, override)) {
                        apply.enabled = true;
                    }
                });

                this._dropdownMenu.append(apply);
            });

            const revert = new pcui.Label({
                text: 'Revert'
            });

            revert.on('click', () => {
                this._dropdownMenu.hidden = true;
                editor.call('templates:revertOverride', override);
            });

            this._dropdownMenu.append(revert);

            this._positionDropdown(e);
        }

        _positionDropdown(e) {
            const parentRect = this.dom.getBoundingClientRect();
            this._dropdownMenu.style.top = `${e.clientY - parentRect.top}px`;
            this._dropdownMenu.style.right = '20px';
        }

        clearOverrides() {
            for (const key in this._markers) {
                this._markers[key].destroy();
            }
            this._markers = {};
            this.hidden = true;
        }

        hasOverrides() {
            return Object.keys(this._markers).length > 0;
        }

        registerElementForPath(path, elementDom) {
            this._registeredElements[path] = {
                elementDom: elementDom,
            };
        }

        unregisterElementForPath(path) {
            delete this._registeredElements[path];
        }

        unregisterAllElements() {
            this._registeredElements = {};
        }

        _refreshOverrides() {
            if (this._refreshTimeout) {
                clearTimeout(this._refreshTimeout);
                this._refreshTimeout = null;
            }

            this.clearOverrides();

            // find template parent
            let current = this._entity;
            while (current) {
                if (current.get('template_id')) {
                    break;
                }

                current = editor.call('entities:get', current.get('parent'));
            }

            if (!current) {
                return;
            }

            const resourceId = this._entity.get('resource_id');
            const overrides = editor.call('templates:computeFilteredOverrides', current);
            overrides.conflicts.forEach(override => {
                if (override.resource_id !== resourceId) return;

                const registered = this._registeredElements[override.path];
                if (registered) {
                    this._addOverride(override, registered.elementDom);
                }
            });
        }

        _deferRefreshOverrides() {
            if (this._refreshTimeout) {
                clearTimeout(this._refreshTimeout);
            }

            // use a slightly larger timeout to give time for the attributes panel to update
            // and do any initial scrolling before positioning our markers
            this._refreshTimeout = setTimeout(this._refreshOverrides.bind(this), 100);
        }

        link(entities) {
            this.unlink();

            if (entities.length !== 1) {
                return;
            }

            const entity = entities[0];

            if (this._entity === entity) return;


            this._entity = entity;

            this._evtPartOfTemplate = this._entity.on('isPartOfTemplate', (partOfTemplate) => {
                this._unbindEntityEvents();

                if (partOfTemplate) {
                    this._bindEntityEvents(this._entity);
                }

                this._deferRefreshOverrides();
            });

            if (this._entity.get('template_id') || editor.call('templates:isTemplateChild', this._entity)) {
                this._bindEntityEvents(this._entity);
            }

            // do this in a timeout to give a chance
            // to any inspectors to be created first and register
            // their elements
            this._deferRefreshOverrides();
        }

        unlink() {
            this._entity = null;

            if (this._evtPartOfTemplate) {
                this._evtPartOfTemplate.unbind();
                this._evtPartOfTemplate = null;
            }

            this._unbindEntityEvents();

            this.clearOverrides();
        }

        destroy() {
            if (this._destroyed) return;

            this._elementHighlight.destroy();

            super.destroy();
        }
    }

    return {
        TemplateOverrideSidebar: TemplateOverrideSidebar
    };
})());
