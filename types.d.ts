import type * as pcuiLib from '@playcanvas/pcui';
import type * as monacoEditor from 'monaco-editor';
import type * as playcanvas from 'playcanvas';

import type { Editor, EditorMethods } from './src/common/editor';
import type { RelayServer } from './src/editor/relay/relay-server';
import type { CodeEditorConfig, EditorBlankConfig, EditorConfig, LaunchConfig } from './src/editor-api';
import type * as pcuiConstants from './src/pcui/constants';

declare global {
    // config type (injected into HTML)
    let config: EditorBlankConfig | EditorConfig | CodeEditorConfig | LaunchConfig;

    // editor
    let editor: Editor<EditorMethods>;

    // log
    let log: {
        error: {
            (...args: any[]): void;
            (strings: TemplateStringsArray, ...values: unknown[]): void;
        };
    };

    // metrics
    let metrics: {
        increment: (data: any) => void;
    };

    // monaco
    let monaco: typeof monacoEditor;

    // pc (bundled in editor, injected in HTML for launch page)
    let pc: typeof playcanvas;

    // pcui
    let pcui: typeof pcuiLib & typeof pcuiConstants;

    // pcx (loaded in HTML)
    let pcx: typeof playcanvas;

    // pcBootstrap (injected into HTML)
    let pcBootstrap: any;

    // relay (loaded in HTML)
    let relay: RelayServer;

    // array extensions
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- must be an interface to merge with the global Array type
    interface Array {
        equals: (array: any[]) => boolean;
    }

    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- must be an interface to merge with the global Window type
    interface Window {
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
}
