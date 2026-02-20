import fs from 'fs';
import path from 'path';

import autoprefixer from 'autoprefixer';
import { context } from 'esbuild';
import { polyfillNode } from 'esbuild-plugin-polyfill-node';
import postcss from 'postcss';
import * as sass from 'sass-embedded';
import { defineConfig } from 'vite';

/** @import { BuildOptions } from 'esbuild' */
/** @import { Plugin } from 'vite' */

const production = process.env.NODE_ENV === 'production';

// rollup requires an input — these let us feed it an empty module so esbuild does the real work
const VIRTUAL_INPUT = 'virtual:empty';
const VIRTUAL_RESOLVED = '\0virtual:empty';
const NOOP_OUTPUT = '.noop.js';

const STATIC_ASSETS = [
    { src: 'node_modules/monaco-editor/min/vs', dest: 'dist/js/monaco-editor/min/vs' },
    { src: 'node_modules/monaco-themes/themes', dest: 'dist/json/monaco-themes' },
    { src: 'src/json/monaco-themes', dest: 'dist/json/monaco-themes' },
    { src: 'static/json', dest: 'dist/static/json' },
    { src: 'static/img', dest: 'dist/static/img' },
    { src: 'src/wasm/lodepng', dest: 'dist/wasm/lodepng' },
    { src: 'src/wasm/codecs', dest: 'dist/wasm/codecs' },
    { src: 'node_modules/@playcanvas/attribute-parser/dist/libs.d.ts', dest: 'dist/types/libs.d.ts' }
];

const STUBBED_NODE_MODULES = ['worker_threads', 'path', 'fs'];

/**
 * Formats a duration in milliseconds to a human-readable string.
 *
 * @param {number} ms - Duration in milliseconds.
 * @returns {string} Formatted time string.
 */
const ts = (ms) => {
    return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
};

/**
 * ANSI color codes.
 */
const color = {
    /**
     * @param {string} s - Text to wrap.
     * @returns {string} Bold ANSI string.
     */
    bold: s => `\x1b[1m${s}\x1b[22m`,
    /**
     * @param {string} s - Text to wrap.
     * @returns {string} Cyan ANSI string.
     */
    cyan: s => `\x1b[36m${s}\x1b[39m`,
    /**
     * @param {string} s - Text to wrap.
     * @returns {string} Green ANSI string.
     */
    green: s => `\x1b[32m${s}\x1b[39m`
};

/**
 * Copies files and directories from a list of { src, dest } entries.
 * Infers file vs directory from whether src has a file extension.
 *
 * @param {{ src: string, dest: string }[]} assets - Assets to copy.
 */
const copy = (assets) => {
    for (const { src, dest } of assets) {
        if (!fs.existsSync(src)) {
            continue;
        }
        if (path.extname(src)) {
            fs.mkdirSync(path.dirname(dest), { recursive: true });
            fs.copyFileSync(src, dest);
        } else {
            fs.mkdirSync(dest, { recursive: true });
            fs.cpSync(src, dest, { recursive: true });
        }
    }
};

const SASS_DIR = 'sass';
const SASS_OUT_DIR = 'dist/css';

/**
 * Compiles all top-level .scss files in SASS_DIR through sass-embedded + postcss/autoprefixer.
 */
const compileSass = async () => {
    const files = fs.readdirSync(SASS_DIR).filter(f => f.endsWith('.scss'));
    const processor = postcss([autoprefixer]);

    await Promise.all(files.map(async (file) => {
        const src = `${SASS_DIR}/${file}`;
        const dest = `${SASS_OUT_DIR}/${file.replace('.scss', '.css')}`;

        console.log(color.cyan(`${color.bold(src)} \u2192 ${color.bold(dest)}...`));
        const t0 = performance.now();

        const compiled = await sass.compileAsync(src, { style: 'compressed', logger: sass.Logger.silent });
        const result = await processor.process(compiled.css, { from: undefined });

        fs.mkdirSync(SASS_OUT_DIR, { recursive: true });
        fs.writeFileSync(dest, result.css);

        console.log(color.green(`created ${color.bold(dest)} in ${color.bold(ts(performance.now() - t0))}`));
    }));
};

/**
 * Stubs out the given Node built-in modules with an empty default export.
 *
 * @param {string[]} modules - Module names to stub.
 * @returns {object} An esbuild plugin.
 */
const emptyNodeModulesPlugin = modules => ({
    name: 'empty-node-modules',
    setup(build) {
        const filter = new RegExp(`^(node:)?(${modules.join('|')})$`);
        build.onResolve({ filter }, args => ({
            path: args.path,
            namespace: 'empty-node-module'
        }));
        build.onLoad({ filter: /.*/, namespace: 'empty-node-module' }, () => ({
            contents: 'export default {};',
            loader: 'js'
        }));
    }
});

/**
 * Replaces `.font-regular` with `.font-regular-disabled` in source files
 * to prevent PCUI font loading during bundling.
 *
 * @returns {object} An esbuild plugin.
 */
const replacePlugin = () => ({
    name: 'replace',
    setup(build) {
        build.onLoad({ filter: /\.[jt]sx?$/ }, async (args) => {
            // skip deps and standalone bundles that don't use pcui fonts
            if (args.path.includes('node_modules') || args.path.includes('/workers/') || args.path.includes('/plugins/') || args.path.includes('/sw/')) {
                return;
            }
            const src = await fs.promises.readFile(args.path, 'utf8');
            if (!src.includes('.font-regular')) {
                return;
            }
            return {
                contents: src.replaceAll('.font-regular', '.font-regular-disabled'),
                loader: path.extname(args.path).slice(1)
            };
        });
    }
});

/**
 * Maps bare import specifiers to global variables at bundle time.
 *
 * @param {Record<string, string>} globals - Map of module name to global variable expression.
 * @returns {object} An esbuild plugin.
 */
const globalExternalsPlugin = globals => ({
    name: 'global-externals',
    setup(build) {
        const filter = new RegExp(
            `^(${Object.keys(globals)
            .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .join('|')})$`
        );
        // redirect matched imports to a synthetic module that re-exports the global
        build.onResolve({ filter }, args => ({
            path: args.path,
            namespace: 'global-external'
        }));
        build.onLoad({ filter: /.*/, namespace: 'global-external' }, args => ({
            contents: `module.exports = ${globals[args.path]};`,
            loader: 'js'
        }));
    }
});

/**
 * esbuild plugin that logs build start/end timing for each watch rebuild.
 *
 * @param {string} input - Entry point path.
 * @param {string} output - Output file path.
 * @returns {object} An esbuild plugin.
 */
const watchLogPlugin = (input, output) => ({
    name: 'watch-log',
    setup(build) {
        let buildStart;

        build.onStart(() => {
            buildStart = performance.now();
            console.log(color.cyan(`${color.bold(input)} \u2192 ${color.bold(output)}...`));
        });
        build.onEnd((result) => {
            const time = ts(performance.now() - buildStart);
            if (result.errors.length) {
                console.log(
                    `\x1b[31m\u2718 ${color.bold(output)} rebuild failed with ${result.errors.length} error(s)\x1b[39m`
                );
            } else {
                console.log(color.green(`created ${color.bold(output)} in ${color.bold(time)}`));
            }
        });
    }
});

const stubNodeBuiltins = emptyNodeModulesPlugin(STUBBED_NODE_MODULES);

const pagePlugins = [stubNodeBuiltins, replacePlugin(), polyfillNode()];

/** @type {BuildOptions} */
const shared = {
    bundle: true,
    sourcemap: production ? true : 'linked', // 'linked' avoids inlining maps for faster dev rebuilds
    minify: production,
    target: production ? 'chrome63' : undefined,
    tsconfig: 'tsconfig.json',
    define: { 'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development') },
    logLevel: 'warning'
};

/** @type {BuildOptions[]} */
const PAGE_TARGETS = [
    {
        ...shared,
        entryPoints: ['src/editor/index.ts'],
        outfile: 'dist/js/editor.js',
        format: 'iife',
        plugins: pagePlugins
    },
    {
        ...shared,
        entryPoints: ['src/editor/blank.ts'],
        outfile: 'dist/js/editor-empty.js',
        format: 'iife',
        plugins: pagePlugins
    },
    {
        ...shared,
        entryPoints: ['src/code-editor/index.ts'],
        outfile: 'dist/js/code-editor.js',
        format: 'esm',
        plugins: pagePlugins,
        define: {
            ...shared.define,
            'import.meta.url': 'undefined'
        }
    },
    {
        ...shared,
        entryPoints: ['src/launch/index.ts'],
        outfile: 'dist/js/launch.js',
        format: 'iife',
        plugins: [...pagePlugins, globalExternalsPlugin({ playcanvas: 'window.pc' })]
    }
];

// auto-discover plugin/worker/sw entries from their directories
/** @type {BuildOptions[]} */
const PLUGIN_TARGETS = fs.readdirSync('src/plugins').map(file => ({
    ...shared,
    entryPoints: [`src/plugins/${file}`],
    outfile: `dist/js/plugins/${file.replace(/\.ts$/, '.js')}`,
    format: /** @type {const} */ ('iife'),
    plugins: [stubNodeBuiltins]
}));

/** @type {BuildOptions[]} */
const WORKER_TARGETS = fs.readdirSync('src/workers').map(file => ({
    ...shared,
    entryPoints: [`src/workers/${file}`],
    outfile: `dist/js/${file.replace(/\.ts$/, '.js')}`,
    format: /** @type {const} */ ('esm'),
    plugins: [stubNodeBuiltins]
}));

/** @type {BuildOptions[]} */
const SERVICE_WORKER_TARGETS = fs.readdirSync('src/sw').map(file => ({
    ...shared,
    entryPoints: [`src/sw/${file}`],
    outfile: `dist/js/${file.replace(/\.ts$/, '.js')}`,
    format: /** @type {const} */ ('esm'),
    plugins: [stubNodeBuiltins]
}));

/** @type {BuildOptions[]} */
const configs = [
    ...PAGE_TARGETS,
    ...PLUGIN_TARGETS,
    ...WORKER_TARGETS,
    ...SERVICE_WORKER_TARGETS,
    {
        ...shared,
        entryPoints: ['src/texture-convert/index.ts'],
        outdir: 'dist/js/texture-convert',
        format: 'esm',
        splitting: true,
        plugins: [stubNodeBuiltins]
    }
];

/**
 * Provides a virtual empty module to satisfy Rollup's input requirement
 * while esbuild handles the real bundling.
 *
 * @returns {Plugin} The virtual empty module plugin.
 */
const virtualEmptyPlugin = () => ({
    name: 'virtual-empty',
    resolveId(id) {
        if (id === VIRTUAL_INPUT) {
            return VIRTUAL_RESOLVED;
        }
    },
    load(id) {
        if (id === VIRTUAL_RESOLVED) {
            return '';
        }
    },
    // vite writes the empty chunk to disk despite write:false — clean it up
    closeBundle() {
        fs.rmSync(`dist/${NOOP_OUTPUT}`, { force: true });
    }
});

/**
 * Delegates all bundling to esbuild's context API. In production mode it
 * runs one-shot builds; in watch mode it starts esbuild's incremental
 * file watchers for fast rebuilds.
 *
 * @returns {Plugin} The esbuild bundle plugin.
 */
const esbuildBundlePlugin = () => {
    let isWatch = false;
    const contexts = [];
    /** @type {fs.FSWatcher | null} */
    let sassWatcher = null;

    return {
        name: 'esbuild-bundle',
        apply: /** @type {const} */ ('build'),

        // detect --watch from vite's resolved config
        configResolved(config) {
            isWatch = !!config.build.watch;
        },

        async buildStart() {
            // skip if already initialized (watch mode re-entry)
            if (contexts.length > 0) {
                return;
            }

            copy(STATIC_ASSETS);

            const t0 = performance.now();

            // compile sass in parallel with esbuild contexts
            const sassPromise = compileSass();

            // each watch context gets a promise that resolves when its first build completes,
            // so we can print the summary after all initial builds are done
            const firstBuildDone = [];

            const results = await Promise.all(configs.map(async (config) => {
                const input = config.entryPoints[0];
                const output = /** @type {string} */ (config.outfile || config.outdir);
                const existing = config.plugins || [];

                if (isWatch) {
                    // ctx.watch() resolves immediately — use a one-shot onEnd to track completion
                    let resolveFirst;
                    firstBuildDone.push(new Promise((r) => {
                        resolveFirst = r;
                    }));
                    const onFirstBuild = {
                        name: 'first-build-done',
                        setup(build) {
                            let fired = false;
                            build.onEnd(() => {
                                if (!fired) {
                                    fired = true;
                                    resolveFirst();
                                }
                            });
                        }
                    };
                    const cfg = { ...config, plugins: [...existing, watchLogPlugin(input, output), onFirstBuild] };
                    const ctx = await context(cfg);
                    await ctx.watch();
                    return ctx;
                }

                // production: one-shot build then dispose
                const ctx = await context(config);
                console.log(color.cyan(`${color.bold(input)} \u2192 ${color.bold(output)}...`));
                const bt = performance.now();
                await ctx.rebuild();
                await ctx.dispose();
                console.log(color.green(`created ${color.bold(output)} in ${color.bold(ts(performance.now() - bt))}`));
                return ctx;
            }));

            // wait for sass + all initial watch builds before printing summary
            if (isWatch) {
                await Promise.all([sassPromise, ...firstBuildDone]);
            } else {
                await sassPromise;
            }

            contexts.push(...results);

            if (isWatch) {
                console.log(`\nInitial build in ${ts(performance.now() - t0)} \u2014 watching for changes\u2026`);

                // watch sass/ for changes and recompile on save
                let debounce = null;
                sassWatcher = fs.watch(SASS_DIR, { recursive: true }, (_event, filename) => {
                    if (!filename?.endsWith('.scss')) {
                        return;
                    }
                    clearTimeout(debounce);
                    debounce = setTimeout(() => compileSass(), 100);
                });
            } else {
                console.log(`\nBuild completed in ${ts(performance.now() - t0)}`);
            }
        },

        closeWatcher() {
            sassWatcher?.close();
            sassWatcher = null;
            for (const ctx of contexts) {
                ctx.dispose?.();
            }
            contexts.length = 0;
        }
    };
};

// vite orchestrates the build lifecycle; rollup is fed a no-op input
// while esbuildBundlePlugin does the actual bundling via esbuild contexts
export default defineConfig({
    build: {
        outDir: 'dist',
        emptyOutDir: false,
        write: false, // prevent rollup from writing output — esbuild handles it
        rollupOptions: {
            input: VIRTUAL_INPUT,
            output: {
                entryFileNames: NOOP_OUTPUT
            },
            onwarn(warning, defaultHandler) {
                if (warning.code === 'EMPTY_BUNDLE') {
                    return;
                }
                defaultHandler(warning);
            }
        }
    },
    plugins: [virtualEmptyPlugin(), esbuildBundlePlugin()]
});
