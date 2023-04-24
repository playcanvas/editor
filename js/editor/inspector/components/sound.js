import { Panel, Container, Button } from '@playcanvas/pcui';
import { ComponentInspector } from './component.js';

const COMPONENT_ATTRIBUTES = [{
    label: 'Positional',
    path: 'components.sound.positional',
    type: 'boolean',
    reference: 'sound:positional'
}, {
    label: 'Volume',
    path: 'components.sound.volume',
    type: 'slider',
    args: {
        precision: 2,
        step: 0.01,
        min: 0,
        max: 1
    },
    reference: 'sound:volume'
}, {
    label: 'Pitch',
    path: 'components.sound.pitch',
    type: 'number',
    args: {
        min: 0,
        step: 0.1
    },
    reference: 'sound:pitch'
}, {
    label: 'Ref Distance',
    path: 'components.sound.refDistance',
    type: 'number',
    args: {
        min: 0,
        step: 1,
        precision: 2
    },
    reference: 'sound:refDistance'
}, {
    label: 'Max Distance',
    path: 'components.sound.maxDistance',
    type: 'number',
    args: {
        min: 0,
        step: 1,
        precision: 2
    },
    reference: 'sound:maxDistance'
}, {
    label: 'Distance Model',
    path: 'components.sound.distanceModel',
    type: 'select',
    args: {
        type: 'string',
        options: [{
            v: 'linear', t: 'Linear'
        }, {
            v: 'exponential', t: 'Exponential'
        }, {
            v: 'inverse', t: 'Inverse'
        }]
    },
    reference: 'sound:distanceModel'
}, {
    label: 'Roll-off Factor',
    path: 'components.sound.rollOffFactor',
    type: 'number',
    args: {
        min: 0,
        precision: 2,
        step: 0.1
    },
    reference: 'sound:rollOffFactor'
}];

const SLOT_ATTRIBUTES = [{
    label: 'Name',
    path: 'components.sound.slots.$.name',
    type: 'string',
    reference: 'sound:slot:name'
}, {
    label: 'Asset',
    type: 'asset',
    path: 'components.sound.slots.$.asset',
    args: {
        assetType: 'audio'
    },
    reference: 'sound:slot:asset'
}, {
    label: 'Start Time',
    type: 'number',
    path: 'components.sound.slots.$.startTime',
    args: {
        min: 0,
        precision: 2,
        step: 0.01
    },
    reference: 'sound:slot:startTime'
}, {
    label: 'Duration',
    type: 'number',
    path: 'components.sound.slots.$.duration',
    args: {
        min: 0,
        precision: 2,
        step: 0.01,
        allowNull: true
    },
    reference: 'sound:slot:duration'
}, {
    label: 'Auto Play',
    type: 'boolean',
    path: 'components.sound.slots.$.autoPlay',
    reference: 'sound:slot:autoPlay'
}, {
    label: 'Overlap',
    type: 'boolean',
    path: 'components.sound.slots.$.overlap',
    reference: 'sound:slot:overlap'
}, {
    label: 'Loop',
    type: 'boolean',
    path: 'components.sound.slots.$.loop',
    reference: 'sound:slot:loop'
}, {
    label: 'Volume',
    type: 'slider',
    path: 'components.sound.slots.$.volume',
    args: {
        min: 0,
        max: 1,
        precision: 2,
        step: 0.01
    },
    reference: 'sound:slot:volume'
}, {
    label: 'Pitch',
    type: 'number',
    path: 'components.sound.slots.$.pitch',
    args: {
        precision: 2,
        step: 0.1,
        min: 0
    },
    reference: 'sound:slot:pitch'
}];

const CLASS_SLOT = 'sound-component-inspector-slot';

class SoundSlotInspector extends Panel {
    constructor(args) {
        args = Object.assign({
            headerText: args.slot.name || 'New Slot',
            collapsible: true
        }, args);

        super(args);

        this.class.add(CLASS_SLOT);

        this._entities = null;
        this._slotEvents = [];

        this._templateOverridesInspector = args.templateOverridesInspector;

        this._slotKey = args.slotKey;

        this._attrs = utils.deepCopy(SLOT_ATTRIBUTES);
        // replace '$' with the actual slot key
        this._attrs.forEach((attr) => {
            attr.path = attr.path.replace('$', args.slotKey);
        });

        this._inspector = new pcui.AttributesInspector({
            attributes: this._attrs,
            assets: args.assets,
            history: args.history,
            templateOverridesInspector: this._templateOverridesInspector
        });

        this.append(this._inspector);

        if (this._templateOverridesInspector) {
            this._templateOverridesInspector.registerElementForPath(`components.sound.slots.${this._slotKey}`, this);
        }

        const fieldName = this._inspector.getField(this._getPathTo('name'));
        fieldName.on('change', (value) => {
            this.headerText = value;
        });
    }

    _getPathTo(field) {
        return `components.sound.slots.${this._slotKey}.${field}`;
    }

    _onClickRemove(evt) {
        super._onClickRemove(evt);
        if (this._entities && this._entities.length) {
            this._entities[0].unset(`components.sound.slots.${this._slotKey}`);
        }
    }

    link(entities) {
        this.unlink();

        this._entities = entities;

        this._inspector.link(entities);

        const fieldName = this._inspector.getField(this._getPathTo('name'));

        // if the name already exists show error
        fieldName.onValidate = (value) => {
            if (!value) return false;

            const slots = entities[0].get('components.sound.slots');
            for (const key in slots) {
                if (slots[key].name === value) {
                    return false;
                }
            }

            return true;
        };
    }

    unlink() {
        if (!this._entities) return;

        this._entities = null;

        this._slotEvents.forEach(e => e.unbind());
        this._slotEvents.length = 0;

        this._inspector.unlink();
    }

    destroy() {
        if (this._destroyed) return;

        if (this._templateOverridesInspector) {
            this._templateOverridesInspector.unregisterElementForPath(`components.sound.slots.${this._slotKey}`);
        }

        super.destroy();
    }
}

class SoundComponentInspector extends ComponentInspector {
    constructor(args) {
        args = Object.assign({}, args);
        args.component = 'sound';

        super(args);

        this._assets = args.assets;

        this._attributesInspector = new pcui.AttributesInspector({
            history: args.history,
            assets: args.assets,
            attributes: COMPONENT_ATTRIBUTES,
            templateOverridesInspector: this._templateOverridesInspector
        });
        this.append(this._attributesInspector);

        this._containerSlots = new Container({
            flex: true
        });
        this.append(this._containerSlots);

        this._slotInspectors = {};

        this._btnAddSlot = new Button({
            text: 'ADD SLOT',
            icon: 'E120',
            flexGrow: 1,
            hidden: true
        });
        this.append(this._btnAddSlot);

        this._field('positional').on('change', this._toggleFields.bind(this));

        this._suppressToggleFields = false;
    }

    _field(name) {
        return this._attributesInspector.getField(`components.sound.${name}`);
    }

    _toggleFields() {
        if (this._suppressToggleFields) return;

        const positional = this._field('positional').value;
        this._field('refDistance').parent.hidden = !positional;
        this._field('maxDistance').parent.hidden = !positional;
        this._field('distanceModel').parent.hidden = !positional;
        this._field('rollOffFactor').parent.hidden = !positional;
    }

    _onClickAddSlot(entity) {
        let keyName = 1;
        let count = 0;
        const idx = {};
        const slots = entity.get('components.sound.slots');
        for (const key in slots) {
            keyName = parseInt(key, 10);
            idx[slots[key].name] = true;
            count++;
        }

        keyName++;
        let name = `Slot ${count + 1}`;
        while (idx[name]) {
            count++;
            name = `Slot ${count + 1}`;
        }

        entity.set(`components.sound.slots.${keyName}`, {
            name: name,
            loop: false,
            autoPlay: false,
            overlap: false,
            asset: null,
            startTime: 0,
            duration: null,
            volume: 1,
            pitch: 1
        });
    }

    _createSlotInspector(entity, slotKey, slot) {
        const inspector = new SoundSlotInspector({
            slotKey: slotKey,
            slot: slot,
            history: this._history,
            assets: this._assets,
            removable: true,
            templateOverridesInspector: this._templateOverridesInspector
        });

        this._containerSlots.append(inspector);

        this._slotInspectors[slotKey] = inspector;

        inspector.link([entity]);

        return inspector;
    }

    link(entities) {
        super.link(entities);

        this._suppressToggleFields = true;
        this._attributesInspector.link(entities);
        this._suppressToggleFields = false;
        this._toggleFields();

        if (entities.length === 1) {
            this._btnAddSlot.hidden = false;

            // event for new slots
            this._entityEvents.push(entities[0].on('*:set', (path, value) => {
                var matches = path.match(/^components.sound.slots.(\d+)$/);
                if (!matches) return;

                // if inspector already exists then do not create a new one
                if (this._slotInspectors[matches[1]]) return;

                this._createSlotInspector(entities[0], matches[1], value);
            }));

            // event for deleted slots
            this._entityEvents.push(entities[0].on('*:unset', (path) => {
                var matches = path.match(/^components.sound.slots.(\d+)$/);
                if (!matches) return;

                const inspector = this._slotInspectors[matches[1]];
                if (inspector) {
                    inspector.destroy();
                    delete this._slotInspectors[matches[1]];
                }
            }));

            // create all existing slots
            const slots = entities[0].get('components.sound.slots');
            for (const key in slots) {
                this._createSlotInspector(entities[0], key, slots[key]);
            }

            // register click add slots
            this._entityEvents.push(
                this._btnAddSlot.on('click', () => this._onClickAddSlot(entities[0]))
            );
        }
    }

    unlink() {
        super.unlink();
        this._attributesInspector.unlink();

        for (const key in this._slotInspectors) {
            this._slotInspectors[key].destroy();
        }
        this._slotInspectors = {};

        this._btnAddSlot.hidden = true;
    }
}

export { SoundComponentInspector };
