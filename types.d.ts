// config type (injected into HTML)
declare var config: import('@playcanvas/editor-api').EditorBlankConfig & 
    import('@playcanvas/editor-api').EditorConfig & 
    import('@playcanvas/editor-api').CodeEditorConfig &
    import('@playcanvas/editor-api').LaunchConfig;

// editor
declare var editor: import('./src/common/editor').Editor<import('./src/common/editor').EditorMethods>;

// log
declare var log: {
    error: (...args: any) => void;
};

// metrics
declare var metrics: {
    increment: (data: any) => void;
};

// monaco
declare var monaco: typeof import('monaco-editor');

// pc (loaded in HTML)
declare var pc: typeof import('playcanvas');

// pcui
declare var pcui: typeof import('@playcanvas/pcui') &
    typeof import('./src/pcui/constants');

// pcx (loaded in HTML)
declare var pcx: typeof import('playcanvas');

// pcBootstrap (injected into HTML)
declare var pcBootstrap: any;

// relay (loaded in HTML)
declare var relay: import('./src/editor/relay/relay-server').RelayServer;

// array extensions
declare interface Array {
    equals: (array: any[]) => boolean;
}

declare interface Window {
    // diff (injected into HTML)
    diff: {
        default: (t: any, e: any, n: any) => any;
    };

    // global variables
    config: typeof config;
    editor: typeof editor;
    log: typeof log;
    metrics: typeof metrics;
    monaco: typeof monaco;
    pc: typeof pc;
    pcui: typeof pcui;
    pcx: typeof pcx;
    pcBootstrap: typeof pcBootstrap;
    relay: typeof relay;
}