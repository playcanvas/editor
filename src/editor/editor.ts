import * as api from '@playcanvas/editor-api';

import { type EditorMethods, Editor } from '../common/editor.ts';
import { Messenger } from '../common/messenger.ts';
import { MERGE_STATUS_APPLY_STARTED, MERGE_STATUS_AUTO_STARTED, MERGE_STATUS_READY_FOR_REVIEW } from '../core/constants.ts';

type MainEditorMethods = EditorMethods;

class MainEditor extends Editor<MainEditorMethods> {
    constructor() {
        super('Main Editor');

        this.once('loaded', () => {
            this.call('status:text', 'starting');
            this.emit('start');

            this.call('status:text', 'ready');

            // if no project loaded, open CMS
            if (!config.project.id) {
                this.call('picker:project:cms');
            }

            // if there is a merge in progress for our branch
            const merge = config.self.branch.merge;
            if (merge) {
                // if this user started it then show the conflict manager
                // otherwise if another user started then show the merge in progress overlay
                if (merge.user.id === config.self.id) {
                    switch (merge.mergeProgressStatus) {
                        case MERGE_STATUS_AUTO_STARTED:
                        case MERGE_STATUS_APPLY_STARTED:
                            this.call('picker:conflictManager');
                            break;
                        case MERGE_STATUS_READY_FOR_REVIEW:
                            this.call('picker:diffManager');
                            break;
                        default:
                            if (merge.hasConflicts) {
                                this.call('picker:conflictManager');
                            } else {
                                this.call('picker:diffManager');
                            }
                            break;
                    }
                } else {
                    this.call('picker:versioncontrol:mergeOverlay');
                }
            } else {
                if (config.scene && !config.scene.id) {
                    // if no scene is loaded
                    this.call('scenes:list', (items) => {
                        if (items.length === 1) {
                            this.call('scene:load', items[0].uniqueId);
                        } else {
                            // open picker if no scene is loaded
                            this.call('picker:scene');
                        }
                    });
                }
            }
        });
    }

    _registerApi() {
        super._registerApi();

        // Initialize API globals - order matters
        api.globals.history = new api.History();
        api.globals.selection = new api.Selection();
        api.globals.schema = new api.Schema(config.schema);
        api.globals.realtime = new api.Realtime();
        api.globals.settings = new api.Settings();
        api.globals.messenger = new api.Messenger(new Messenger());
        api.globals.assets = new api.Assets({ autoSubscribe: true });
        api.globals.entities = new api.Entities();
        api.globals.jobs = new api.Jobs();
        api.globals.clipboard = new api.Clipboard('playcanvas_editor_clipboard');
        api.globals.confirmFn = (text, options) => {
            return new Promise((resolve) => {
                let resolved = false;
                this.call('picker:confirm', text, () => {
                    if (resolved) {
                        return;
                    }
                    resolved = true;
                    resolve(true);
                }, options);

                this.once('picker:confirm:close', () => {
                    if (resolved) {
                        return;
                    }
                    resolved = true;
                    resolve(false);
                });
            });
        };

        // asset upload completed callback (clear progress)
        this.api.globals.assets.defaultUploadCompletedCallback = (uploadId, asset) => {
            this.call('status:job', `asset-upload:${uploadId}`);
        };
        // asset upload progress callback
        this.api.globals.assets.defaultUploadProgressCallback = (uploadId, progress) => {
            this.call('status:job', `asset-upload:${uploadId}`, progress);
        };
        // asset upload error callback (clear progress)
        this.api.globals.assets.defaultUploadErrorCallback = (uploadId, err) => {
            this.call('status:job', `asset-upload:${uploadId}`);
        };

        // set parse script callback
        this.api.globals.assets.parseScriptCallback = (asset) => {
            return new Promise((resolve, reject) => {
                this.call('scripts:parse', asset.observer, (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(Object.keys(result.scripts || {}));
                    }
                });
            });
        };
    }
}

// editor
window.editor = new MainEditor();
