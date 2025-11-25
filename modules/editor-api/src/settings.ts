import { Events } from '@playcanvas/observer';

import { SceneSettings } from './settings/scene';

/**
 * The settings for the Editor.
 */
class Settings extends Events {
    private _sceneSettings: SceneSettings;

    /**
     * Creates new API instance
     */
    constructor() {
        super();

        this._sceneSettings = new SceneSettings();
    }

    /**
     * Gets the settings for the currently loaded scene.
     */
    get scene() {
        return this._sceneSettings;
    }
}

export { Settings };
