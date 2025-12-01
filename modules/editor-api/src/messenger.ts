import { Events } from '@playcanvas/observer';

import { globals as api } from './globals';

/**
 * The MessagerClient interface extends the Events class and defines the methods and properties
 * required for the Messenger client.
 */
export type MessagerClient = Events & {
    /**
     * Connects to the specified URL.
     * @param url - The URL to connect to.
     */
    connect(url: string): void;

    /**
     * Indicates whether the client is connected.
     */
    isConnected: boolean;

    /**
     * Authenticates the client with the specified access token and role.
     * @param accessToken - The access token for authentication.
     * @param role - The role for authentication.
     */
    authenticate(accessToken: string, role: string): void;

    /**
     * Watches the specified project.
     * @param projectId - The ID of the project to watch.
     */
    projectWatch(projectId: string): void;
};


/**
 * The Messenger API. The messenger receives messages
 * when various things happen e.g. an asset is created etc.
 *
 * @category Internal
 */
class Messenger extends Events {
    private _messenger: MessagerClient;

    private _url: string;

    /**
     * Constructor
     *
     * @param messenger - The instance of the Messenger client - this is
     * a different class which requires the Messenger client library to be downloaded.
     */
    constructor(messenger: MessagerClient) {
        super();
        this._messenger = messenger;
        this._url = null;

        messenger.on('connect', this._onConnect.bind(this));
        messenger.on('welcome', this._onWelcome.bind(this));
        messenger.on('message', this._onMessage.bind(this));
    }

    private _onConnect() {
        this._messenger.authenticate(api.accessToken, 'designer');
        this.emit('connected');
    }

    private _onWelcome() {
        this._messenger.projectWatch(api.projectId as unknown as string);
    }

    private _onMessage(data: { name: string; data: any; }) {
        this.emit(data.name, data.data);
        this.emit('message', data.name, data.data);
    }

    /**
     * Connects to the messenger server.
     *
     * @param url - The server URL
     */
    connect(url: string) {
        this._url = url;
        this._messenger.connect(url);
    }

    /**
     * Returns true if we are connected to the messenger server.
     */
    get isConnected() {
        return this._messenger.isConnected;
    }
}

export { Messenger };
