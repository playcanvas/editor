import fs from 'node:fs';

import { expect } from 'chai';
import { describe, it } from 'mocha';

import { unsetLocal } from '../../src/common/observer-unset';

describe('unsetLocal', () => {
    it('removes the local value without emitting an operation and restores sync', () => {
        const ops = [];
        const state: Record<string, unknown> = { legacy: true };
        const item = {
            sync: { enabled: true },
            unset(path: string) {
                if (this.sync.enabled) ops.push(path);
                delete state[path];
            }
        };

        unsetLocal(item, 'legacy');

        expect(state).not.to.have.property('legacy');
        expect(ops).to.deep.equal([]);
        expect(item.sync.enabled).to.equal(true);
    });

    it('keeps an already-disabled sync disabled', () => {
        const state: Record<string, unknown> = { legacy: true };
        const item = {
            sync: { enabled: false },
            unset(path: string) {
                delete state[path];
            }
        };

        unsetLocal(item, 'legacy');

        expect(state).not.to.have.property('legacy');
        expect(item.sync.enabled).to.equal(false);
    });

    it('is used only for retired migration keys', () => {
        const assets = fs.readFileSync('src/editor/assets/assets-migrate.ts', 'utf8');
        const entities = fs.readFileSync('src/editor/entities/entities-migrations.ts', 'utf8');
        const settings = fs.readFileSync('src/editor/settings/project-settings.ts', 'utf8');

        expect(assets).to.include('unsetLocal(asset, oldPath)');
        expect(assets).not.to.include('asset.unset(oldPath)');
        for (const path of ['data.useGamma', 'data.fresnelModel']) {
            expect(assets).to.include(`unsetLocal(asset, '${path}')`);
            expect(assets).not.to.include(`asset.unset('${path}')`);
        }
        expect(entities).to.include("unsetLocal(entity, 'components.light.affectLightMapped')");
        for (const path of ['preferWebGl2', 'deviceTypes', 'useLegacyAudio']) {
            expect(settings).to.include(`unsetLocal(settings, '${path}')`);
            expect(settings).not.to.include(`settings.unset('${path}')`);
        }
    });
});
