import { expect } from 'chai';
import { describe, it } from 'mocha';

import { services } from '../../src/common/backend';
import { Rest } from '../../src/editor-api/rest';

describe('download and build delete services', () => {
    const all = services(new Rest());

    it('hosted supplies static downloads and build deletion apart from publishing', () => {
        expect(all.staticDownloads).to.equal(true);
        expect(all.buildDeletion.projectBuildDelete).to.be.a('function');
        expect(all.publishing).to.not.have.property('projectBuildDelete');
    });
});

describe('project management services', () => {
    const all = services(new Rest());

    it('hosted supplies unlocking and following apart from deleting', () => {
        expect(Object.keys(all.projectManagement)).to.deep.equal(['projectDelete']);
        expect(Object.keys(all.projectUnlock)).to.deep.equal(['projectUnlock']);
        expect(all.projectFollowing.watchCreate).to.be.a('function');
        expect(all.projectFollowing.starCreate).to.be.a('function');
    });
});
