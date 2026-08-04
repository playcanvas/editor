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

// @playcanvas/font-tools ships as JSDoc-typed JS with no .d.ts — declare the subset we use
declare module '@playcanvas/font-tools' {
    /** default glyph cell size in px, as passed to msdfgen */
    export const GLYPH_SIZE: number;
    /** default msdf pixel range, as passed to msdfgen */
    export const PXRANGE: number;
    export type FontGlyphSource = {
        generateGlyph(codepoint: number, opts: { size: number; pxrange: number }): any;
        dispose?: () => void;
    };
    export type FontImageBackend = {
        composite(page: { width: number; height: number; glyphs: any[] }): Promise<Uint8Array>;
    };
    export function generateFont(opts: {
        chars?: string | number[];
        fontName?: string;
        intensity?: number;
        invert?: boolean;
        glyphSource: FontGlyphSource;
        imageBackend: FontImageBackend;
        kerningSource?: unknown;
        size?: number;
        pxrange?: number;
    }): Promise<{ data: any; textures: Uint8Array[] }>;
}

declare module '@playcanvas/font-tools/image-backend-canvas' {
    import type { FontImageBackend } from '@playcanvas/font-tools';

    export function createCanvasImageBackend(): FontImageBackend;
}

declare module '@playcanvas/font-tools/glyph-source-msdfgen' {
    import type { FontGlyphSource } from '@playcanvas/font-tools';

    export function createMsdfgenGlyphSource(
        fontBytes: Uint8Array | ArrayBuffer,
        opts?: { moduleOverrides?: { locateFile?: (path: string) => string } }
    ): Promise<FontGlyphSource>;
}
