import { Container, Button, Panel, Label } from '@playcanvas/pcui';

import { AnimstategraphCondition } from './animstategraph-condition.ts';
import {
    ANIM_EQUAL_TO,
    ANIM_INTERRUPTION_NONE,
    ANIM_INTERRUPTION_NEXT,
    ANIM_INTERRUPTION_PREV,
    ANIM_INTERRUPTION_NEXT_PREV,
    ANIM_INTERRUPTION_PREV_NEXT
} from '../../../core/constants.ts';
import { AttributesInspector } from '../attributes-inspector.ts';

/**
 * @import { Attribute, Divider } from '../attribute.type.d.ts';
 */

const CLASS_ANIMSTATEGRAPH = 'asset-animstategraph-inspector';
const CLASS_ANIMSTATEGRAPH_TRANSITION = `${CLASS_ANIMSTATEGRAPH}-transition`;
const CLASS_ANIMSTATEGRAPH_TRANSITIONS = `${CLASS_ANIMSTATEGRAPH}-transitions`;
const CLASS_ANIMSTATEGRAPH_TRANSITION_CONDITIONS_NOTE = `${CLASS_ANIMSTATEGRAPH_TRANSITION}-conditions-note`;

// This helper function moves the the position of an item in the given array from the supplied old_index position to the new_index position.
// Used by the AnimstategraphTransitions class to update the transitions order when the _onDragEnd event is fired.
function arrayMove(arr, old_index, new_index) {
    if (new_index >= arr.length) {
        let k = new_index - arr.length + 1;
        while (k--) {
            arr.push(undefined);
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr;
}

class TransitionInspector extends AttributesInspector {
    unlink() {
        Object.keys(this._fields).forEach((k) => {
            this._fields[k].blur();
        });
        super.unlink();
    }
}

class AnimstategraphTransitions extends Container {
    constructor(args, view) {
        super({
            args: Object.assign({}, args),
            class: CLASS_ANIMSTATEGRAPH_TRANSITIONS,
            enabled: !view.parent.readOnly
        });
        this._view = view;
        this._args = args;
        this._assets = null;

        this._newTransitionButton = new Button({
            text: 'NEW TRANSITION',
            icon: 'E120'
        });
        this._newTransitionButton.on('click', () => {
            if (this._assets === null) {
                return;
            }
            const data = this._assets[0].get('data');
            const transitionId = Number(`${Date.now()}${Math.floor(Math.random() * 10000)}`);
            data.transitions[transitionId] = {
                from: this._edgeData.from,
                to: this._edgeData.to,
                edgeType: 1,
                exitTime: 0,
                conditions: {}
            };
            data.layers[this._selectedLayer].transitions.push(transitionId);
            this._assets[0].set('data', data);
            this.link(this._assets, this._selectedLayer, data.transitions[transitionId]);
        });
        this.append(this._newTransitionButton);

        this._transitionsContainer = new Container();
        this.append(this._transitionsContainer);
        this._transitionsContainer.on('child:dragend', this._onDragEnd.bind(this));
    }

    _onDragEnd(_, newIndex, oldIndex) {
        let transitions = this._assets[0].get(`data.layers.${this._selectedLayer}.transitions`).filter((transitionId) => {
            const transition = this._assets[0].get(`data.transitions.${transitionId}`);
            return this._edge === `${transition.from}-${transition.to}`;
        }).map((transitionId) => {
            const transition = this._assets[0].get(`data.transitions.${transitionId}`);
            return {
                transition,
                id: transitionId
            };
        });
        transitions.sort((a, b) => {
            return a.transition.priority - b.transition.priority;
        });
        transitions = arrayMove(transitions, oldIndex, newIndex);
        const data = this._assets[0].get('data');
        transitions = transitions.forEach((item, i) => {
            data.transitions[item.id] = Object.assign(item.transition, { priority: i });
        });
        this._transitionsContainer.forEachChild((child, i) => {
            child.headerText = i + 1;
        });
        this._assets[0].set('data', data);
    }

    _deleteCondition(transitionId, conditionId) {
        const conditions = this._assets[0].get(`data.transitions.${transitionId}.conditions`);
        delete conditions[conditionId];
        this._assets[0].set(`data.transitions.${transitionId}.conditions`, conditions);
    }

    _addNewCondition(transitionId) {
        const conditions = this._assets[0].get(`data.transitions.${transitionId}.conditions`);
        const maxKey = Math.max(...Object.keys(conditions));
        const key = Number.isFinite(maxKey) ? maxKey + 1 : 0;
        conditions[key] = {
            parameterName: null,
            predicate: ANIM_EQUAL_TO,
            value: 0.0
        };
        this._assets[0].set(`data.transitions.${transitionId}.conditions`, conditions);
    }

    link(assets, layer, edge) {
        this.unlink();
        this._assets = assets;
        this._selectedLayer = layer;
        this._edge = `${edge.from}-${edge.to}`;
        this._edgeData = edge;

        let transitions = this._assets[0].get(`data.layers.${layer}.transitions`);
        if (!Array.isArray(transitions)) {
            return;
        }

        transitions = transitions.map((transitionId) => {
            const transition = this._assets[0].get(`data.transitions.${transitionId}`);
            return {
                transitionId,
                transition
            };
        });
        transitions = transitions.filter((item) => {
            return !(edge.from !== item.transition.from || edge.to !== item.transition.to);
        });
        transitions.sort((a, b) => {
            return a.transition.priority - b.transition.priority;
        });

        transitions.forEach((item, i) => {
            const { transition, transitionId } = item;
            let parameters = this._assets[0].get('data.parameters');
            parameters = Object.keys(parameters).map((key) => {
                return parameters[key].name;
            });

            /**
             * @type {(Attribute | Divider)[]}
             */
            const ATTRIBUTES = [
                {
                    label: 'Duration',
                    path: `data.transitions.${transitionId}.time`,
                    reference: 'asset:anim:transition:time',
                    type: 'number',
                    args: {
                        allowNull: true,
                        hideSlider: true
                    }
                },
                {
                    label: 'Offset',
                    path: `data.transitions.${transitionId}.transitionOffset`,
                    reference: 'asset:anim:transition:transitionOffset',
                    type: 'slider',
                    args: {
                        min: 0,
                        max: 1
                    }
                },
                {
                    label: 'Interruption Source',
                    path: `data.transitions.${transitionId}.interruptionSource`,
                    reference: 'asset:anim:transition:interruptionSource',
                    type: 'select',
                    args: {
                        type: 'string',
                        options: [
                            {
                                v: ANIM_INTERRUPTION_NONE,
                                t: 'None'
                            },
                            {
                                v: ANIM_INTERRUPTION_NEXT,
                                t: 'Next'
                            },
                            {
                                v: ANIM_INTERRUPTION_PREV,
                                t: 'Prev'
                            },
                            {
                                v: ANIM_INTERRUPTION_NEXT_PREV,
                                t: 'Next then Prev'
                            },
                            {
                                v: ANIM_INTERRUPTION_PREV_NEXT,
                                t: 'Prev then Next'
                            }
                        ]
                    }
                },
                {
                    type: 'divider'
                },
                {
                    label: 'Has Exit Time',
                    alias: 'hasExitTime',
                    type: 'boolean'
                },
                {
                    label: 'Exit Time',
                    path: `data.transitions.${transitionId}.exitTime`,
                    reference: 'asset:anim:transition:exitTime',
                    type: 'number',
                    args: {
                        min: 0
                    }
                },
                {
                    label: 'Conditions',
                    alias: 'conditions',
                    reference: 'asset:anim:transition:conditions',
                    type: 'button',
                    args: {
                        text: 'New Condition'
                    }
                }
            ];

            const transitionPanel = new Panel({
                headerText: edge.from === 0 ? 'Default Transition' : i + 1,
                class: CLASS_ANIMSTATEGRAPH_TRANSITION,
                collapsible: true,
                removable: !transition.defaultTransition,
                sortable: true
            });
            transitionPanel.disabled = transition.defaultTransition;

            transitionPanel.on('click:remove', () => {
                this._view._onDeleteEdge({ edgeId: transitionId });
                if (this._assets) {
                    this.link(this._assets, layer, edge);
                }
            });

            const transitionInspector = new TransitionInspector({
                assets: this._args.assets,
                history: this._args.history,
                attributes: ATTRIBUTES
            });

            transitionInspector.link(this._assets);
            transitionPanel.append(transitionInspector);
            transitionPanel.inspector = transitionInspector;
            const conditions = transitionInspector.getField('conditions');
            if (conditions) {
                conditions.on('click', () => {
                    this._addNewCondition(transitionId);
                });
            }
            this._transitionsContainer.append(transitionPanel);
            if (!this._transitionPanels) {
                this._transitionPanels = [];
            }
            this._transitionPanels.push(transitionPanel);

            transitionPanel.conditions = new Container();
            Object.keys(transition.conditions).forEach((conditionId) => {
                const condition = new AnimstategraphCondition({
                    parameters: parameters,
                    onDelete: () => {
                        this._deleteCondition(transitionId, conditionId);
                    }
                });
                condition.link(this._assets, `data.transitions.${transitionId}.conditions.${conditionId}`);
                transitionPanel.conditions.append(condition);
            });

            if (Object.keys(transition.conditions).length > 0) {
                transitionPanel.append(transitionPanel.conditions);
            }

            const addConditions = () => {
                if (!this._assets) {
                    return;
                }
                parameters = this._assets[0].get('data.parameters');
                parameters = Object.keys(parameters).map((key) => {
                    return parameters[key].name;
                });
                const transition = this._assets[0].get(`data.transitions.${transitionId}`);
                if (transitionPanel.conditions) {
                    transitionPanel.remove(transitionPanel.conditions);
                }
                transitionPanel.conditions = new Container();
                Object.keys(transition.conditions).forEach((conditionId) => {
                    const condition = new AnimstategraphCondition({
                        parameters: parameters,
                        onDelete: () => {
                            this._deleteCondition(transitionId, conditionId);
                        }
                    });
                    condition.link(this._assets, `data.transitions.${transitionId}.conditions.${conditionId}`);
                    transitionPanel.conditions.append(condition);
                });
                if (Object.keys(transition.conditions).length > 0) {
                    transitionPanel.append(transitionPanel.conditions);
                }
            };

            const hasExitTimeField = transitionInspector.getField('hasExitTime');
            hasExitTimeField.value = this._assets[0].get(`data.transitions.${transitionId}.exitTime`) > 0;
            const exitTimeField = transitionInspector.getField(`data.transitions.${transitionId}.exitTime`);
            exitTimeField.enabled = hasExitTimeField.value;
            let lastExitTimeValue = this._assets[0].get(`data.transitions.${transitionId}.exitTime`) || 1;
            hasExitTimeField.on('change', (value) => {
                if (value) {
                    this._assets[0].set(`data.transitions.${transitionId}.exitTime`, lastExitTimeValue);
                } else {
                    this._assets[0].set(`data.transitions.${transitionId}.exitTime`, 0);
                }
                exitTimeField.enabled = value;
            });

            const conditionNote = new Label({
                class: CLASS_ANIMSTATEGRAPH_TRANSITION_CONDITIONS_NOTE,
                text: 'Note: No Exit Time or Conditions set - transition will activate instantly.'
            });
            const hideConditionNote = () => {
                const hasConditions = Object.keys(this._assets[0].get(`data.transitions.${transitionId}.conditions`)).length > 0;
                const hasExitTime = this._assets[0].get(`data.transitions.${transitionId}.exitTime`) > 0;
                return hasExitTime || hasConditions;
            };
            conditionNote.hidden = hideConditionNote();
            transitionPanel.append(conditionNote);

            this._onAssetUpdateEvent = this._assets[0].on('*:set', (path) => {
                if (path.includes('exitTime')) {
                    conditionNote.hidden = hideConditionNote();
                    const exitTime = this._assets[0].get(`data.transitions.${transitionId}.exitTime`);
                    hasExitTimeField.value = exitTime > 0;
                    if (exitTime > 0) {
                        lastExitTimeValue = exitTime;
                    }
                } else if (!path || path.includes('parameters') || path.includes(`transitions.${transitionId}`) && transition.conditions) {
                    addConditions(path);
                    conditionNote.hidden = hideConditionNote();
                }
            });

            this._onParamDeleteEvent = assets[0].on('*:unset', (path, value) => {
                if (path.match(/data.parameters.\d*$/)) {
                    addConditions();
                }
            });

        });
        this._newTransitionButton.hidden = edge.defaultTransition;
        this.parent.headerText = 'TRANSITION';
    }

    unlink() {
        super.unlink();
        if (this._assets) {
            this._assets = null;
            if (this._transitionPanels) {
                this._transitionPanels.forEach((transitionPanel) => {
                    transitionPanel.inspector.unlink();
                    this._transitionsContainer.remove(transitionPanel);
                });
            }
            delete this._transitionPanels;
        }
        if (this._onAssetUpdateEvent) {
            this._onAssetUpdateEvent.unbind();
            this._onAssetUpdateEvent = null;
        }
        if (this._onParamDeleteEvent) {
            this._onParamDeleteEvent.unbind();
            this._onParamDeleteEvent = null;
        }
        this._newTransitionButton.hidden = true;
        this.parent.headerText = 'INSPECTOR';
    }
}

export { AnimstategraphTransitions };
