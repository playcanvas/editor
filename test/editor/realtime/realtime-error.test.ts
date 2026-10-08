import { expect } from 'chai';
import { describe, it } from 'mocha';

import { docRejection, sceneRejection, settingsRejection } from '../../../src/editor/realtime/realtime-error';

const names: Record<string, string> = { e1: 'Camera' };
const nameOf = (id: string) => names[id];

describe('sceneRejection', () => {
    it('names the entity and path of a refused delete', () => {
        const { entity, msg } = sceneRejection(
            new Error('invalid:delete'),
            [
                { p: ['entities', 'e1', 'components', 'camera'], oi: {} },
                { p: ['entities', 'e1', 'tags'], od: [] }
            ],
            nameOf
        );
        expect(entity).to.equal('e1');
        expect(msg).to.equal('Server refused to delete tags on Camera<< (e1)>>, change reverted<< (invalid:delete)>>');
    });

    it('describes a whole-entity op and falls back when the entity is unknown', () => {
        const { msg } = sceneRejection('invalid:value', [{ p: ['entities', 'e2'], oi: {} }], nameOf);
        expect(msg).to.equal('Server refused to set entity<< (e2)>>, change reverted<< (invalid:value)>>');
    });

    it('uses the raw path outside entities', () => {
        const { entity, msg } = sceneRejection(
            'invalid:exception: bad',
            [{ p: ['settings', 'render', 'fog'], od: 'x', oi: 'y' }],
            nameOf
        );
        expect(entity).to.equal(undefined);
        expect(msg).to.equal('Server refused to set settings.render.fog, change reverted<< (invalid:exception: bad)>>');
    });
});

describe('docRejection', () => {
    it('names the asset and path of a refused delete', () => {
        const msg = docRejection(new Error('invalid:delete'), [{ p: ['data', 'fresnelModel'], od: 2 }], 'Mat<< (7)>>');
        expect(msg).to.equal(
            'Server refused to delete data.fresnelModel on Mat<< (7)>>, change reverted<< (invalid:delete)>>'
        );
    });

    it('names the subject it is given', () => {
        const msg = docRejection('invalid:type', [{ p: ['name'], oi: 1, od: 'a' }], 'asset 7');
        expect(msg).to.equal('Server refused to set name on asset 7, change reverted<< (invalid:type)>>');
    });
});

describe('settingsRejection', () => {
    it('labels the settings doc the refused setting lives in', () => {
        const msg = settingsRejection('invalid:delete', [{ p: ['editor', 'gridDivisions'], od: 8 }], 'projectUser');
        expect(msg).to.equal(
            'Server refused to delete editor.gridDivisions on project user settings, change reverted<< (invalid:delete)>>'
        );
    });

    it('falls back to the doc name for unknown settings', () => {
        const msg = settingsRejection('invalid:delete', [{ p: ['x'], od: 1 }], 'other');
        expect(msg).to.equal('Server refused to delete x on other settings, change reverted<< (invalid:delete)>>');
    });
});
