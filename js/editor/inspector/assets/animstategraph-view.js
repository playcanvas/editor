import { AnimstategraphState } from './animstategraph-state.js';

const GRAPH_ACTIONS = {
    ADD_NODE: 'EVENT_ADD_NODE',
    UPDATE_NODE_POSITION: 'EVENT_UPDATE_NODE_POSITION',
    UPDATE_NODE_ATTRIBUTE: 'EVENT_UPDATE_NODE_ATTRIBUTE',
    DELETE_NODE: 'EVENT_DELETE_NODE',
    SELECT_NODE: 'EVENT_SELECT_NODE',
    ADD_EDGE: 'EVENT_ADD_EDGE',
    DELETE_EDGE: 'EVENT_DELETE_EDGE',
    SELECT_EDGE: 'EVENT_SELECT_EDGE',
    DESELECT_ITEM: 'EVENT_DESELECT_ITEM',
    UPDATE_TRANSLATE: 'EVENT_UPDATE_TRANSLATE',
    UPDATE_SCALE: 'EVENT_UPDATE_SCALE'
};

const ANIM_SCHEMA = {
    NODE: {
        STATE: 0,
        DEFAULT_STATE: 1,
        START_STATE: 3,
        ANY_STATE: 4,
        END_STATE: 5
    },
    EDGE: {
        TRANSITION_DEFAULT: 0,
        TRANSITION: 1,
        TRANSITION_FROM_ANY: 3
    }
};

const updateNodeHeaderText = (attributes, nodeId, asset) => {
    if (AnimstategraphState.validateStateName(nodeId, attributes.name, asset)) {
        return attributes.name;
    }
    return null;
};

const animSchema = asset => ({
    nodes: {
        [ANIM_SCHEMA.NODE.STATE]: {
            name: 'state',
            fill: 'rgb(54, 67, 70, 0.8)',
            stroke: '#20292b',
            icon: '',
            iconColor: '#FFFFFF',
            headerTextFormatter: (attributes, nodeId) => updateNodeHeaderText(attributes, nodeId, asset),
            contextMenuItems: [
                {
                    text: 'Add transition',
                    action: GRAPH_ACTIONS.ADD_EDGE,
                    edgeType: ANIM_SCHEMA.EDGE.TRANSITION
                },
                {
                    text: 'Delete state',
                    action: GRAPH_ACTIONS.DELETE_NODE
                }
            ],
            attributes: [
                {
                    name: 'name',
                    type: 'TEXT_INPUT'
                },
                {
                    name: 'speed',
                    type: 'NUMERIC_INPUT'
                },
                {
                    name: 'loop',
                    type: 'BOOLEAN_INPUT'
                }
            ]
        },
        [ANIM_SCHEMA.NODE.DEFAULT_STATE]: {
            name: 'state',
            fill: 'rgb(54, 67, 70, 0.8)',
            stroke: '#20292b',
            icon: '',
            iconColor: '#FFFFFF',
            headerTextFormatter: (attributes, nodeId) => updateNodeHeaderText(attributes, nodeId, asset),
            contextMenuItems: [
                {
                    text: 'Add transition',
                    action: GRAPH_ACTIONS.ADD_EDGE,
                    edgeType: ANIM_SCHEMA.EDGE.TRANSITION
                }
            ],
            attributes: [
                {
                    name: 'name',
                    type: 'TEXT_INPUT'
                },
                {
                    name: 'speed',
                    type: 'NUMERIC_INPUT'
                },
                {
                    name: 'loop',
                    type: 'BOOLEAN_INPUT'
                }
            ]
        },
        [ANIM_SCHEMA.NODE.START_STATE]: {
            name: 'startState',
            fill: 'rgb(54, 67, 70, 0.8)',
            icon: '',
            iconColor: '#14CC47',
            stroke: '#20292b',
            contextMenuItems: [
            ]
        },
        [ANIM_SCHEMA.NODE.ANY_STATE]: {
            name: 'anyState',
            fill: 'rgb(54, 67, 70, 0.8)',
            icon: '',
            iconColor: '#EAE113',
            stroke: '#20292b',
            contextMenuItems: [
                {
                    text: 'Add transition',
                    action: GRAPH_ACTIONS.ADD_EDGE,
                    edgeType: ANIM_SCHEMA.EDGE.TRANSITION_FROM_ANY
                }
            ]
        },
        [ANIM_SCHEMA.NODE.END_STATE]: {
            name: 'endState',
            fill: 'rgb(54, 67, 70, 0.8)',
            icon: '',
            iconColor: '#D34141',
            stroke: '#20292b',
            contextMenuItems: []
        }
    },
    edges: {
        [ANIM_SCHEMA.EDGE.TRANSITION_DEFAULT]: {
            stroke: '#41D37B',
            strokeWidth: 2,
            targetMarker: true,
            from: [
                ANIM_SCHEMA.NODE.START_STATE
            ],
            to: [
                ANIM_SCHEMA.NODE.STATE
            ],
            contextMenuItems: []
        },
        [ANIM_SCHEMA.EDGE.TRANSITION]: {
            stroke: '#0379EE',
            strokeWidth: 2,
            targetMarkerStroke: '#0379EE',
            targetMarker: true,
            from: [
                ANIM_SCHEMA.NODE.STATE,
                ANIM_SCHEMA.NODE.START_STATE,
                ANIM_SCHEMA.NODE.DEFAULT_STATE
            ],
            to: [
                ANIM_SCHEMA.NODE.STATE,
                ANIM_SCHEMA.NODE.DEFAULT_STATE,
                ANIM_SCHEMA.NODE.END_STATE
            ],
            contextMenuItems: []
        },
        [ANIM_SCHEMA.EDGE.TRANSITION_FROM_ANY]: {
            stroke: '#0379EE',
            strokeWidth: 2,
            targetMarkerStroke: '#0379EE',
            targetMarker: true,
            contextMenuItems: [],
            from: [
                ANIM_SCHEMA.NODE.ANY_STATE
            ],
            to: [
                ANIM_SCHEMA.NODE.STATE,
                ANIM_SCHEMA.NODE.DEFAULT_STATE,
                ANIM_SCHEMA.NODE.END_STATE
            ]
        }
    }
});

const animContextMenuItems = [
    {
        text: 'Add new state',
        action: GRAPH_ACTIONS.ADD_NODE,
        nodeType: ANIM_SCHEMA.NODE.STATE,
        attributes: {
            name: 'New state',
            speed: 1.0,
            loop: false
        }
    }
];

class AnimstategraphView {
    constructor(parent, args) {
        this._parent = parent;
        this._args = args;
        this._assets = null;
        this.ANIM_SCHEMA = ANIM_SCHEMA;

        this._graphElement = document.createElement('div');
        this._graphElement.setAttribute('style', `
            position: absolute;
            width: 100%;
            left: 0;
            background-color: white;
            height: 100%;
            border: none;
            display: none;
        `);
        document.getElementById('layout-viewport').prepend(this._graphElement);

    }

    get parent() {
        return this._parent;
    }

    get selectedItem() {
        return this._graph.selectedItem;
    }

    selectItem(item) {
        switch (item.type) {
            case 'NODE': {
                const node = this._assets[0].get(`data.states.${item.id}`);
                this._graph.selectNode(node);
                this._onSelectNode({ node });
                break;
            }
            case 'EDGE': {
                const edge = this._assets[0].get(`data.transitions.${item.edgeId}`);
                this._graph.selectEdge(edge, item.edgeId);
                this.onSelectEdge({ edge });
                break;
            }
        }
    }

    _keyboardListener(e) {
        if (e.keyCode === 27) {
            // esc
            if (this._graph.selectedItem) {
                this._graph.deselectItem();
            } else {
                this.parent.closeAsset(this._assets[0]);
            }
        } else if (e.keyCode === 46 && this._graph.selectedItem && document.activeElement.constructor.name !== "HTMLInputElement") {
            // del
            const item = this._graph.selectedItem;
            switch (item.type) {
                case 'NODE': {
                    var node = this._assets[0].get(`data.states.${item.id}`);
                    if (![
                        ANIM_SCHEMA.NODE.DEFAULT_STATE,
                        ANIM_SCHEMA.NODE.START_STATE,
                        ANIM_SCHEMA.NODE.END_STATE,
                        ANIM_SCHEMA.NODE.ANY_STATE
                    ].includes(node.nodeType)) {
                        this._graph.deleteNode(item.id);
                    }
                    break;
                }
                case 'EDGE': {
                    var edge = this._assets[0].get(`data.transitions.${item.edgeId}`);
                    if (!edge.defaultTransition) {
                        this._graph.deleteEdge(item.edgeId);
                    }
                    break;
                }
            }
        }
    }

    _generateGraphData(layer) {
        const historyEnabled = this._assets[0].history.enabled;
        this._assets[0].history.enabled = false;
        const data = this._assets[0].get('data');

        const graphData = {
            nodes: {},
            edges: {}
        };
        let startStateKey;
        let updatedStartStateKey;
        let anyStateKey;
        let endStateKey;
        let missingPosCounter = 0;
        data.layers[layer].states.forEach((stateKey) => {
            const state = data.states[stateKey];
            if (!state) return;
            if (!state.posX || !state.posY) {
                state.posX = missingPosCounter * 250 + 50;
                state.posY = 50;
                this._assets[0].set(`data.states.${stateKey}`, state);
                missingPosCounter++;
            }
            if (state.id === 0 && layer !== 0 && Number.isFinite(state.posX)) {
                missingPosCounter++;
            }
            switch (state.name) {
                case 'START':
                    if (!state.nodeType) {
                        state.nodeType = ANIM_SCHEMA.NODE.START_STATE;
                        this._assets[0].set(`data.states.${stateKey}.nodeType`, state.nodeType);
                    }
                    startStateKey = state.id;
                    break;
                case 'ANY':
                    if (!state.nodeType) {
                        state.nodeType = ANIM_SCHEMA.NODE.ANY_STATE;
                        const states = this._assets[0].get('data.states');
                        const layerStates = this._assets[0].get(`data.layers.${layer}.states`);
                        const stateId = Number(`${Date.now()}${Math.floor(Math.random() * 10000)}`);
                        layerStates[layerStates.indexOf(stateKey)] = stateId;
                        this._assets[0].set(`data.layers.${layer}.states`, layerStates);
                        state.id = stateId;
                        states[stateId] = state;
                        delete states[stateKey];
                        this._assets[0].set('data.states', states);
                    }
                    anyStateKey = state.id;
                    break;
                case 'END':
                    if (!state.nodeType) {
                        state.nodeType = ANIM_SCHEMA.NODE.END_STATE;
                        this._assets[0].set(`data.states.${stateKey}.nodeType`, state.nodeType);
                    }
                    endStateKey = stateKey;
                    break;
                default:
                    if (!state.nodeType) {
                        state.nodeType = ANIM_SCHEMA.NODE.STATE;
                        this._assets[0].set(`data.states.${stateKey}.nodeType`, state.nodeType);
                    }
                    if (state.defaultState) {
                        state.defaultState = undefined;
                        this._assets[0].unset(`data.states.${stateKey}.defaultState`);
                    }
                    break;
            }
            if (!state.id) {
                state.id = stateKey;
                this._assets[0].set(`data.states.${stateKey}.id`, state.id);
            }
            if (state.nodeType === ANIM_SCHEMA.NODE.START_STATE) {
                startStateKey = state.id;
            }
            const stateData = {
                id: state.id,
                nodeType: state.nodeType,
                posX: state.posX,
                posY: state.posY
            };
            delete state.id;
            delete state.nodeType;
            delete state.posX;
            delete state.posY;
            graphData.nodes[stateKey] = Object.assign(stateData, { attributes: state });
        });

        if (!anyStateKey) {
            const stateId = Number(`${Date.now()}${Math.floor(Math.random() * 10000)}`);
            const state = {
                id: stateId,
                name: 'ANY',
                nodeType: ANIM_SCHEMA.NODE.ANY_STATE,
                posX: 50,
                posY: 125
            };
            this._onAddNode({ node: state });
            graphData.nodes[stateId] = state;
            anyStateKey = stateId;
        }

        if (!endStateKey) {
            const stateId = Number(`${Date.now()}${Math.floor(Math.random() * 10000)}`);
            const state = {
                id: stateId,
                name: 'END',
                nodeType: ANIM_SCHEMA.NODE.END_STATE,
                posX: 50,
                posY: 200
            };
            this._onAddNode({ node: state });
            graphData.nodes[stateId] = state;
            endStateKey = stateId;
        }

        if (layer !== 0 && startStateKey === 0) {
            const state = this._assets[0].get(`data.states.${0}`);
            updatedStartStateKey = Number(`${Date.now()}${Math.floor(Math.random() * 10000)}`);
            state.id = updatedStartStateKey;
            graphData.nodes[0].id = updatedStartStateKey;
            graphData.nodes[updatedStartStateKey] = Object.assign({}, graphData.nodes[0]);
            delete graphData.nodes[0];
            this._assets[0].set(`data.states.${updatedStartStateKey}`, state);
            const layerStates = this._assets[0].get(`data.layers.${layer}.states`);
            layerStates[layerStates.indexOf(startStateKey)] = updatedStartStateKey;
            this._assets[0].set(`data.layers.${layer}.states`, layerStates);
        }

        data.layers[layer].transitions.forEach((transitionKey) => {
            const transition = data.transitions[transitionKey];
            if (!transition.edgeType) {
                switch (transition.from) {
                    case startStateKey:
                        transition.edgeType = ANIM_SCHEMA.EDGE.TRANSITION;
                        transition.defaultTransition = true;
                        this._assets[0].set(`data.transitions.${transitionKey}.edgeType`, transition.edgeType);
                        this._assets[0].set(`data.transitions.${transitionKey}.defaultTransition`, true);
                        break;
                    case anyStateKey:
                        transition.edgeType = ANIM_SCHEMA.EDGE.TRANSITION_FROM_ANY;
                        this._assets[0].set(`data.transitions.${transitionKey}.edgeType`, transition.edgeType);
                        break;
                    default:
                        transition.edgeType = ANIM_SCHEMA.EDGE.TRANSITION;
                        this._assets[0].set(`data.transitions.${transitionKey}.edgeType`, transition.edgeType);
                        break;
                }
                if ((!this._assets[0].get(`data.states.${transition.from}`)) || (!this._assets[0].get(`data.states.${transition.to}`))) {
                    return;
                }
            }
            if (transition.from === -1) {
                transition.from = anyStateKey;
                this._assets[0].set(`data.transitions.${transitionKey}.from`, anyStateKey);
            }
            if (transition.from === 0 && updatedStartStateKey) {
                transition.from = updatedStartStateKey;
                this._assets[0].set(`data.transitions.${transitionKey}.from`, updatedStartStateKey);
            }
            if (transition.from === startStateKey) {
                graphData.nodes[transition.to].defaultState = true;
                graphData.nodes[transition.to].nodeType = ANIM_SCHEMA.NODE.DEFAULT_STATE;
                this._assets[0].set(`data.states.${transition.to}.defaultState`, true);
                this._assets[0].set(`data.states.${transition.to}.nodeType`, ANIM_SCHEMA.NODE.DEFAULT_STATE);
            }
            graphData.edges[transitionKey] = Object.assign({}, transition);
        });
        this._assets[0].history.enabled = historyEnabled;
        return graphData;
    }

    _handleIncomingUpdates(path, newValue, oldValue) {
        if (!this._suppressGraphDataEvents) {
            if (path === 'data') {
                const updates = window.diff.default(oldValue, newValue);
                if (updates.states) {
                    Object.keys(updates.states).forEach((stateKey) => {
                        if (stateKey.includes('__added')) {

                            let state = updates.states[stateKey];
                            const stateAttributes = {
                                name: state.name,
                                loop: state.loop,
                                speed: state.speed
                            };
                            delete state.loop;
                            delete state.name;
                            delete state.speed;
                            state = Object.assign(state, { attributes: stateAttributes });

                            this._graph.createNode(state, undefined, true);
                        }
                        if (stateKey.includes('__deleted')) {
                            this._graph.deleteNode(updates.states[stateKey].id, true);
                            if (this._parent._stateContainer._stateName === updates.states[stateKey].name) {
                                this._parent._stateContainer.unlink();
                            }
                        }
                        if (updates.states[stateKey].nodeType) {
                            this._graph.updateNodeType(stateKey, updates.states[stateKey].nodeType.__new);
                        }
                    });
                } if (updates.transitions) {
                    Object.keys(updates.transitions).forEach((transitionKey) => {
                        if (transitionKey.includes('__added')) {
                            const key = transitionKey.replace('__added', '');
                            this._graph.createEdge(updates.transitions[transitionKey], key, true);
                        }
                        if (transitionKey.includes('__deleted')) {
                            const key = transitionKey.replace('__deleted', '');
                            this._graph.deleteEdge(key, true);
                            const actualTransition = updates.transitions[transitionKey];
                            if (this._parent._transitionsContainer._edge === `${actualTransition.from}-${actualTransition.to}`) {
                                this._parent._transitionsContainer.unlink();
                            }
                        }
                        const transition = updates.transitions[transitionKey];
                        if (transition.to && transition.to.__new) {
                            this._graph.deleteEdge(transitionKey, true);
                            const updatedTransition = this._assets[0].get(`data.transitions.${transitionKey}`);
                            this._graph.createEdge(updatedTransition, transitionKey, true);
                        }
                    });
                }
            }
            const pathArr = path.split('.');
            if (pathArr.length === 4 && pathArr[1] === 'states' && pathArr[3] === 'posX') {
                const posY = this._assets[0].get(`data.states.${pathArr[2]}.posY`);
                this._graph.updateNodePosition(Number(pathArr[2]), { x: newValue, y: posY });
            } else if (pathArr.length === 4 && pathArr[1] === 'states' && pathArr[3] === 'posY') {
                const posX = this._assets[0].get(`data.states.${pathArr[2]}.posX`);
                this._graph.updateNodePosition(Number(pathArr[2]), { y: newValue, x: posX });
            } else if (pathArr.length === 4 && pathArr[1] === 'states') {
                this._graph.updateNodeAttribute(Number(pathArr[2]), pathArr[3], newValue);
            }
        }
    }

    _createGraph() {
        this._graphElement.setAttribute('style', 'display: block;');
        const initialGraphData = this._generateGraphData(this._selectedLayer);
        this._graph = new pcuiGraph.Graph(animSchema(this._assets[0]), {
            dom: this._graphElement,
            initialData: initialGraphData,
            contextMenuItems: animContextMenuItems,
            readOnly: this.parent.readOnly,
            includeFonts: false,
            incrementNodeNames: true,
            passiveUIEvents: true,
            useGlobalPCUI: true,
            adjustVertices: true,
            defaultStyles: {
                background: {
                    gridSize: 10
                }
            }
        });
    }

    _destroyGraph() {
        if (this._graph) {
            this._graphElement.setAttribute('style', 'display: none;');
            delete this._graph;
            localStorage.removeItem('graphData');
            localStorage.removeItem('externalGraphData');
        }
    }

    _suppressGraphEvents(func) {
        this._suppressGraphDataEvents = true;
        func();
        this._suppressGraphDataEvents = false;
    }

    _onAddNode({ node }) {
        const data = this._assets[0].get(`data`);
        data.states[node.id] = Object.assign({}, node, node.attributes);
        delete data.states[node.id].attributes;
        if (!data.layers[this._selectedLayer].states.includes(node.id)) {
            data.layers[this._selectedLayer].states.push(node.id);
        }
        this._assets[0].set('data', data);
    }

    _onDeleteNode({ node, edges }) {
        const data = this._assets[0].get(`data`);
        if (data.layers[this._selectedLayer].states.includes(node.id)) {
            data.layers[this._selectedLayer].states.splice(data.layers[this._selectedLayer].states.indexOf(node.id), 1);
        }
        delete data.states[node.id];
        edges.forEach((edge) => {
            edge = Number(edge);
            if (data.layers[this._selectedLayer].transitions.includes(edge)) {
                data.layers[this._selectedLayer].transitions.splice(data.layers[this._selectedLayer].transitions.indexOf(edge), 1);
            }

            const edgeData = data.transitions[edge];
            if (edgeData && this._parent._transitionsContainer._edge === `${edgeData.from}-${edgeData.to}`) {
                this._parent._transitionsContainer.unlink();
                this._parent._transitionsContainer.hidden = true;
            }
            delete data.transitions[edge];
        });
        this._assets[0].set('data', data);
        if (this._parent._stateContainer._stateName === node.attributes.name) {
            this._parent._stateContainer.unlink();
            this._parent._stateContainer.hidden = true;
        }
    }

    _onUpdateNodePosition({ node }) {
        const state = this._assets[0].get(`data.states.${node.id}`);
        state.posX = node.posX;
        state.posY = node.posY;
        this._assets[0].set(`data.states.${node.id}`, state);
    }

    _onUpdateNodeAttribute({ node, attribute }) {
        const state = this._assets[0].get(`data.states.${node.id}`);
        if (attribute === 'name') {
            if (!AnimstategraphState.validateStateName(node.id, node.attributes.name, this._assets[0])) {
                this._graph.setNodeAttributeErrorState(node.id, attribute, true);
                return;
            }
            const prevName = state.name;
            const newName = node.attributes.name;
            const action = {
                redo: () => {
                    const layerName = this._assets[0].get(`data.layers.${this._selectedLayer}.name`);
                    this._args.entities.forEach((entityObserver) => {
                        if (entityObserver.get('components.anim.stateGraphAsset') === this._assets[0].get('id')) {
                            AnimstategraphState.updateAnimationAssetName(entityObserver, layerName, prevName, newName);
                        }
                    });
                    const historyEnabled = this._assets[0].history.enabled;
                    this._assets[0].history.enabled = false;
                    this._assets[0].set(`data.states.${node.id}.name`, newName);
                    this._assets[0].history.enabled = historyEnabled;
                },
                undo: () => {
                    const layerName = this._assets[0].get(`data.layers.${this._selectedLayer}.name`);
                    this._args.entities.forEach((entityObserver) => {
                        if (entityObserver.get('components.anim.stateGraphAsset') === this._assets[0].get('id')) {
                            AnimstategraphState.updateAnimationAssetName(entityObserver, layerName, newName, prevName);
                        }
                    });
                    const historyEnabled = this._assets[0].history.enabled;
                    this._assets[0].history.enabled = false;
                    this._assets[0].set(`data.states.${node.id}.name`, prevName);
                    this._assets[0].history.enabled = historyEnabled;
                },
                name: 'update name'
            };
            this.parent.history.add(action);
            action.redo();
            this._graph.setNodeAttributeErrorState(node.id, attribute, false);
            return;
        }
        this._graph.setNodeAttributeErrorState(node.id, attribute, false);
        state[attribute] = node.attributes[attribute];
        this._assets[0].set(`data.states.${node.id}`, state);
    }

    _onAddEdge({ edge, edgeId }) {
        edgeId = Number(edgeId);
        const data = this._assets[0].get(`data`);
        if (!data.layers[this._selectedLayer].transitions.includes(edgeId)) {
            data.layers[this._selectedLayer].transitions.push(edgeId);
        }
        data.transitions[edgeId] = Object.assign({ exitTime: 0 }, edge);
        this._assets[0].set('data', data);
    }

    _onDeleteEdge({ edgeId }) {
        edgeId = Number(edgeId);
        const data = this._assets[0].get(`data`);

        if (data.layers[this._selectedLayer].transitions.includes(edgeId)) {
            data.layers[this._selectedLayer].transitions.splice(data.layers[this._selectedLayer].transitions.indexOf(edgeId), 1);
        }
        delete data.transitions[edgeId];
        this._assets[0].set('data', data);
    }

    _onSelectNode({ node }) {
        if (!node) return;
        this._parent._transitionsContainer.unlink();
        this._parent._transitionsContainer.hidden = true;
        this._parent._stateContainer.link(this._assets, this._selectedLayer, `data.states.${node.id}`);
        this._parent._stateContainer.hidden = false;
    }

    onSelectEdge({ edge }) {
        this._parent._stateContainer.unlink();
        this._parent._stateContainer.hidden = true;
        this._parent._transitionsContainer.link(this._assets, this._selectedLayer, edge);
        this._parent._transitionsContainer.hidden = false;
    }

    _onDeselectItem() {
        this._parent._stateContainer.unlink();
        this._parent._stateContainer.hidden = true;
        this._parent._transitionsContainer.unlink();
        this._parent._transitionsContainer.hidden = true;
    }

    selectEdgeEvent(edge, edgeId) {
        if (this._suppressGraphDataEvents) return;
        this.parent.history.add({
            redo: () => {
                this._suppressGraphEvents(() => {
                    this.onSelectEdge({ edge });
                    this._graph.selectEdge(edge, edgeId);
                });
            },
            undo: () => {
                this._suppressGraphEvents(() => {
                    this._onDeselectItem();
                    this._graph.deselectItem();
                });
            },
            name: 'select edge'
        });
        this._graph.selectEdge(edge, edgeId);
        this.onSelectEdge({ edge });
    }

    link(assets, layer) {
        this.unlink();
        this._assets = assets;
        this._selectedLayer = layer;
        this._selectedEntity = null;

        this._createGraph();

        this._graph.on(GRAPH_ACTIONS.ADD_NODE, this._onAddNode.bind(this));

        this._graph.on(GRAPH_ACTIONS.DELETE_NODE, this._onDeleteNode.bind(this));

        this._graph.on(GRAPH_ACTIONS.UPDATE_NODE_POSITION, this._onUpdateNodePosition.bind(this));

        this._graph.on(GRAPH_ACTIONS.UPDATE_NODE_ATTRIBUTE, this._onUpdateNodeAttribute.bind(this));

        this._graph.on(GRAPH_ACTIONS.ADD_EDGE, this._onAddEdge.bind(this));

        this._graph.on(GRAPH_ACTIONS.DELETE_EDGE, this._onDeleteEdge.bind(this));

        this._graph.on(GRAPH_ACTIONS.SELECT_NODE, ({ node, prevItem }) => {
            if (this._suppressGraphDataEvents) return;
            const assetId = this._assets[0].get('id');
            this.parent.history.add({
                redo: () => {
                    if (this._assets[0].get('id') !== assetId) return;
                    this._suppressGraphEvents(() => {
                        this._onSelectNode({ node });
                        this._graph.selectNode(node);
                    });
                },
                undo: () => {
                    if (this._assets[0].get('id') !== assetId) return;
                    this._suppressGraphEvents(() => {
                        if (prevItem) {
                            switch (prevItem.type) {
                                case 'NODE': {
                                    const prevNode = this._graph._graphData.get(`data.nodes.${prevItem.id}`);
                                    this._graph.selectNode(prevNode);
                                    this._onSelectNode({ prevNode });
                                    break;
                                }
                                case 'EDGE': {
                                    const prevEdge = this._graph._graphData.get(`data.edges.${prevItem.edgeId}`);
                                    this._graph.selectEdge(prevEdge, prevItem.edgeId);
                                    this.onSelectEdge({ prevEdge });
                                    break;
                                }
                            }
                        } else {
                            this._onDeselectItem();
                            this._graph.deselectItem();
                        }
                    });
                },
                name: 'select node'
            });
            this._onSelectNode({ node });
            this._graph.selectNode(node);
        });

        this._graph.on(GRAPH_ACTIONS.SELECT_EDGE, ({ edge, edgeId }) => {
            this.selectEdgeEvent(edge, edgeId);
        });

        this._graph.on(GRAPH_ACTIONS.DESELECT_ITEM, ({ type, id, edgeId }) => {
            if (this._suppressGraphDataEvents) return;
            const assetId = this._assets[0].get('id');
            this.parent.history.add({
                redo: () => {
                    if (this._assets[0].get('id') !== assetId) return;
                    this._suppressGraphEvents(() => {
                        this._onDeselectItem();
                        this._graph.deselectItem();
                    });
                },
                undo: () => {
                    if (this._assets[0].get('id') !== assetId) return;
                    this._suppressGraphEvents(() => {
                        switch (type) {
                            case 'NODE': {

                                const node = this._graph._graphData.get(`data.nodes.${id}`);
                                this._graph.selectNode(node);
                                this._onSelectNode({ node });
                                break;
                            }
                            case 'EDGE': {
                                const edge = this._graph._graphData.get(`data.edges.${edgeId}`);
                                this._graph.selectEdge(edge, edgeId);
                                this.onSelectEdge({ edge });
                                break;
                            }
                        }
                    });
                },
                name: 'deselect item'
            });
            this._onDeselectItem();
            this._graph.deselectItem();
        });

        const getGraphSettings = () => {
            let graphSettings = sessionStorage.getItem(`graph-${this._assets[0].get('id')}-${this._selectedLayer}`);
            if (graphSettings) {
                graphSettings = JSON.parse(graphSettings);
            } else {
                graphSettings = {
                    pos: { x: 0, y: 0 },
                    scale: 1
                };
            }
            return graphSettings;
        };

        const updateGraphSettings = (graphSettings) => {
            sessionStorage.setItem(`graph-${this._assets[0].get('id')}-${this._selectedLayer}`, JSON.stringify(graphSettings));
        };

        this._graph.on(GRAPH_ACTIONS.UPDATE_TRANSLATE, ({ pos }) => {
            const graphSettings = getGraphSettings();
            graphSettings.pos = pos;
            updateGraphSettings(graphSettings);
        });

        this._graph.on(GRAPH_ACTIONS.UPDATE_SCALE, ({ scale }) => {
            const graphSettings = getGraphSettings();
            graphSettings.scale = scale;
            updateGraphSettings(graphSettings);
        });

        const graphSettings = getGraphSettings();
        this._graph.setGraphPosition(graphSettings.pos.x, graphSettings.pos.y);
        this._graph.setGraphScale(graphSettings.scale);

        this._handleIncomingUpdatesEvent = this._assets[0].on('*:set', this._handleIncomingUpdates.bind(this));

        const viewportCanvas = editor.call('viewport:canvas');
        this._viewportResizeEvent = viewportCanvas.on('resize', () => {
            this._graph.dom.style.width = viewportCanvas.style.width;
            this._graph.dom.style.height = viewportCanvas.style.height;
        });

        // add keyboard listener
        this._keyboardListenerBound = this._keyboardListener.bind(this);
        window.addEventListener('keydown', this._keyboardListenerBound);
    }

    unlink() {
        this._destroyGraph();
        if (this._viewportResizeEvent) this._viewportResizeEvent.unbind();
        if (this._handleIncomingUpdatesEvent) this._handleIncomingUpdatesEvent.unbind();
        // remove keyboard listener
        if (this._keyboardListenerBound) {
            window.removeEventListener('keydown', this._keyboardListenerBound);
            delete this._keyboardListenerBound;
        }
    }
}

export { AnimstategraphView };
