import * as api from '@playcanvas/editor-api';

import { Editor } from '../common/editor.ts';
import { Messenger } from '../common/messenger.ts';

class LaunchEditor extends Editor {
    constructor() {
        super('Launch Editor');
    }

    _registerApi() {
        super._registerApi();

        // Initialize API globals - order matters
        api.globals.schema = new api.Schema(config.schema);
        api.globals.messenger = new api.Messenger(new Messenger());
    }
}

// editor
window.editor = new LaunchEditor();
