import fs from 'node:fs';

import { expect } from 'chai';
import { describe, it } from 'mocha';

describe('fixed-field reset contract', () => {
    it('resets fixed fields instead of deleting them', () => {
        const cubemap = fs.readFileSync('src/editor/inspector/assets/cubemap-face.ts', 'utf8');
        const model = fs.readFileSync('src/editor/inspector/components/model.ts', 'utf8');
        const unlink = fs.readFileSync('src/editor/templates/unlink-template.ts', 'utf8');
        const repair = fs.readFileSync('src/editor/templates/migrations/fix-corrupted-instances.ts', 'utf8');
        const states = fs.readFileSync('src/editor/animstategraph/view.ts', 'utf8');
        const params = fs.readFileSync('src/editor/animstategraph/parameters.ts', 'utf8');
        const project = fs.readFileSync('src/editor/driver/project.ts', 'utf8');
        const asset = fs.readFileSync('src/editor/driver/asset.ts', 'utf8');
        const entity = fs.readFileSync('src/editor/driver/entity.ts', 'utf8');
        const overrides = fs.readFileSync('src/editor/templates/revert-overrides.ts', 'utf8');
        const drop = fs.readFileSync('src/editor/viewport/viewport-drop-material.ts', 'utf8');
        const picker = fs.readFileSync('src/editor/pickers/picker-node.ts', 'utf8');

        expect(cubemap).to.include("this._asset.set('data.rgbm', false)");
        expect(cubemap).not.to.include("this._asset.unset('data.rgbm')");
        expect(model).to.include("latest.set('components.model.mapping', {})");
        expect(model).not.to.include("latest.unset('components.model.mapping')");
        expect(states).to.include('`data.states.${stateKey}.defaultState`, false');
        expect(states).not.to.include('unset(`data.states.${stateKey}.defaultState`)');
        expect(params).to.include('`data.transitions.${transitionKey}.conditions.${conditionKey}.parameterName`,');
        expect(params).not.to.include(
            'unset(`data.transitions.${transitionKey}.conditions.${conditionKey}.parameterName`)'
        );
        for (const source of [unlink, repair]) {
            expect(source).to.include("entity.set('template_id', null)");
            expect(source).to.include("entity.set('template_ent_ids', null)");
            expect(source).not.to.include("entity.unset('template_id')");
            expect(source).not.to.include("entity.unset('template_ent_ids')");
        }
        expect(project).to.include('api.schema.resolvePath(root, path)');
        expect(project).to.include('resolveUnset(');
        expect(asset).to.include('api.schema.assets.resolveMetaPath(type, edit.path.slice(5))');
        expect(asset).not.to.include('META_DEFAULTS');
        expect(entity).to.include("api.schema.getDocument('scene')");
        expect(overrides).to.include('unsetObserver(entity, override.path)');
        expect(drop).to.include('unsetObserver(item, undo.path)');
        expect(drop).to.include('unsetObserver(item, redo.path)');
        expect(picker).to.include("path: 'components.model.mapping'");
        expect(picker).to.include('path: `components.model.mapping.${index}`');
        expect(picker).to.include('unsetObserver(item, actions[i].path)');
    });
});
