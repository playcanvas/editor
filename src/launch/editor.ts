import { type EditorMethods, Editor } from '@/common/editor';
import { Messenger } from '@/common/messenger';
import { setSentryTags } from '@/common/sentry';
import * as api from '@/editor-api';

import { config } from './config';

class LaunchEditor extends Editor<EditorMethods> {
    constructor() {
        super('Launch Editor');
    }

    protected override _registerApi() {
        super._registerApi();

        // Initialize API globals - order matters
        api.globals.schema = new api.Schema(config.schema);
        api.globals.messenger = new api.Messenger(new Messenger());
    }
}

// editor
window.editor = new LaunchEditor();

setSentryTags({
    user_id: config.self?.id,
    project_id: config.project?.id,
    scene_id: config.scene?.id,
    branch_id: config.self?.branch?.id
});
