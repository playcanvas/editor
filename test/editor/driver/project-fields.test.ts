import { expect } from 'chai';
import { describe, it } from 'mocha';

import { pickProjectFields } from '../../../src/editor/driver/project-fields';

describe('pickProjectFields', () => {
    it('accepts the allowed create fields', () => {
        expect(
            pickProjectFields({ name: 'Demo', description: 'Cube', private: true, owner: 7 }, 'create')
        ).to.deep.equal({
            fields: { name: 'Demo', description: 'Cube', private: true, owner: 7 }
        });
    });

    it('accepts a partial update', () => {
        expect(pickProjectFields({ description: 'New' }, 'update')).to.deep.equal({ fields: { description: 'New' } });
    });

    it('ignores undefined values', () => {
        expect(pickProjectFields({ name: 'Demo', description: undefined }, 'create')).to.deep.equal({
            fields: { name: 'Demo' }
        });
    });

    it('rejects each unsupported field by name', () => {
        const { error } = pickProjectFields({ name: 'Demo', fork_from: 1, settings: {} }, 'create');
        expect(error).to.contain('fork_from').and.to.contain('settings');
    });

    it('rejects owner on update', () => {
        expect(pickProjectFields({ owner: 7 }, 'update').error).to.contain('owner');
    });

    it('requires a name on create', () => {
        expect(pickProjectFields({ description: 'Cube' }, 'create').error).to.equal('Project name is required.');
    });

    it('rejects an empty name', () => {
        expect(pickProjectFields({ name: '  ' }, 'create').error).to.equal('Project name cannot be empty.');
    });

    it('rejects an update with no fields', () => {
        expect(pickProjectFields({}, 'update').error).to.contain('at least one');
    });

    it('enforces field types', () => {
        const { error } = pickProjectFields({ name: 'Demo', private: 'yes', owner: 1.5 }, 'create');
        expect(error).to.contain('private (expected boolean)').and.to.contain('owner (expected integer)');
    });

    it('treats missing input as empty', () => {
        expect(pickProjectFields(null, 'create').error).to.equal('Project name is required.');
    });
});
