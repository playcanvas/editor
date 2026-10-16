import { expect } from 'chai';
import { before, beforeEach, describe, it } from 'mocha';

// a type-only import: the module itself loads in before(), once the page globals it reads exist
import type * as TabsModule from '../../../src/editor/pickers/project-management/tabs';

type Tab = { location: { href: string } };

describe('project tabs', () => {
    let tabs: Record<string, Tab>;
    let opens: string[];
    let mod: typeof TabsModule;

    before(async () => {
        // the page globals tabs.ts reads: the editor config, the url's local build flags and window.open
        (globalThis as any).window = {
            config: { url: { home: 'https://playcanvas.com' } },
            open: (_url: string, name: string) => {
                opens.push(name);
                tabs[name] ??= { location: { href: 'about:blank' } };
                return tabs[name];
            }
        };
        (globalThis as any).location = { search: '?use_local_frontend&use_local_engine=http://localhost:51000&debug' };
        mod = await import('../../../src/editor/pickers/project-management/tabs');
    });

    beforeEach(() => {
        tabs = {};
        opens = [];
    });

    it('names the projects tab and each project tab', () => {
        expect(mod.PROJECTS_TAB).to.equal('editor:projects');
        expect(mod.projectTab(42)).to.equal('editor:42');
    });

    it('builds project and scene urls that keep only the local build flags', () => {
        expect(mod.editorUrl(42)).to.equal(
            'https://playcanvas.com/editor/project/42?use_local_frontend=&use_local_engine=http%3A%2F%2Flocalhost%3A51000'
        );
        expect(mod.editorUrl(42, 7)).to.match(/^https:\/\/playcanvas\.com\/editor\/scene\/7\?use_local_frontend=/);
    });

    it('opens the projects page in its own tab and reuses it without reloading', () => {
        mod.openProjects();
        expect(tabs['editor:projects'].location.href).to.match(
            /^https:\/\/playcanvas\.com\/editor\?use_local_frontend=/
        );

        tabs['editor:projects'].location.href = 'https://playcanvas.com/editor?changed';
        mod.openProjects();
        expect(opens).to.deep.equal(['editor:projects', 'editor:projects']);
        expect(tabs['editor:projects'].location.href).to.equal('https://playcanvas.com/editor?changed');
    });

    it('opens a project in its own tab, reuses it, and moves it only when a scene is asked for', () => {
        mod.openProject(42);
        const tab = tabs['editor:42'];
        expect(tab.location.href).to.match(/\/editor\/project\/42\?/);

        tab.location.href = 'https://playcanvas.com/editor/scene/3';
        mod.openProject(42);
        expect(tab.location.href).to.equal('https://playcanvas.com/editor/scene/3');

        mod.openProject(42, 7);
        expect(tab.location.href).to.match(/\/editor\/scene\/7\?/);
    });

    it('does nothing when the browser blocks the tab', () => {
        (globalThis as any).window.open = () => null;
        expect(() => mod.openProject(42)).to.not.throw();
    });
});
