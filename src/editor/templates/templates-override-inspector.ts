import { tooltipOverrideItem } from '../../common/tooltips.ts';

/**
 * @import { Observer, ObserverList, EventHandle } from '@playcanvas/observer'
 * @import { Element, Container } from '@playcanvas/pcui';
 */

const CLASS_OVERRIDE = 'template-inspector-override';

/**
 * Handles highlighting template overrides on various elements and showing relevant tooltips.
 */
class TemplateOverrideInspector {
    /**
     * @type {Record<string, { element: Element, tooltipItem: Container }>}
     */
    _overrides = {};

    /**
     * @type {Record<string, { element: Element, tooltipGroup: Container }>}
     */
    _registeredElements = {};

    /**
     * @type {EventHandle[]}
     */
    _entityEvents = [];

    /**
     * @type {EventHandle | null}
     */
    _evtPartOfTemplate = null;

    /**
     * Creates new instance of the class.
     *
     * @param {object} args - The arguments.
     * @param {ObserverList} args.entities - The entities observer list.
     */
    constructor(args) {
        this._entities = args.entities;

        this._evtMessenger = editor.on('messenger:template.apply', this._onTemplateApply.bind(this));
    }

    _onTemplateApply(data) {
        // if current entity is part of this template
        // then refresh overrides
        if (!this._entity) {
            return;
        }

        const template = this._entities.get(data.entity_id);
        if (!template) {
            return;
        }

        if (!template.has(`template_ent_ids.${this._entity.get('resource_id')}`)) {
            return;
        }

        this._deferRefreshOverrides();
    }

    _getOverrideKey(override) {
        return `${override.override_type}${override.resource_id}${override.path}`;
    }

    /**
     * @param {Observer} entity - The entity to bind events to.
     */
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

    _addOverride(override, templateRoot) {
        const registered = this._registeredElements[override.path];
        if (!registered) {
            return;
        }

        const key = this._getOverrideKey(override);

        // add override class to element
        registered.element.class.add(CLASS_OVERRIDE);

        // create template override tooltip
        const tooltipItem = tooltipOverrideItem({
            templateRoot: templateRoot,
            entities: this._entities,
            override: override
        });
        registered.tooltipGroup?.append(tooltipItem);

        this._overrides[key] = {
            element: registered.element,
            tooltipItem
        };
    }

    _clearOverrides() {
        for (const key in this._overrides) {
            const override = this._overrides[key];
            if (!override.element.destroyed) {
                override.element.class.remove(CLASS_OVERRIDE);
            }

            override.tooltipItem.destroy();
        }

        this._overrides = {};
    }

    _refreshOverrides() {
        if (this._refreshTimeout) {
            clearTimeout(this._refreshTimeout);
            this._refreshTimeout = null;
        }

        this._clearOverrides();

        // find template parent
        let current = this._entity;
        while (current) {
            if (current.get('template_id')) {
                break;
            }

            current = this._entities.get(current.get('parent'));
        }

        if (!current) {
            return;
        }

        const resourceId = this._entity.get('resource_id');
        const overrides = editor.call('templates:computeFilteredOverrides', current);
        if (overrides) {
            overrides.conflicts.forEach((override) => {
                if (override.resource_id !== resourceId) {
                    return;
                }

                this._addOverride(override, current);
            });
        }
    }

    _deferRefreshOverrides() {
        if (this._refreshTimeout) {
            clearTimeout(this._refreshTimeout);
        }

        this._refreshTimeout = setTimeout(this._refreshOverrides.bind(this), 100);
    }

    /**
     * Registers an element and a tooltip group with a template override path. Whenever that path
     * has a template override the provided element will have a CSS class applied to it and a
     * tooltip will be created for that override.
     *
     * @param {string} path - The observer path for the override.
     * @param {Element} element - The element that we will highlight when an override appears.
     * @param {Container} [tooltipGroup] - An optional tooltip group to use for the override
     * tooltip. If one is not provided then the tooltip will be attached to the element itself.
     */
    registerElementForPath(path, element, tooltipGroup) {
        this._registeredElements[path] = {
            element,
            tooltipGroup
        };
    }

    /**
     * Unregister the specified override path.
     *
     * @param {string} path - The override path.
     */
    unregisterElementForPath(path) {
        delete this._registeredElements[path];
    }

    /**
     * The current entity we are inspecting for overrides.
     *
     * @type {Observer}
     */
    set entity(value) {
        if (this._entity === value) {
            return;
        }

        if (this._entity) {
            this._entity = null;

            if (this._evtPartOfTemplate) {
                this._evtPartOfTemplate.unbind();
                this._evtPartOfTemplate = null;
            }

            this._unbindEntityEvents();

            this._clearOverrides();
        }

        this._entity = value;

        if (this._entity) {
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

    get entity() {
        return this._entity;
    }
}

export { TemplateOverrideInspector };
