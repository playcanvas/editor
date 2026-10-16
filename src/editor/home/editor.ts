import { Caller } from '@/common/caller';
import type { EditorMethods } from '@/common/editor';
import { Messenger as MessengerClient } from '@/common/messenger';
import { setSentrySource, setSentryUser } from '@/common/sentry';
import { globals } from '@/editor-api/globals';
import { Messenger } from '@/editor-api/messenger';
import { Rest } from '@/editor-api/rest';

import { config } from '../config';

/**
 * The editor instance on the projects home page (/editor). It carries only the rest and messenger
 * apis the page uses, so none of the scene editor (realtime, assets, entities, the engine) loads here.
 */
class HomeEditor extends Caller<EditorMethods> {
    /** The api globals the home page uses. */
    api = { globals };

    constructor() {
        super('Home');

        globals.accessToken = 'accessToken' in config ? config.accessToken : '';
        globals.apiUrl = config.url.api;
        globals.homeUrl = config.url.home;
        globals.rest = new Rest();
        globals.messenger = new Messenger(new MessengerClient());

        this.method('visibility', () => document.visibilityState === 'visible');
        document.addEventListener('visibilitychange', () => {
            this.emit(document.visibilityState);
            this.emit('visibility', document.visibilityState === 'visible');
        });

        document.addEventListener('DOMContentLoaded', () => {
            this.emit('load');
            queueMicrotask(() => this.emit('loaded'));
        });

        // connect the messenger, then show the projects page
        this.once('loaded', () => {
            this.emit('start');
            this.call('picker:project:cms');
        });
    }
}

// the page's modules are typed against the scene editor, of which this is the subset they use
window.editor = new HomeEditor() as unknown as typeof window.editor;

setSentryUser(config.self?.id);
setSentrySource(config.url?.engine, config.url?.frontend);
