Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'template-override-sidebar';
    const CLASS_MARKER = CLASS_ROOT + '-marker';
    const CLASS_MARKER_SCROLLING = CLASS_MARKER + '-scrolling';
    const CLASS_DROPDOWN_MENU = CLASS_ROOT + '-dropdown';

    class Marker extends pcui.Element {
        constructor(override, elementDom, containerDom) {
            super(document.createElement('div'));

            this.class.add(CLASS_MARKER);

            this._override = override;
            this._elementDom = elementDom;
            this._containerDom = containerDom;

            this._evtScroll = this._onContainerScroll.bind(this);
            this._containerDom.addEventListener('scroll', this._evtScroll);

            this._endScrollTimeout = null;

            this._positionMarker();
        }

        _onContainerScroll() {
            this.class.add(CLASS_MARKER_SCROLLING);
            if (this._endScrollTimeout) {
                clearTimeout(this._endScrollTimeout);
                this._endScrollTimeout = null;
            }

            this._endScrollTimeout = setTimeout(this._endScroll.bind(this), 100);

            this._positionMarker();
        }

        _endScroll() {
            if (this._endScrollTimeout) {
                clearTimeout(this._endScrollTimeout);
                this._endScrollTimeout = null;
            }

            this.class.remove(CLASS_MARKER_SCROLLING);
        }

        _positionMarker() {
            const rect = this._elementDom.getBoundingClientRect();
            this.style.top = rect.top + 'px';
        }

        destroy() {
            if (this._destroyed) return;

            this._containerDom.removeEventListener('scroll', this._evtScroll);

            window.removeEventListener('click', this._evtWindowClick);

            if (this._endScrollTimeout) {
                clearTimeout(this._endScrollTimeout);
                this._endScrollTimeout = null;
            }

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

            this._entityEvents = [];
            this._evtPartOfTemplate = null;

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

        _addOverride(override, elementDom, containerDom) {
            const key = this._getMarkerKey(override);
            if (this._markers[key]) {
                this._markers[key].destroy();
            }

            const marker = new Marker(override, elementDom, containerDom);
            this._markers[key] = marker;

            this.append(marker);

            marker.on('hover', () => {
                if (this._hoveredElement === elementDom) return;
                if (this._hoveredElement) {
                    this._hoveredElement.style.filter = '';
                }

                this._hoveredElement = elementDom;
                this._hoveredElement.style.filter = 'saturate(4)';
            });

            marker.on('hoverend', () => {
                if (this._hoveredElement) {
                    this._hoveredElement.style.filter = '';
                    this._hoveredElement = null;
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

        registerElementForPath(path, elementDom, containerDom) {
            this._registeredElements[path] = {
                elementDom,
                containerDom
            };
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

            const overrides = editor.call('templates:computeOverrides', current);
            overrides.conflicts.forEach(override => {
                const registered = this._registeredElements[override.path];
                if (registered) {
                    this._addOverride(override, registered.elementDom, registered.containerDom);
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

        get entity() {
            return this._entity;
        }

        set entity(value) {
            if (this._entity === value) return;

            if (this._entity) {
                if (this._evtPartOfTemplate) {
                    this._evtPartOfTemplate.unbind();
                    this._evtPartOfTemplate = null;
                }

                this._unbindEntityEvents();
            }

            this._entity = value;
            this.clearOverrides();
            this.unregisterAllElements();

            if (!this._entity) {
                return;
            }

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
    }

    return {
        TemplateOverrideSidebar: TemplateOverrideSidebar
    };
})());
