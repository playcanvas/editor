import { Panel, Button } from '@playcanvas/pcui';
import { AttributesInspector } from '../attributes.js';

const CLASS_ROOT = 'pcui-asset-animation-inspector';
const CLASS_EVENT_PANEL = CLASS_ROOT + '-event-panel';

const ATTRIBUTES = [{
    label: 'Duration',
    path: 'meta.duration',
    type: 'label',
    args: {
        placeholder: 'Seconds'
    }
},
{
    label: 'Name',
    path: 'meta.name',
    type: 'label'
}];

ATTRIBUTES.forEach((attr) => {
    const path = attr.alias || attr.path;
    if (!path) return;
    const parts = path.split('.');
    attr.reference = `asset:animation:${parts[parts.length - 1]}`;
});

const DOM = () => [
    {
        eventsPanel: new Panel({
            headerText: 'EVENTS'
        })
    }
];

class AnimationAssetInspector extends Panel {
    constructor(args) {
        args = Object.assign({}, args);
        args.headerText = 'META';

        super(args);

        this._args = args;

        this._attributesInspector = new AttributesInspector({
            assets: args.assets,
            history: args.history,
            attributes: ATTRIBUTES
        });
        this.append(this._attributesInspector);

        this.buildDom(DOM(this));
        this._addEventButton = new Button({ icon: 'E120', text: 'EVENT' });
        this._addEventButton.on('click', this.addEvent.bind(this));
        this._eventsPanel.header.append(this._addEventButton);
        this._eventPanels = {};
        this._evts = [];
    }

    addEvent() {
        let events = this._assets[0].get('data.events');
        if (!events) events = {};
        events[Object.keys(events).length] = {
            name: 'event',
            time: 0
        };
        this._assets[0].set('data', { events });
    }

    removeEvent(eventKey) {
        const events = this._assets[0].get('data.events');
        delete events[eventKey];
        this._assets[0].set('data', { events });
    }

    addEventPanels() {
        this._eventsPanel.content.clear();
        this._eventPanels = {};
        const events = Object.keys(this._assets[0].get('data.events'));
        events.sort((a, b) => {
            return this._assets[0].get(`data.events.${a}.time`) - this._assets[0].get(`data.events.${b}.time`);
        });
        events.forEach((eventKey) => {
            const event = this._assets[0].get(`data.events.${eventKey}`);
            const eventPanel = new Panel({
                class: CLASS_EVENT_PANEL,
                headerText: event.name,
                removable: true
            });
            eventPanel.on('click:remove', () => {
                this.removeEvent(eventKey);
            });
            const eventAttributesInspector = new AttributesInspector({
                assets: this._args.assets,
                history: this._args.history,
                attributes: [
                    {
                        label: 'time',
                        type: 'number',
                        path: `data.events.${eventKey}.time`,
                        args: {
                            hideSlider: true
                        }
                    },
                    {
                        label: 'name',
                        type: 'string',
                        path: `data.events.${eventKey}.name`
                    },
                    {
                        label: 'number',
                        type: 'number',
                        path: `data.events.${eventKey}.number`,
                        args: {
                            allowNull: true
                        }
                    },
                    {
                        label: 'string',
                        type: 'string',
                        path: `data.events.${eventKey}.string`
                    }
                ]
            });
            eventAttributesInspector.link(this._assets);
            eventPanel.append(eventAttributesInspector);
            this._eventsPanel.content.append(eventPanel);
            this._eventPanels[eventKey] = eventPanel;
        });
    }

    link(assets) {
        this.unlink();
        this._assets = assets;
        this._attributesInspector.link(assets);

        if (this._assets.length === 1 && this._assets[0].get('file.filename').match(/\.glb$/)) {
            this._eventsPanel.hidden = false;
            this._evts.push(assets[0].on('*:set', (path, value) => {
                if (path.match(/^data\.events\.*.\.name$/)) {
                    const eventKey = path.split('.')[2];
                    if (this._eventPanels[eventKey]) {
                        this._eventPanels[eventKey].headerText = value;
                    }
                } else if (path.match(/^data\.events\.*.\.time$/) || path === 'data') {
                    this.addEventPanels();
                }
            }));
            if (assets[0].get('data.events')) {
                this.addEventPanels();
            }
        } else {
            this._eventsPanel.hidden = true;
        }
    }

    unlink() {
        this._attributesInspector.unlink();
        if (this._assets) {
            this._eventsPanel.content.clear();
            this._eventPanels = {};
            this._evts.forEach(e => e.unbind());
            this._evts = [];
        }
    }
}

export { AnimationAssetInspector };
