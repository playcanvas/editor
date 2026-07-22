import { expect } from 'chai';
import { describe, it } from 'mocha';

import { animStateKeys, modifyAnimStateGraph } from '../../src/editor/animstategraph/data';
import { modifyAnimationEvents } from '../../src/editor/animstategraph/events-data';

const graph = () => ({
    layers: {
        0: { name: 'Base', states: [0, 1, 2, 3], transitions: [0], blendType: 'OVERWRITE', weight: 1 }
    },
    states: {
        0: { id: 0, name: 'START', nodeType: 3, posX: 0, posY: 0 },
        1: { id: 1, name: 'ANY', nodeType: 4, posX: 0, posY: 0 },
        2: { id: 2, name: 'END', nodeType: 5, posX: 0, posY: 0 },
        3: { id: 3, name: 'Idle', nodeType: 1, speed: 1, loop: true, posX: 0, posY: 0 }
    },
    transitions: {
        0: { from: 0, to: 3, defaultTransition: true, edgeType: 1, conditions: {} }
    },
    parameters: {}
});

describe('anim state graph data operations', () => {
    it('applies a structural batch to a clone and keeps references valid', () => {
        const source = graph();
        const result = modifyAnimStateGraph(source, [
            { kind: 'parameter.add', id: 0, name: 'Speed', type: 'FLOAT', value: 0 },
            { kind: 'parameter.add', id: 1, name: 'Jump', type: 'TRIGGER', value: false },
            { kind: 'state.add', layerId: 0, id: 4, name: 'Walking' },
            { kind: 'state.add', layerId: 0, id: 5, name: 'Jump' },
            { kind: 'transition.add', layerId: 0, id: 1, from: 3, to: 4 },
            {
                kind: 'condition.add',
                transitionId: 1,
                id: 0,
                properties: { parameterName: 'Speed', predicate: 'GREATER_THAN', value: 0.1 }
            },
            { kind: 'transition.add', layerId: 0, id: 2, from: 1, to: 5 },
            {
                kind: 'condition.add',
                transitionId: 2,
                id: 0,
                properties: { parameterName: 'Jump', predicate: 'EQUAL_TO', value: true }
            },
            { kind: 'transition.add', layerId: 0, id: 4, from: 5, to: 3, properties: { exitTime: 0.9 } },
            { kind: 'transition.add', layerId: 0, id: 3, from: 3, to: 4 },
            { kind: 'transition.move', id: 3, index: 0 },
            { kind: 'parameter.update', id: 0, properties: { name: 'Velocity' } },
            { kind: 'state.update', id: 4, properties: { name: 'Walk' } }
        ]);

        expect(source).to.deep.equal(graph());
        expect(result.data.states[4].name).to.equal('Walk');
        expect(result.data.transitions[1].conditions[0].parameterName).to.equal('Velocity');
        expect(result.data.transitions[2].conditions[0].value).to.equal(true);
        expect(result.data.transitions[2].edgeType).to.equal(3);
        expect(result.data.transitions[4].exitTime).to.equal(0.9);
        expect(result.data.transitions[3].priority).to.equal(0);
        expect(result.data.transitions[1].priority).to.equal(1);
        expect(result.ids).to.deep.equal([
            { kind: 'parameter.add', id: 0 },
            { kind: 'parameter.add', id: 1 },
            { kind: 'state.add', id: 4 },
            { kind: 'state.add', id: 5 },
            { kind: 'transition.add', id: 1 },
            { kind: 'condition.add', id: 0 },
            { kind: 'transition.add', id: 2 },
            { kind: 'condition.add', id: 0 },
            { kind: 'transition.add', id: 4 },
            { kind: 'transition.add', id: 3 }
        ]);
    });

    it('rejects dangling condition references without mutating the input', () => {
        const source = graph();
        expect(() =>
            modifyAnimStateGraph(source, [
                { kind: 'state.add', layerId: 0, id: 4, name: 'Walk' },
                { kind: 'transition.add', layerId: 0, id: 1, from: 3, to: 4 },
                { kind: 'condition.add', transitionId: 1, properties: { parameterName: 'Missing', value: 1 } }
            ])
        ).to.throw('Parameter "Missing" not found');
        expect(source).to.deep.equal(graph());
    });

    it('rejects negative transition exit time', () => {
        expect(() =>
            modifyAnimStateGraph(graph(), [
                { kind: 'state.add', layerId: 0, id: 4, name: 'Walk' },
                { kind: 'transition.add', layerId: 0, id: 1, from: 3, to: 4, properties: { exitTime: -0.1 } }
            ])
        ).to.throw('exitTime must be non-negative');
    });

    it('keeps special states and the default transition read-only', () => {
        expect(() =>
            modifyAnimStateGraph(graph(), [{ kind: 'state.update', id: 0, properties: { name: 'Entry' } }])
        ).to.throw('only supports position updates');
        expect(() =>
            modifyAnimStateGraph(graph(), [{ kind: 'transition.update', id: 0, properties: { time: 1 } }])
        ).to.throw('cannot be modified');
        expect(() =>
            modifyAnimStateGraph(graph(), [
                { kind: 'parameter.add', id: 0, name: 'Ready', type: 'BOOLEAN', value: false },
                {
                    kind: 'condition.add',
                    transitionId: 0,
                    properties: { parameterName: 'Ready', predicate: 'EQUAL_TO', value: true }
                }
            ])
        ).to.throw('cannot have conditions');
    });

    it('tracks only animation-bearing state mapping keys', () => {
        const source = graph();
        const renamed = modifyAnimStateGraph(source, [
            { kind: 'layer.update', id: 0, properties: { name: 'Movement' } },
            { kind: 'state.update', id: 3, properties: { name: 'Rest' } }
        ]).data;
        expect([...animStateKeys(source)]).to.deep.equal([[3, 'Base:Idle']]);
        expect([...animStateKeys(renamed)]).to.deep.equal([[3, 'Movement:Rest']]);
    });

    it('cascades state deletion to transitions and rejects used parameter deletion', () => {
        const built = modifyAnimStateGraph(graph(), [
            { kind: 'parameter.add', id: 0, name: 'Speed', type: 'FLOAT', value: 0 },
            { kind: 'state.add', layerId: 0, id: 4, name: 'Walk' },
            { kind: 'transition.add', layerId: 0, id: 1, from: 3, to: 4 },
            {
                kind: 'condition.add',
                transitionId: 1,
                id: 0,
                properties: { parameterName: 'Speed', predicate: 'GREATER_THAN', value: 0 }
            }
        ]).data;

        expect(() => modifyAnimStateGraph(built, [{ kind: 'parameter.remove', id: 0 }])).to.throw(
            'remove those conditions first'
        );
        const removed = modifyAnimStateGraph(built, [{ kind: 'state.remove', id: 4 }]).data;
        expect(removed.states).not.to.have.property('4');
        expect(removed.transitions).not.to.have.property('1');
        expect(removed.layers[0].transitions).to.deep.equal([0]);
    });
});

describe('animation event data operations', () => {
    it('keeps event ids and payload fields stable across a batch', () => {
        const result = modifyAnimationEvents(
            {},
            [
                { kind: 'event.add', id: 4, name: 'jumpOff', time: 0.2, properties: { string: 'left', number: 2 } },
                { kind: 'event.update', id: 4, properties: { time: 0.3 } }
            ],
            1
        );
        expect(result.events[4]).to.deep.equal({ name: 'jumpOff', time: 0.3, string: 'left', number: 2 });
        expect(result.ids).to.deep.equal([4]);
        expect(modifyAnimationEvents(result.events, [{ kind: 'event.remove', id: 4 }], 1).events).to.deep.equal({});
    });

    it('rejects events beyond a reliable clip duration', () => {
        expect(() => modifyAnimationEvents({}, [{ kind: 'event.add', name: 'late', time: 2 }], 1)).to.throw(
            'clip duration'
        );
    });
});
