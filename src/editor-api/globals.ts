import type { Assets } from './assets';
import type { Clipboard } from './clipboard';
import type { Entities } from './entities';
import type { History } from './history';
import type { Jobs } from './jobs';
import type { Messenger } from './messenger';
import type { Realtime } from './realtime';
import type { Rest } from './rest';
import type { Schema } from './schema';
import type { Selection } from './selection';
import type { Settings } from './settings';

/**
 * Global variables
 */
const globals: {
    /**
     * The history API
     */
    history: History;

    /**
     * The selection API
     */
    selection: Selection;

    /**
     * The schema API
     */
    schema: Schema;

    /**
     * The realtime API
     * @category Internal
     */
    realtime: Realtime;

    /**
     * The assets API
     */
    assets: Assets;

    /**
     * The entities API
     */
    entities: Entities;

    /**
     * The settings API
     */
    settings: Settings;

    /**
     * The messenger API
     * @category Internal
     */
    messenger: Messenger;

    /**
     * The jobs API
     * @category Internal
     */
    jobs: Jobs;

    /**
     * The main clipboard
     * @category Internal
     */
    clipboard: Clipboard;

    /**
     * The REST API
     * @category Internal
     * @ignore
     */
    rest: Rest;

    /**
     * The user's access token
     * @category Internal
     */
    accessToken: string;

    /**
     * The current project id
     */
    projectId: number;

    /**
     * The current branch id
     */
    branchId: string;

    /**
     * The home URL
     */
    homeUrl: string;

    /**
     * The REST API URL
     */
    apiUrl: string;

    /**
     * Whether this project is using legacy scripts
     * @category Internal
     */
    hasLegacyScripts: boolean;

    /**
     * Alert function called when user confirmation is needed
     * for an action. Defaults to the default browser popup but
     * can be overridden to show your custom popup instead.
     *
     * @param text - The confirm dialog text
     * @param options - Options for the popup
     * @param options.yesText - Text for 'yes' option
     * @param options.noText - Text for 'no' option
     * @param options.noDismiss - If true then user cannot dismiss the popup and will have to click yes or no
     * @returns True if the user confirmed, false otherwise
     */
    confirmFn(text: string, options?: { yesText?: string; noText?: boolean; noDismiss?: boolean }): Promise<boolean>;
} = {
    history: undefined,
    selection: undefined,
    schema: undefined,
    realtime: undefined,
    assets: undefined,
    entities: undefined,
    settings: undefined,
    messenger: undefined,
    jobs: undefined,
    clipboard: undefined,
    rest: undefined,
    accessToken: undefined,
    projectId: undefined,
    branchId: undefined,
    homeUrl: '',
    apiUrl: '',
    hasLegacyScripts: undefined,
    confirmFn(
        text: string,
        options: { yesText?: string; noText?: boolean; noDismiss?: boolean } = {}
    ): Promise<boolean> {
        return new Promise((resolve) => {
            resolve(confirm(text));
        });
    }
};

export { globals };
