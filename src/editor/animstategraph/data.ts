const PARAMETER_TYPES = ['INTEGER', 'FLOAT', 'BOOLEAN', 'TRIGGER'];
const PREDICATES = [
    'EQUAL_TO',
    'NOT_EQUAL_TO',
    'LESS_THAN',
    'LESS_THAN_EQUAL_TO',
    'GREATER_THAN',
    'GREATER_THAN_EQUAL_TO'
];
const INTERRUPTIONS = ['NONE', 'NEXT_STATE', 'PREV_STATE', 'NEXT_STATE_PREV_STATE', 'PREV_STATE_NEXT_STATE'];
const SPECIAL_STATES = [1, 3, 4, 5];
const LOCKED_STATES = [3, 4, 5];

type Data = {
    layers: Record<string, any>;
    states: Record<string, any>;
    transitions: Record<string, any>;
    parameters: Record<string, any>;
    [key: string]: any;
};

type Operation = {
    kind: string;
    id?: number;
    layerId?: number;
    transitionId?: number;
    index?: number;
    name?: string;
    type?: string;
    value?: unknown;
    from?: number;
    to?: number;
    properties?: Record<string, any>;
};

const fail = (message: string): never => {
    throw new Error(message);
};

const nextId = (items: Record<string, unknown>) => {
    let id = 0;
    while (Object.hasOwn(items, id)) {
        id++;
    }
    return id;
};

const validId = (id: unknown, label: string) => {
    if (!Number.isSafeInteger(id) || Number(id) < 0) {
        fail(`${label} must be a non-negative safe integer.`);
    }
    return Number(id);
};

const validName = (name: unknown, label: string) => {
    if (typeof name !== 'string' || !name.length || name.trim() !== name || !/^[A-Za-z0-9 _-]+$/.test(name)) {
        fail(
            `${label} must contain only letters, numbers, spaces, underscores, or hyphens, with no surrounding whitespace.`
        );
    }
    return name;
};

const own = <T>(items: Record<string, T>, id: number, label: string) => {
    if (!Object.hasOwn(items, id)) {
        fail(`${label} ${id} not found.`);
    }
    return items[id];
};

const layerForState = (data: Data, id: number) => {
    const entry = Object.entries(data.layers).find(([, layer]) => layer.states.includes(id));
    if (!entry) {
        fail(`State ${id} does not belong to a layer.`);
    }
    return [Number(entry[0]), entry[1]] as const;
};

const layerForTransition = (data: Data, id: number) => {
    const entry = Object.entries(data.layers).find(([, layer]) => layer.transitions.includes(id));
    if (!entry) {
        fail(`Transition ${id} does not belong to a layer.`);
    }
    return [Number(entry[0]), entry[1]] as const;
};

const assertUnique = (items: unknown[], label: string) => {
    if (new Set(items).size !== items.length) {
        fail(`${label} must be unique.`);
    }
};

const animStateKeys = (data: Data) => {
    const keys = new Map<number, string>();
    Object.values(data.layers).forEach((layer) =>
        layer.states.forEach((id: number) => {
            const state = data.states[id];
            if (state && !LOCKED_STATES.includes(state.nodeType)) {
                keys.set(id, `${layer.name}:${state.name}`);
            }
        })
    );
    return keys;
};

const remapAnimStateAssets = (
    current: Record<string, any>,
    changes: { key: string; next?: string; drop: boolean }[]
) => {
    const result = structuredClone(current);
    for (let i = 0; i < changes.length; i++) {
        const { key, next, drop } = changes[i];
        if (drop) {
            delete result[key];
        }
        if (next) {
            result[next] = current[key] ?? { asset: null };
        }
    }
    return result;
};

const parameter = (data: Data, name: string) => {
    const value = Object.values(data.parameters).find((item) => item.name === name);
    if (!value) {
        fail(`Parameter "${name}" not found.`);
    }
    return value;
};

const validateValue = (type: string, value: unknown, label: string) => {
    if (['BOOLEAN', 'TRIGGER'].includes(type)) {
        if (typeof value !== 'boolean') {
            fail(`${label} must be boolean for ${type}.`);
        }
    } else if (
        typeof value !== 'number' ||
        !Number.isFinite(value) ||
        (type === 'INTEGER' && !Number.isInteger(value))
    ) {
        fail(`${label} must be ${type === 'INTEGER' ? 'an integer' : 'a finite number'} for ${type}.`);
    }
};

const validate = (data: Data) => {
    if (
        !data ||
        !['layers', 'states', 'transitions', 'parameters'].every((key) => data[key] && typeof data[key] === 'object')
    ) {
        fail('Invalid anim state graph data. Expected layers, states, transitions, and parameters.');
    }

    assertUnique(
        Object.values(data.layers).map((layer) => layer.name),
        'Layer names'
    );
    assertUnique(
        Object.values(data.parameters).map((item) => item.name),
        'Parameter names'
    );

    const stateLayers = new Map<number, number>();
    const transitionLayers = new Map<number, number>();
    Object.entries(data.layers).forEach(([key, layer]) => {
        const id = Number(key);
        if (!Array.isArray(layer.states) || !Array.isArray(layer.transitions)) {
            fail(`Layer ${id} must contain state and transition arrays.`);
        }
        assertUnique(layer.states, `Layer ${id} state ids`);
        assertUnique(layer.transitions, `Layer ${id} transition ids`);
        assertUnique(
            layer.states.map((stateId) => own(data.states, stateId, 'State').name),
            `State names in layer ${id}`
        );
        layer.states.forEach((stateId) => {
            if (stateLayers.has(stateId)) {
                fail(`State ${stateId} belongs to more than one layer.`);
            }
            stateLayers.set(stateId, id);
        });
        layer.transitions.forEach((transitionId) => {
            own(data.transitions, transitionId, 'Transition');
            if (transitionLayers.has(transitionId)) {
                fail(`Transition ${transitionId} belongs to more than one layer.`);
            }
            transitionLayers.set(transitionId, id);
        });
        const states = layer.states.map((stateId) => data.states[stateId]);
        [3, 4, 5].forEach((nodeType) => {
            if (states.filter((state) => state.nodeType === nodeType).length !== 1) {
                fail(`Layer ${id} must contain exactly one nodeType ${nodeType} state.`);
            }
        });
        if (states.filter((state) => state.nodeType === 1).length !== 1) {
            fail(`Layer ${id} must contain exactly one default state.`);
        }
        const defaults = layer.transitions.filter((transitionId) => data.transitions[transitionId].defaultTransition);
        if (defaults.length !== 1) {
            fail(`Layer ${id} must contain exactly one default transition.`);
        }
        const transition = data.transitions[defaults[0]];
        if (
            data.states[transition.from].nodeType !== 3 ||
            data.states[transition.to].nodeType !== 1 ||
            Object.keys(transition.conditions || {}).length
        ) {
            fail(`Layer ${id} has an invalid default transition.`);
        }
    });

    Object.entries(data.states).forEach(([key, state]) => {
        const id = Number(key);
        if (state.id !== id || !stateLayers.has(id)) {
            fail(`State ${id} has invalid identity or layer membership.`);
        }
    });
    Object.entries(data.transitions).forEach(([key, transition]) => {
        const id = Number(key);
        const layerId = transitionLayers.get(id);
        if (layerId === undefined) {
            fail(`Transition ${id} has no layer membership.`);
        }
        const layer = data.layers[layerId];
        if (!layer.states.includes(transition.from) || !layer.states.includes(transition.to)) {
            fail(`Transition ${id} endpoints must belong to layer ${layerId}.`);
        }
        const source = data.states[transition.from];
        const target = data.states[transition.to];
        if (![0, 1, 3, 4].includes(source.nodeType) || ![0, 1, 5].includes(target.nodeType)) {
            fail(`Transition ${id} is not allowed by the anim state graph schema.`);
        }
        Object.values(transition.conditions || {}).forEach((condition: any) => {
            const param = parameter(data, condition.parameterName);
            if (!PREDICATES.includes(condition.predicate)) {
                fail(`Condition predicate "${condition.predicate}" is invalid.`);
            }
            if (['BOOLEAN', 'TRIGGER'].includes(param.type) && condition.predicate !== 'EQUAL_TO') {
                fail(`Conditions using ${param.type} parameters must use EQUAL_TO.`);
            }
            validateValue(param.type, condition.value, `Condition value for "${condition.parameterName}"`);
        });
    });
    Object.values(data.parameters).forEach((item: any) => {
        if (!PARAMETER_TYPES.includes(item.type)) {
            fail(`Parameter type "${item.type}" is invalid.`);
        }
        validateValue(item.type, item.value, `Parameter "${item.name}" value`);
    });
};

const addLayer = (data: Data, op: Operation, ids: { kind: string; id: number }[]) => {
    const id = op.id === undefined ? nextId(data.layers) : validId(op.id, 'Layer id');
    if (Object.hasOwn(data.layers, id)) {
        fail(`Layer ${id} already exists.`);
    }
    const name = validName(op.name ?? `New Layer ${id}`, 'Layer name');
    if (Object.values(data.layers).some((layer) => layer.name === name)) {
        fail(`Layer name "${name}" already exists.`);
    }
    const stateId = nextId(data.states);
    const startId = nextId({ ...data.states, [stateId]: true });
    const anyId = nextId({ ...data.states, [stateId]: true, [startId]: true });
    const endId = nextId({ ...data.states, [stateId]: true, [startId]: true, [anyId]: true });
    const transitionId = nextId(data.transitions);
    data.states[stateId] = {
        name: 'Initial State',
        id: stateId,
        speed: 1,
        loop: true,
        posX: 400,
        posY: 50,
        nodeType: 1
    };
    data.states[startId] = { name: 'START', id: startId, posX: 50, posY: 100, nodeType: 3 };
    data.states[anyId] = { name: 'ANY', id: anyId, posX: 50, posY: 150, nodeType: 4 };
    data.states[endId] = { name: 'END', id: endId, posX: 50, posY: 200, nodeType: 5 };
    data.transitions[transitionId] = {
        from: startId,
        to: stateId,
        defaultTransition: true,
        edgeType: 1,
        conditions: {}
    };
    data.layers[id] = {
        name,
        states: [startId, anyId, endId, stateId],
        transitions: [transitionId],
        blendType: op.properties?.blendType ?? 'OVERWRITE',
        weight: op.properties?.weight ?? 1
    };
    updateLayer(data, { kind: 'layer.update', id, properties: op.properties });
    ids.push({ kind: op.kind, id });
};

const updateLayer = (data: Data, op: Operation) => {
    const id = validId(op.id, 'Layer id');
    const layer = own(data.layers, id, 'Layer');
    const props = op.properties || {};
    if (props.name !== undefined) {
        const name = validName(props.name, 'Layer name');
        if (Object.entries(data.layers).some(([key, item]) => Number(key) !== id && item.name === name)) {
            fail(`Layer name "${name}" already exists.`);
        }
        layer.name = name;
    }
    if (props.blendType !== undefined) {
        if (!['OVERWRITE', 'ADDITIVE'].includes(props.blendType)) {
            fail('Layer blendType must be OVERWRITE or ADDITIVE.');
        }
        layer.blendType = props.blendType;
    }
    if (props.weight !== undefined) {
        if (
            typeof props.weight !== 'number' ||
            !Number.isFinite(props.weight) ||
            props.weight < 0 ||
            props.weight > 1
        ) {
            fail('Layer weight must be between 0 and 1.');
        }
        layer.weight = props.weight;
    }
    if (props.defaultStateId !== undefined) {
        const stateId = validId(props.defaultStateId, 'Default state id');
        const state = own(data.states, stateId, 'State');
        if (!layer.states.includes(stateId) || (SPECIAL_STATES.includes(state.nodeType) && state.nodeType !== 1)) {
            fail(`State ${stateId} cannot be the default state for layer ${id}.`);
        }
        layer.states.forEach((item) => {
            if (data.states[item].nodeType === 1) {
                data.states[item].nodeType = 0;
            }
        });
        state.nodeType = 1;
        const transitionId = layer.transitions.find((item) => data.transitions[item].defaultTransition);
        if (transitionId === undefined) {
            fail(`Layer ${id} has no default transition.`);
        }
        data.transitions[transitionId].to = stateId;
    }
};

const removeLayer = (data: Data, op: Operation) => {
    const id = validId(op.id, 'Layer id');
    if (id === 0) {
        fail('Layer 0 is the base layer and cannot be removed.');
    }
    const layer = own(data.layers, id, 'Layer');
    layer.states.forEach((stateId) => delete data.states[stateId]);
    layer.transitions.forEach((transitionId) => delete data.transitions[transitionId]);
    delete data.layers[id];
};

const moveLayer = (data: Data, op: Operation) => {
    const id = validId(op.id, 'Layer id');
    const index = validId(op.index, 'Layer index');
    if (id === 0 || index === 0) {
        fail('The base layer cannot be moved.');
    }
    own(data.layers, id, 'Layer');
    const keys = Object.keys(data.layers)
        .map(Number)
        .sort((a, b) => a - b);
    if (index >= keys.length) {
        fail(`Layer index must be less than ${keys.length}.`);
    }
    const layers = keys.map((key) => data.layers[key]);
    layers.splice(index, 0, layers.splice(keys.indexOf(id), 1)[0]);
    keys.forEach((key, i) => (data.layers[key] = layers[i]));
};

const addState = (data: Data, op: Operation, ids: { kind: string; id: number }[]) => {
    const layerId = validId(op.layerId, 'Layer id');
    const layer = own(data.layers, layerId, 'Layer');
    const id = op.id === undefined ? nextId(data.states) : validId(op.id, 'State id');
    if (Object.hasOwn(data.states, id)) {
        fail(`State ${id} already exists.`);
    }
    const name = validName(op.name, 'State name');
    if (layer.states.some((stateId) => data.states[stateId].name === name)) {
        fail(`State name "${name}" already exists in layer ${layerId}.`);
    }
    data.states[id] = {
        id,
        name,
        speed: op.properties?.speed ?? 1,
        loop: op.properties?.loop ?? true,
        posX: op.properties?.posX ?? 400,
        posY: op.properties?.posY ?? 50,
        nodeType: 0
    };
    layer.states.push(id);
    updateState(data, { kind: 'state.update', id, properties: op.properties });
    ids.push({ kind: op.kind, id });
};

const updateState = (data: Data, op: Operation) => {
    const id = validId(op.id, 'State id');
    const state = own(data.states, id, 'State');
    const [layerId, layer] = layerForState(data, id);
    const props = op.properties || {};
    if (LOCKED_STATES.includes(state.nodeType) && Object.keys(props).some((key) => !['posX', 'posY'].includes(key))) {
        fail(`Special state ${id} only supports position updates.`);
    }
    if (props.name !== undefined) {
        const name = validName(props.name, 'State name');
        if (layer.states.some((stateId) => stateId !== id && data.states[stateId].name === name)) {
            fail(`State name "${name}" already exists in layer ${layerId}.`);
        }
        state.name = name;
    }
    ['speed', 'posX', 'posY'].forEach((key) => {
        if (props[key] !== undefined) {
            if (typeof props[key] !== 'number' || !Number.isFinite(props[key])) {
                fail(`State ${key} must be a finite number.`);
            }
            state[key] = props[key];
        }
    });
    if (props.loop !== undefined) {
        if (typeof props.loop !== 'boolean') {
            fail('State loop must be boolean.');
        }
        state.loop = props.loop;
    }
};

const removeState = (data: Data, op: Operation) => {
    const id = validId(op.id, 'State id');
    const state = own(data.states, id, 'State');
    if (SPECIAL_STATES.includes(state.nodeType)) {
        fail(`Special/default state ${id} cannot be removed.`);
    }
    const [, layer] = layerForState(data, id);
    layer.states.splice(layer.states.indexOf(id), 1);
    Object.entries(data.transitions).forEach(([key, transition]) => {
        if (transition.from === id || transition.to === id) {
            const transitionId = Number(key);
            delete data.transitions[key];
            Object.values(data.layers).forEach((item) => {
                const index = item.transitions.indexOf(transitionId);
                if (index !== -1) {
                    item.transitions.splice(index, 1);
                }
            });
        }
    });
    delete data.states[id];
};

const addTransition = (data: Data, op: Operation, ids: { kind: string; id: number }[]) => {
    const layerId = validId(op.layerId, 'Layer id');
    const layer = own(data.layers, layerId, 'Layer');
    const from = validId(op.from, 'From state id');
    const to = validId(op.to, 'To state id');
    if (!layer.states.includes(from) || !layer.states.includes(to)) {
        fail(`Transition endpoints must belong to layer ${layerId}.`);
    }
    const source = data.states[from];
    const target = data.states[to];
    if (![0, 1, 3, 4].includes(source.nodeType) || ![0, 1, 5].includes(target.nodeType)) {
        fail(`Transition ${from} -> ${to} is not allowed by the anim state graph schema.`);
    }
    const isDefault = source.nodeType === 3;
    if (isDefault && layer.transitions.some((id) => data.transitions[id].defaultTransition)) {
        fail(`Layer ${layerId} already has a default transition.`);
    }
    const id = op.id === undefined ? nextId(data.transitions) : validId(op.id, 'Transition id');
    if (Object.hasOwn(data.transitions, id)) {
        fail(`Transition ${id} already exists.`);
    }
    const props = op.properties || {};
    const parallel = layer.transitions.filter(
        (item) => data.transitions[item].from === from && data.transitions[item].to === to
    );
    data.transitions[id] = {
        from,
        to,
        edgeType: source.nodeType === 4 ? 3 : 1,
        exitTime: props.exitTime ?? 0,
        interruptionSource: props.interruptionSource ?? 'NONE',
        priority: props.priority ?? parallel.length,
        time: props.time ?? 0,
        transitionOffset: props.transitionOffset ?? 0,
        conditions: {},
        ...(isDefault ? { defaultTransition: true } : {})
    };
    layer.transitions.push(id);
    updateTransition(data, { kind: 'transition.update', id, properties: props });
    ids.push({ kind: op.kind, id });
};

const updateTransition = (data: Data, op: Operation) => {
    const id = validId(op.id, 'Transition id');
    const transition = own(data.transitions, id, 'Transition');
    const props = op.properties || {};
    if (transition.defaultTransition && Object.keys(props).length) {
        fail(`Default transition ${id} cannot be modified.`);
    }
    ['exitTime', 'priority', 'time', 'transitionOffset'].forEach((key) => {
        if (props[key] !== undefined) {
            if (typeof props[key] !== 'number' || !Number.isFinite(props[key])) {
                fail(`Transition ${key} must be a finite number.`);
            }
            transition[key] = props[key];
        }
    });
    if (props.priority !== undefined && (!Number.isInteger(props.priority) || props.priority < 0)) {
        fail('Transition priority must be a non-negative integer.');
    }
    if (props.time !== undefined && props.time < 0) {
        fail('Transition time must be non-negative.');
    }
    if (props.exitTime !== undefined && props.exitTime < 0) {
        fail('Transition exitTime must be non-negative.');
    }
    if (props.transitionOffset !== undefined && (props.transitionOffset < 0 || props.transitionOffset > 1)) {
        fail('Transition transitionOffset must be between 0 and 1.');
    }
    if (props.interruptionSource !== undefined) {
        if (!INTERRUPTIONS.includes(props.interruptionSource)) {
            fail(`Transition interruptionSource "${props.interruptionSource}" is invalid.`);
        }
        transition.interruptionSource = props.interruptionSource;
    }
};

const removeTransition = (data: Data, op: Operation) => {
    const id = validId(op.id, 'Transition id');
    const transition = own(data.transitions, id, 'Transition');
    if (transition.defaultTransition) {
        fail(`Default transition ${id} cannot be removed.`);
    }
    const [, layer] = layerForTransition(data, id);
    layer.transitions.splice(layer.transitions.indexOf(id), 1);
    delete data.transitions[id];
};

const moveTransition = (data: Data, op: Operation) => {
    const id = validId(op.id, 'Transition id');
    const index = validId(op.index, 'Transition index');
    const transition = own(data.transitions, id, 'Transition');
    if (transition.defaultTransition) {
        fail(`Default transition ${id} cannot be moved.`);
    }
    const [, layer] = layerForTransition(data, id);
    const items = layer.transitions
        .filter(
            (item) => data.transitions[item].from === transition.from && data.transitions[item].to === transition.to
        )
        .sort((a, b) => (data.transitions[a].priority ?? 0) - (data.transitions[b].priority ?? 0));
    if (index >= items.length) {
        fail(`Transition index must be less than ${items.length}.`);
    }
    items.splice(index, 0, items.splice(items.indexOf(id), 1)[0]);
    items.forEach((item, priority) => (data.transitions[item].priority = priority));
};

const addCondition = (data: Data, op: Operation, ids: { kind: string; id: number }[]) => {
    const transitionId = validId(op.transitionId, 'Transition id');
    const transition = own(data.transitions, transitionId, 'Transition');
    if (transition.defaultTransition) {
        fail(`Default transition ${transitionId} cannot have conditions.`);
    }
    const id = op.id === undefined ? nextId(transition.conditions || {}) : validId(op.id, 'Condition id');
    transition.conditions ||= {};
    if (Object.hasOwn(transition.conditions, id)) {
        fail(`Condition ${id} already exists on transition ${transitionId}.`);
    }
    const props = op.properties || {};
    parameter(data, props.parameterName);
    transition.conditions[id] = {
        parameterName: props.parameterName,
        predicate: props.predicate ?? 'EQUAL_TO',
        value: props.value
    };
    ids.push({ kind: op.kind, id });
};

const updateCondition = (data: Data, op: Operation) => {
    const transitionId = validId(op.transitionId, 'Transition id');
    const transition = own(data.transitions, transitionId, 'Transition');
    if (transition.defaultTransition) {
        fail(`Default transition ${transitionId} cannot have conditions.`);
    }
    const id = validId(op.id, 'Condition id');
    const condition = own(transition.conditions || {}, id, 'Condition');
    Object.assign(condition, op.properties || {});
};

const removeCondition = (data: Data, op: Operation) => {
    const transitionId = validId(op.transitionId, 'Transition id');
    const transition = own(data.transitions, transitionId, 'Transition');
    if (transition.defaultTransition) {
        fail(`Default transition ${transitionId} cannot have conditions.`);
    }
    const id = validId(op.id, 'Condition id');
    own(transition.conditions || {}, id, 'Condition');
    delete transition.conditions[id];
};

const addParameter = (data: Data, op: Operation, ids: { kind: string; id: number }[]) => {
    const id = op.id === undefined ? nextId(data.parameters) : validId(op.id, 'Parameter id');
    if (Object.hasOwn(data.parameters, id)) {
        fail(`Parameter ${id} already exists.`);
    }
    const name = validName(op.name, 'Parameter name');
    if (Object.values(data.parameters).some((item) => item.name === name)) {
        fail(`Parameter name "${name}" already exists.`);
    }
    if (!PARAMETER_TYPES.includes(op.type)) {
        fail(`Parameter type "${op.type}" is invalid.`);
    }
    validateValue(op.type, op.value, `Parameter "${name}" value`);
    data.parameters[id] = { name, type: op.type, value: op.value };
    ids.push({ kind: op.kind, id });
};

const updateParameter = (data: Data, op: Operation) => {
    const id = validId(op.id, 'Parameter id');
    const item = own(data.parameters, id, 'Parameter');
    const props = op.properties || {};
    if (props.name !== undefined) {
        const name = validName(props.name, 'Parameter name');
        if (Object.entries(data.parameters).some(([key, value]) => Number(key) !== id && value.name === name)) {
            fail(`Parameter name "${name}" already exists.`);
        }
        Object.values(data.transitions).forEach((transition) =>
            Object.values(transition.conditions || {}).forEach((condition: any) => {
                if (condition.parameterName === item.name) {
                    condition.parameterName = name;
                }
            })
        );
        item.name = name;
    }
    if (props.type !== undefined) {
        if (!PARAMETER_TYPES.includes(props.type)) {
            fail(`Parameter type "${props.type}" is invalid.`);
        }
        item.type = props.type;
        item.value = ['BOOLEAN', 'TRIGGER'].includes(props.type) ? !!item.value : 0;
        Object.values(data.transitions).forEach((transition) =>
            Object.values(transition.conditions || {}).forEach((condition: any) => {
                if (condition.parameterName === item.name) {
                    condition.value = ['BOOLEAN', 'TRIGGER'].includes(props.type) ? true : 0;
                    if (['BOOLEAN', 'TRIGGER'].includes(props.type)) {
                        condition.predicate = 'EQUAL_TO';
                    }
                }
            })
        );
    }
    if (props.value !== undefined) {
        item.value = props.value;
    }
};

const removeParameter = (data: Data, op: Operation) => {
    const id = validId(op.id, 'Parameter id');
    const item = own(data.parameters, id, 'Parameter');
    const used = Object.values(data.transitions).some((transition) =>
        Object.values(transition.conditions || {}).some((condition: any) => condition.parameterName === item.name)
    );
    if (used) {
        fail(`Parameter "${item.name}" is used by a condition; remove those conditions first.`);
    }
    delete data.parameters[id];
};

const handlers: Record<string, (data: Data, op: Operation, ids: { kind: string; id: number }[]) => void> = {
    'layer.add': addLayer,
    'layer.update': updateLayer,
    'layer.remove': removeLayer,
    'layer.move': moveLayer,
    'state.add': addState,
    'state.update': updateState,
    'state.remove': removeState,
    'transition.add': addTransition,
    'transition.update': updateTransition,
    'transition.remove': removeTransition,
    'transition.move': moveTransition,
    'condition.add': addCondition,
    'condition.update': updateCondition,
    'condition.remove': removeCondition,
    'parameter.add': addParameter,
    'parameter.update': updateParameter,
    'parameter.remove': removeParameter
};

const modifyAnimStateGraph = (value: Data, operations: Operation[]) => {
    const data = structuredClone(value);
    const ids: { kind: string; id: number }[] = [];
    if (!Array.isArray(operations) || !operations.length) {
        fail('At least one anim state graph operation is required.');
    }
    operations.forEach((op, index) => {
        const handler = handlers[op?.kind];
        if (!handler) {
            fail(`Operation ${index} has unsupported kind "${op?.kind}".`);
        }
        handler(data, op, ids);
    });
    validate(data);
    return { data, ids };
};

export { animStateKeys, modifyAnimStateGraph, remapAnimStateAssets };
export type { Data as AnimStateGraphData, Operation as AnimStateGraphOperation };
