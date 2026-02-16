type Metrics = {
    env: string,
    send: boolean
};

type Plan = {
    id: number,
    type: string,
};

type Project = {
    id: number,
    name: string,
    permissions: {
        admin: number[]
        read: number[],
        write: number[]
    },
    private: boolean,
    primaryApp: number,
    playUrl: string,
    settings: object
};

type Scene = {
    id: string,
    uniqueId: string,
};

type Sentry = {
    enabled: true,
    env: string,
    version: string
    send: boolean,
    service: string,
    page: string
    disable_breadcrumbs: boolean
} | {
    enabled: false
};

type ModelSchema = {
    scene: object,
    settings: object,
    asset: object,
};

type Url = {
    api: string,
    launch: string,
    home: string,
    realtime: {
        http: string,
    },
    messenger: {
        http: string,
        ws: string,
    },
    relay: {
        http: string,
        ws: string,
    },
    frontend: string,
    engine: string,
    useCustomEngine: boolean,
};

type EngineVersions = {
    current: { version: string, description: string },
    force: { version: string, description: string },
    previous?: { version: string, description: string },
    releaseCandidate?: { version: string, description: string },
};

type WasmModule = {
    moduleName: string,
    glueUrl: string,
    wasmUrl: string,
    fallbackUrl: string,
    preload: boolean
};

export type EditorBlankConfig = {
    version: string,
    self: {
        id: number,
        username: string,
        flags: Record<string, any>,
        plan: Plan,
        branch: {
            id: null
        },
        diskAllowance: number
    },
    accessToken: string,
    project: {
        id: null
    },
    url: Url & {
        store: string,
        howdoi: string,
        static: string,
        images: string,
    },
    schema: ModelSchema,
    engineVersions: EngineVersions
    sentry: Sentry,
    metrics: Metrics,
    oneTrustDomainKey: string,
    wasmModules: WasmModule[]
};

export type EditorConfig = {
    version: string,
    self: {
        id: number
        username: string,
        flags: Record<string, any>,
        branch: {
            id: string,
            name: string,
            createdAt: string,
            latestCheckpointId: string,
            merge?: object
        },
        plan: Plan,
        locale: string
    },
    owner: {
        id: number,
        username: string,
        plan: Plan,
        size: number,
        diskAllowance: number
    },
    accessToken: string,
    project: Project & {
        description: string,
        privateAssets: boolean,
        hasPrivateSettings: boolean,
        thumbnails: {
            s?: string,
            m?: string,
            l?: string,
            xl?: string
        }
        masterBranch: string,
    },
    aws: {
        s3Prefix: string,
    },
    store: {
        sketchfab: {
            clientId: string,
            cookieName: string,
            redirectUrl: string,
        }
    },
    scene: Scene,
    url: Url & {
        store: string,
        howdoi: string,
        static: string,
        images: string,
    },
    engineVersions: EngineVersions,
    sentry: Sentry,
    metrics: Metrics,
    oneTrustDomainKey: string,
    schema: ModelSchema,
    wasmModules: WasmModule[],
};

export type CodeEditorConfig = {
    self: {
        id: number,
        username: string,
        flags: Record<string, any>,
        branch: {
            id: string,
            name: string,
            merge?: object,
        }
    },
    project: Project,
    tabs: number[],
    file: {
        line?: number,
        col?: number,
        error?: string,
    },
    title: string,
    url: Url & {
        autocomplete: string,
    },
    sentry: Sentry,
    metrics: Metrics,
    oneTrustDomainKey: string,
    schema: ModelSchema
};

export type LaunchConfig = {
    self: {
        id: string;
        username: string;
        branch: {
            id: string,
        },
        locale: string;
    },
    project: Pick<Project, 'id' | 'name' | 'settings'> & {
        repositoryUrl: string,
        scriptPrefix: string,
        hasReadAccess: boolean
    }
    scene: Scene,
    scenes: {
        name: string,
        url: string
    }[],
    url: Omit<Url, 'launch' | 'relay' | 'useCustomEngine'> & {
        engineExtras: string,
        physics: string,
        webvr: string,
        scriptsBeforeEngine: { url: string }[],
        scriptsAfterEngine: { url: string }[]
    },
    importMap: string,
    sentry: Sentry,
    metrics: Metrics,
    oneTrustDomainKey: string,
    schema: ModelSchema,
    engineVersions: EngineVersions,
    wasmModules?: WasmModule[]
};
