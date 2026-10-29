/* eslint-disable no-unused-vars */
type Promisifiable<T> = { promisify(): Promise<T> };

type Globals = typeof import('@playcanvas/editor-api').globals;
type OriginalRest = import('@playcanvas/editor-api').Rest;
type Asset = import('@playcanvas/editor-api').Asset;
type Entity = import('@playcanvas/editor-api').Entity;
type Observer = import('@playcanvas/observer').Observer;
type EventHandle = { unbind(): void };
type CreateEntityArguments = import('@playcanvas/editor-api').CreateEntityArguments;

/** The `layout.assets` panel state the tests read and reset. */
interface AssetsLayout {
    viewMode: string;
    currentFolder: Asset | null;
    visibleAssets: Asset[];
    dropManager: { active: boolean };
    searchInput: { value: string };
}

/** The monaco editor members the code editor tests use. */
interface MonacoEditor {
    getModel(): { getLineCount(): number; getLineMaxColumn(line: number): number };
    setPosition(position: { lineNumber: number; column: number }): void;
    getValue(): string;
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

interface PcVec3 {
    x: number;
    y: number;
    z: number;
    clone(): PcVec3;
    toArray(): number[];
}

/** The engine entity members the launch and viewport tests read. */
interface PcEntity {
    name: string;
    enabled: boolean;
    parent: PcEntity | null;
    children: PcEntity[];
    findByGuid(guid: string): PcEntity | null;
    findByName(name: string): PcEntity | null;
    getGuid(): string;
    getPosition(): PcVec3;
    getLocalPosition(): PcVec3;
    setPosition(x: number, y: number, z: number): void;
    setEulerAngles(x: number, y: number, z: number): void;
    script?: { enabled: boolean };
    render: {
        type: string;
        asset: number;
        meshInstances: {
            material: { diffuse: { r: number; g: number; b: number } };
            mesh: { aabb: { halfExtents: PcVec3 }; vertexBuffer: { numVertices: number } };
        }[];
    };
    collision: { renderAsset: number };
    gsplat: { asset: number };
    joint: { type: string; entityA: PcEntity; entityB: PcEntity; constraint: unknown };
    anim: { speed: number; baseLayer: { activeStateCurrentTime: number } };
    element: {
        text: string;
        textWidth: number;
        textHeight: number;
        font: { data: { chars: Record<string, unknown> }; textures: unknown[] };
    };
    camera: { camera: { worldToScreen(point: PcVec3, width: number, height: number): PcVec3 } };
}

/** The engine application members the launch and viewport tests read. */
interface PcApp {
    frame: number;
    root: PcEntity;
    scene: { root: PcEntity };
    assets: { get(id: number): { resource: { meshes: unknown[]; numSplats: number } } };
    graphicsDevice: { deviceType: string; isWebGPU: boolean; isWebGL2: boolean };
    on(event: string, callback: () => void): void;
    off(event: string, callback: () => void): void;
    once(event: string, callback: () => void): void;
}

interface Window {
    config: import('@playcanvas/editor-api').EditorConfig;

    /** The engine global of the editor and launch pages. */
    pc: { app: PcApp };

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
