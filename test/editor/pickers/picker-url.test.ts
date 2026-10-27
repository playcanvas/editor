import { expect } from 'chai';
import { describe, it } from 'mocha';

import { readUrl, sectionName, sectionSlug, withParams } from '../../../src/editor/pickers/picker-url';

const SLUGS = {
    'project-main': 'settings',
    scenes: 'scenes',
    'builds-publish': 'builds',
    'build-detail': 'build',
    'publish-new': 'publish',
    'publish-download': 'download',
    team: 'team',
    'version control': 'version-control',
    'dev-log': 'dev-log'
};

const LOCAL = 'https://playcanvas.com/editor?use_local_frontend&use_local_engine=http%3A%2F%2Flocalhost%3A51000';

describe('picker url', () => {
    it('maps every section to its url value and back', () => {
        for (const [name, slug] of Object.entries(SLUGS)) {
            expect(sectionSlug(name)).to.equal(slug);
            expect(sectionName(slug)).to.equal(name);
        }
    });

    it('has no section for unknown values, including object keys', () => {
        expect(sectionName('nope')).to.equal(null);
        expect(sectionName('constructor')).to.equal(null);
        expect(sectionName(null)).to.equal(null);
        expect(sectionSlug('nope')).to.equal(null);
    });

    it('adds a bare flag and keeps other params exactly as written', () => {
        expect(withParams(LOCAL, { new: true })).to.equal(`${LOCAL}&new`);
        expect(withParams('https://playcanvas.com/editor', { new: true, kit: null })).to.equal(
            'https://playcanvas.com/editor?new'
        );
    });

    it('sets, replaces and removes only its own params', () => {
        const open = withParams(LOCAL, { project: 42, section: 'team', build: null });
        expect(open).to.equal(`${LOCAL}&project=42&section=team`);
        expect(withParams(open, { project: 42, section: 'scenes' })).to.equal(`${LOCAL}&project=42&section=scenes`);
        expect(withParams(open, { project: null, section: false, build: undefined })).to.equal(LOCAL);
        expect(withParams('https://playcanvas.com/editor?new&kit=7&debug', { new: null, kit: null })).to.equal(
            'https://playcanvas.com/editor?debug'
        );
    });

    it('drops the query entirely once nothing is left, and keeps the path and hash', () => {
        expect(withParams('https://playcanvas.com/editor?new', { new: null })).to.equal(
            'https://playcanvas.com/editor'
        );
        expect(
            withParams('https://playcanvas.com/editor/scene/5?x=1#h', { section: 'build', build: 'job-9' })
        ).to.equal('https://playcanvas.com/editor/scene/5?x=1&section=build&build=job-9#h');
    });

    it('encodes values', () => {
        expect(withParams('https://playcanvas.com/editor', { kit: 'a b&c' })).to.equal(
            'https://playcanvas.com/editor?kit=a%20b%26c'
        );
    });

    it('reads the picker state from a url', () => {
        expect(readUrl('https://playcanvas.com/editor?use_local_frontend&new&kit=7')).to.deep.equal({
            new: true,
            kit: '7',
            project: null,
            section: null,
            build: null,
            open: false
        });
        expect(readUrl('https://playcanvas.com/editor?project=42&section=version-control')).to.deep.include({
            new: false,
            project: 42,
            section: 'version control',
            open: true
        });
        expect(readUrl('https://playcanvas.com/editor/scene/5?section=build&build=job-9')).to.deep.include({
            section: 'build-detail',
            build: 'job-9'
        });
    });

    it('reads bad project ids and unknown sections as none, still open for a named section', () => {
        expect(readUrl('https://playcanvas.com/editor?project=abc&section=bogus')).to.deep.include({
            project: null,
            section: null,
            open: true
        });
    });

    it('round-trips what it writes', () => {
        const href = withParams(LOCAL, { new: true, kit: '7' });
        expect(readUrl(href)).to.deep.include({ new: true, kit: '7' });
        expect(new URL(href).searchParams.has('use_local_frontend')).to.equal(true);
    });
});
