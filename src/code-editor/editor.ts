import * as api from '@playcanvas/editor-api';

import { Editor } from '../common/editor.ts';
import { Messenger } from '../common/messenger.ts';


class CodeEditor extends Editor {
    isCodeEditor = true;

    constructor() {
        super('Code Editor');

        this.once('loaded', () => {
            this.emit('start');

            window.opener?.postMessage('start', '*');

            // if there is a merge in progress for our branch
            if (config.self.branch.merge && !config.self.branch.merge.conflict) {
                this.call('picker:versioncontrol:mergeOverlay');
            }
        });

        const isMac = navigator.userAgent.indexOf('Mac OS X') !== -1;
        this.method('editor:mac', () => {
            return isMac;
        });
    }

    _registerApi() {
        super._registerApi();

        // Initialize API globals - order matters
        api.globals.schema = new api.Schema(config.schema);
        api.globals.messenger = new api.Messenger(new Messenger());
        api.globals.assets = new api.Assets({ autoSubscribe: true });
    }
}

window.editor = new CodeEditor();

// set window name if necessary
if (!window.name) {
    window.name = `codeeditor:${config.project.id}`;
}
