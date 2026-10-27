import type { RelayServer } from '@/editor/relay/relay-server';
import type { Realtime } from '@/editor-api/realtime';
import type { Rest } from '@/editor-api/rest';
import type { Transport } from '@/editor-api/transport';

// relative, so the contract also loads in node tests, which have no path aliases
import { globals } from '../editor-api/globals';
import { nativeTransport } from '../editor-api/transport';

import type { Messenger } from './messenger';

type Picked<G extends keyof Rest, K extends keyof Rest[G]> = Pick<Rest[G], K>;

/**
 * Optional backend features, each the REST operations one existing workflow needs. A supplied
 * service implements every listed operation with the REST client's arguments, Ajax handles and
 * errors. A page's config names the services its backend does not provide (`config.unsupported`),
 * and those are absent; a permission denial is an error from a supported operation, and a
 * disconnection is temporary state of the realtime, messenger or relay client, never a missing
 * service.
 *
 * A workflow's reads (`builds`, `branchList`, ...) are separate from its writes, so a backend can
 * list what it has while the actions stay unsupported: the pickers open and only their actions are
 * disabled.
 *
 * Calls every page needs to boot (project, scene, asset and user reads, asset writes, tips) stay
 * on the REST client, since every backend answers them.
 */
export type BackendServices = {
    sceneManagement?: Picked<'scenes', 'sceneCreate' | 'sceneDelete'>;

    assetReimport?: Picked<'assets', 'assetReimport'>;
    assetDuplication?: Picked<'assets', 'assetDuplicate'>;
    assetPaste?: Picked<'assets', 'assetPaste'>;

    projectList?: Picked<'projects', 'projectActivity'> &
        Picked<'users', 'userProjects' | 'userUsage'> &
        Picked<'apps', 'appList'>;
    projectCreation?: Picked<'projects', 'projectCreate'>;
    projectDeletion?: Picked<'projects', 'projectDelete'>;
    projectManagement?: Picked<'projects', 'projectUnlock'> & Rest['watch'] & Rest['star'];
    projectTransfer?: Picked<'projects', 'projectTransfer' | 'projectAcceptTransfer' | 'projectDeclineTransfer'>;
    teamList?: Picked<'projects', 'projectCollabList'> &
        Picked<'users', 'userCollabList'> &
        Picked<'invitations', 'invitationList'>;
    teamManagement?: Picked<'projects', 'projectCollabCreate' | 'projectCollabUpdate' | 'projectCollabDelete'> &
        Picked<'invitations', 'invitationCreate' | 'invitationDelete'>;
    accountManagement?: Picked<'users', 'userCreate' | 'userDelete'> & Rest['payment'];
    /** Lists and writes a project's dev log posts. */
    devLog?: Rest['posts'];

    /** Completion is announced by the messenger's `job.update`, then read with `jobs`. */
    projectExport?: Picked<'projects', 'projectExport'>;
    projectImport?: Picked<'projects', 'projectImport'> & Rest['upload'];
    jobs?: Rest['jobs'];

    /** Copies, duplicates and deletes entity batches over 500 in pipeline jobs, not REST. */
    entityJobs?: true;

    builds?: Picked<'apps', 'appGet'> & Picked<'projects', 'projectApps' | 'projectBuilds'>;
    publishing?: Picked<'apps', 'appCreate' | 'appDelete'>;
    downloads?: Picked<'apps', 'appDownload'>;
    /** Serves the Static Website download format; without it the dialog offers NPM only. */
    staticDownloads?: true;
    /** Deletes download and publish builds by job id, apart from `publishing`'s app deletes. */
    buildDeletion?: Picked<'projects', 'projectBuildDelete'>;

    storeCatalog?: Picked<'store', 'storeList' | 'storeGet' | 'storeAssets' | 'storeAssetFile' | 'storeLicenses'>;
    /** Searches Sketchfab's public api from the page; a third-party call, not REST. */
    sketchfabCatalog?: true;
    storeImport?: Picked<'store', 'storeClone'> & Picked<'assets', 'assetClone'>;
    storePublishing?: Picked<'store', 'storeMove' | 'storeUpload'>;
    userAssets?: Picked<'assets', 'assetsList'>;

    branchList?: Picked<'projects', 'projectBranches'> & Picked<'home', 'homeBranch'>;
    branches?: Picked<'branches', 'branchCreate' | 'branchCheckout' | 'branchOpen' | 'branchClose' | 'branchDelete'>;
    checkpointHistory?: Picked<'checkpoints', 'checkpointGet'> & Picked<'branches', 'branchCheckpoints'>;
    checkpoints?: Picked<'checkpoints', 'checkpointCreate' | 'checkpointRestore' | 'checkpointHardReset'>;
    diffs?: Rest['diff'];
    merges?: Rest['merge'] & Rest['conflicts'];

    /** Records onboarding progress; losing an update only replays a tip. */
    onboarding?: Picked<'home', 'homeSceneOpened' | 'homeSceneEvent'>;

    /** Polls the public GitHub issues for a maintenance notice; a third-party call, not REST. */
    maintenanceNotices?: true;

    /** Urls of the site's pages outside the editor. */
    pages?: {
        project: (projectId: number) => string;
        user: (username: string) => string;
        account: () => string;
        explore: () => string;
    };
};

/**
 * The page's backend. The realtime, messenger and relay clients are created on first use, at the
 * existing initialization stage that needs them, and never more than once per page.
 */
export type Backend = BackendServices & {
    transport: Transport;

    /** Lifecycle events belong to the client; connection operations live on its `connection`. */
    readonly realtime: Realtime;
    readonly messenger: Messenger;
    readonly relay: RelayServer;
};

/**
 * Creates the existing realtime, messenger and relay clients. Supplied by `Editor._registerApi`, so
 * this module holds no client code of its own.
 */
export type BackendClients = {
    realtime: () => Realtime;
    messenger: (transport: Transport) => Messenger;
    relay: (transport: Transport) => RelayServer;
};

/**
 * Picks REST operations into a service, keeping their arguments, Ajax handles and errors.
 *
 * @param src - A REST module.
 * @param keys - The operations the service advertises.
 * @returns The service.
 */
const pick = <T extends object, K extends keyof T>(src: T, ...keys: K[]) =>
    Object.fromEntries(keys.map((key) => [key, src[key]])) as Pick<T, K>;

/**
 * Every service, as the REST client operations themselves.
 *
 * @param rest - The REST client.
 * @returns The services.
 */
export const services = (rest: Rest): Required<BackendServices> => ({
    sceneManagement: pick(rest.scenes, 'sceneCreate', 'sceneDelete'),

    assetReimport: pick(rest.assets, 'assetReimport'),
    assetDuplication: pick(rest.assets, 'assetDuplicate'),
    assetPaste: pick(rest.assets, 'assetPaste'),

    projectList: {
        ...pick(rest.projects, 'projectActivity'),
        ...pick(rest.users, 'userProjects', 'userUsage'),
        ...pick(rest.apps, 'appList')
    },
    projectCreation: pick(rest.projects, 'projectCreate'),
    projectDeletion: pick(rest.projects, 'projectDelete'),
    projectManagement: {
        ...pick(rest.projects, 'projectUnlock'),
        ...rest.watch,
        ...rest.star
    },
    projectTransfer: pick(rest.projects, 'projectTransfer', 'projectAcceptTransfer', 'projectDeclineTransfer'),
    teamList: {
        ...pick(rest.projects, 'projectCollabList'),
        ...pick(rest.users, 'userCollabList'),
        ...pick(rest.invitations, 'invitationList')
    },
    teamManagement: {
        ...pick(rest.projects, 'projectCollabCreate', 'projectCollabUpdate', 'projectCollabDelete'),
        ...pick(rest.invitations, 'invitationCreate', 'invitationDelete')
    },
    accountManagement: { ...pick(rest.users, 'userCreate', 'userDelete'), ...rest.payment },
    devLog: { ...rest.posts },

    projectExport: pick(rest.projects, 'projectExport'),
    projectImport: { ...pick(rest.projects, 'projectImport'), ...rest.upload },
    jobs: { ...rest.jobs },
    entityJobs: true,

    builds: {
        ...pick(rest.apps, 'appGet'),
        ...pick(rest.projects, 'projectApps', 'projectBuilds')
    },
    publishing: pick(rest.apps, 'appCreate', 'appDelete'),
    downloads: pick(rest.apps, 'appDownload'),
    staticDownloads: true,
    buildDeletion: pick(rest.projects, 'projectBuildDelete'),

    storeCatalog: pick(rest.store, 'storeList', 'storeGet', 'storeAssets', 'storeAssetFile', 'storeLicenses'),
    storeImport: { ...pick(rest.store, 'storeClone'), ...pick(rest.assets, 'assetClone') },
    storePublishing: pick(rest.store, 'storeMove', 'storeUpload'),
    userAssets: pick(rest.assets, 'assetsList'),
    sketchfabCatalog: true,

    branchList: {
        ...pick(rest.projects, 'projectBranches'),
        ...pick(rest.home, 'homeBranch')
    },
    branches: pick(rest.branches, 'branchCreate', 'branchCheckout', 'branchOpen', 'branchClose', 'branchDelete'),
    checkpointHistory: {
        ...pick(rest.checkpoints, 'checkpointGet'),
        ...pick(rest.branches, 'branchCheckpoints')
    },
    checkpoints: pick(rest.checkpoints, 'checkpointCreate', 'checkpointRestore', 'checkpointHardReset'),
    diffs: { ...rest.diff },
    merges: { ...rest.merge, ...rest.conflicts },

    onboarding: pick(rest.home, 'homeSceneOpened', 'homeSceneEvent'),
    maintenanceNotices: true,

    pages: {
        project: (projectId) => `/project/${projectId}`,
        user: (username) => `/user/${username}`,
        account: () => '/account',
        explore: () => '/explore/featured'
    }
});

// a host's own message for what its backend lacks, as html in a `<template id="unsupported-message">`
const HOSTED = globalThis.document?.getElementById('unsupported-message') as HTMLTemplateElement | null;

/** The error an unsupported operation reports through its caller's usual error path. */
export const UNSUPPORTED = HOSTED?.content.textContent?.trim() || 'Not available with this backend';

/** {@link UNSUPPORTED} for the status bar and tooltips, as the host's html. */
export const UNSUPPORTED_HTML = HOSTED?.innerHTML.trim() || UNSUPPORTED;

/** The tooltip options for an unsupported action, hoverable so links in the host's message can be clicked. */
export const UNSUPPORTED_TIP = { html: UNSUPPORTED_HTML, hoverable: !!HOSTED };

let instance: Backend | null = null;

/**
 * Builds the page's backend on the configured REST client. Runs once, in `Editor._registerApi`,
 * after `config` has been read.
 *
 * @param rest - The REST client.
 * @param clients - Creates the core clients on first use.
 * @param unsupported - The services the page's backend does not provide, from `config.unsupported`.
 * @returns The backend.
 */
export const initBackend = (rest: Rest, clients: BackendClients, unsupported: readonly string[] = []) => {
    if (instance) {
        throw new Error('backend already initialized');
    }

    const { transport } = globals;
    let realtime: Realtime;
    let messenger: Messenger;
    let relay: RelayServer;

    instance = {
        ...Object.fromEntries(Object.entries(services(rest)).filter(([name]) => !unsupported.includes(name))),
        transport,
        get realtime() {
            return (realtime ??= clients.realtime());
        },
        get messenger() {
            return (messenger ??= clients.messenger(transport));
        },
        get relay() {
            return (relay ??= clients.relay(transport));
        }
    };
    return instance;
};

/**
 * The page's backend.
 *
 * @returns The backend.
 */
export const backend = () => {
    if (!instance) {
        throw new Error('backend used before Editor._registerApi initialized it');
    }
    return instance;
};

/**
 * Forgets the backend. Tests only.
 */
export const resetBackend = () => {
    instance = null;
    globals.transport = nativeTransport;
};
