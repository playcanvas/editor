import * as api from '@playcanvas/editor-api';

import { type EditorMethods, Editor } from '@/common/editor';
import { Messenger } from '@/common/messenger';

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
