import { type EditorMethods, Editor } from '@/common/editor';
import { Messenger } from '@/common/messenger';
import { setSentryTags } from '@/common/sentry';
import * as api from '@/editor-api';

import { config } from './config';

class CodeEditor extends Editor<EditorMethods> {
    isCodeEditor = true;

    constructor() {
        super('Code Editor');

        this.once('loaded', () => {
            this.emit('start');

            // notify the parent window that the code editor is ready
            window.opener?.postMessage('ready');

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

    protected override _registerApi() {
        super._registerApi();

        // Initialize API globals - order matters
        api.globals.schema = new api.Schema(config.schema);
        api.globals.messenger = new api.Messenger(new Messenger());
        api.globals.assets = new api.Assets({ autoSubscribe: true });
    }
}

window.editor = new CodeEditor();

setSentryTags({
    user_id: config.self?.id,
    project_id: config.project?.id,
    branch_id: config.self?.branch?.id
});

// set window name if necessary
if (!window.name) {
    window.name = `codeeditor:${config.project.id}`;
}
