/* eslint-disable no-unused-vars */
type Promisifiable<T> = { promisify(): Promise<T> };

type Globals = typeof import('@playcanvas/editor-api').globals;
type OriginalRest = import('@playcanvas/editor-api').Rest;
type Asset = import('@playcanvas/editor-api').Asset;
type Entity = import('@playcanvas/editor-api').Entity;
type Observer = import('@playcanvas/observer').Observer;
type EventHandle = import('@playcanvas/observer').EventHandle;
type CreateEntityArguments = import('@playcanvas/editor-api').CreateEntityArguments;

/** The `layout.assets` panel state the tests read and reset. */
interface AssetsLayout {
    viewMode: string;
    currentFolder: Asset | null;
    visibleAssets: Asset[];
    dropManager: { active: boolean };
    searchInput: { value: string };
}


interface DiffJobData {
    merge_id: string;
    project_id: number;
    src_branch_id: string;
    dst_branch_id: string;
}

interface Job<T = any> {
    id: number;
    status: 'complete' | 'running' | 'error';
    messages?: string[];
    error?: string;
    data: T;
}

interface DiffResult {
    numConflicts: number;
    isDiff: boolean;
}

interface CheckpointListResponse {
    result: { id: string }[];
}

interface EditorRest extends Omit<OriginalRest, 'diff' | 'jobs' | 'branches'> {
    diff: Omit<OriginalRest['diff'], 'diffCreate'> & {
        diffCreate(args: OriginalRest['diff']['DiffCreateArgs']): Promisifiable<Job<DiffJobData>>;
        diffGet(args: { id: string }): Promisifiable<DiffResult>;
    };
    jobs: Omit<OriginalRest['jobs'], 'jobGet'> & {
        jobGet(args: { jobId: number }): Promisifiable<Job>;
    };
    branches: Omit<OriginalRest['branches'], 'branchCheckpoints'> & {
        branchCheckpoints(args: OriginalRest['branches']['BranchCheckpointArgs']): Promisifiable<CheckpointListResponse>;
    };
}

/** The messenger payload fields the tests read. */
interface MessageData {
    status?: string;
    error?: string;
    message?: string;
    project_id?: number;
    branch_id?: string;
    job?: { id: number };
    app?: { id: number };
    asset?: { id: string };
}

/** A REST list response, typed to the fields the tests read. */
interface ListResponse<T = { id: number | string; name: string }> {
    result?: T[];
}

/** A published app as the apps api reports it. */
interface AppRecord {
    id: number;
    url: string;
    task?: { error?: string };
}

interface Window {
    config: import('@playcanvas/editor-api').EditorConfig;

    /** The engine global of the editor and launch pages; both have a running app, so `app` is never null there. */
    pc: typeof import('playcanvas') & { app: import('playcanvas').AppBase };

    // state the tests stamp on a page
    __e2eAdds?: Map<string, Promise<{ id: number; name: string }>>;
    __noReload?: boolean;
    __stillOpen?: boolean;
    probe?: string;

    editor: {
        methods: { has(method: string): boolean };
        emit(event: string, ...args: unknown[]): void;
        call(method: string, ...args: unknown[]): unknown;
        on(event: string, callback: (...args: never[]) => void): { unbind(): void };
        once(event: string, callback: (...args: never[]) => void): { unbind(): void };
        api: {
            globals: Omit<Globals, 'rest'> & { rest: EditorRest };
        };
    };
}
