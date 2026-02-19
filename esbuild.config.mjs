import fs from 'fs';
import path from 'path';

import { context } from 'esbuild';
import { polyfillNode } from 'esbuild-plugin-polyfill-node';

const watch = process.argv.includes('--watch');
const production = process.env.NODE_ENV === 'production';

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

const replacePlugin = () => ({
    name: 'replace',
    setup(build) {
        build.onLoad({ filter: /\.[jt]sx?$/ }, async (args) => {
            if (args.path.includes('node_modules')) {
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

const globalExternalsPlugin = globals => ({
    name: 'global-externals',
    setup(build) {
        const filter = new RegExp(
            `^(${Object.keys(globals)
            .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .join('|')})$`
        );
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

const shared = {
    bundle: true,
    sourcemap: production ? true : 'inline',
    minify: production,
    target: production ? 'chrome63' : undefined,
    tsconfig: 'tsconfig.json',
    define: { 'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development') },
    logLevel: 'warning'
};

function formatTime(ms) {
    return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
}

const bold = s => `\x1b[1m${s}\x1b[22m`;
const cyan = s => `\x1b[36m${s}\x1b[39m`;
const green = s => `\x1b[32m${s}\x1b[39m`;

const watchLogPlugin = (input, output) => ({
    name: 'watch-log',
    setup(build) {
        let buildStart;
        let buildCount = 0;

        build.onStart(() => {
            buildStart = performance.now();
            buildCount++;
            if (buildCount > 2) {
                console.log(cyan(`${bold(input)} \u2192 ${bold(output)}...`));
            }
        });
        build.onEnd((result) => {
            if (buildCount <= 2) {
                return;
            }
            const time = formatTime(performance.now() - buildStart);
            if (result.errors.length) {
                console.log(
                    `\x1b[31m\u2718 ${bold(output)} rebuild failed with ${result.errors.length} error(s)\x1b[39m`
                );
            } else {
                console.log(green(`created ${bold(output)} in ${bold(time)}`));
            }
        });
    }
});

const stubNodeBuiltins = emptyNodeModulesPlugin(['worker_threads', 'path', 'fs']);

const pagePlugins = [stubNodeBuiltins, replacePlugin(), polyfillNode()];

const workers = fs.readdirSync('src/workers').map(file => ({
    ...shared,
    entryPoints: [`src/workers/${file}`],
    outfile: `dist/js/${file.replace(/\.ts$/, '.js')}`,
    format: 'esm',
    plugins: [stubNodeBuiltins]
}));

const plugins = fs.readdirSync('src/plugins').map(file => ({
    ...shared,
    entryPoints: [`src/plugins/${file}`],
    outfile: `dist/js/plugins/${file.replace(/\.ts$/, '.js')}`,
    format: 'iife',
    plugins: [stubNodeBuiltins]
}));

const serviceWorkers = fs.readdirSync('src/sw').map(file => ({
    ...shared,
    entryPoints: [`src/sw/${file}`],
    outfile: `dist/js/${file.replace(/\.ts$/, '.js')}`,
    format: 'esm',
    plugins: [stubNodeBuiltins]
}));

const configs = [
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
    },
    ...plugins,
    ...workers,
    ...serviceWorkers,
    {
        ...shared,
        entryPoints: ['src/texture-convert/index.ts'],
        outdir: 'dist/js/texture-convert',
        format: 'esm',
        splitting: true,
        plugins: [stubNodeBuiltins]
    }
];

function copyDir(src, dest) {
    if (!fs.existsSync(src)) {
        return;
    }
    fs.mkdirSync(dest, { recursive: true });
    fs.cpSync(src, dest, { recursive: true });
}

function copyFile(src, dest) {
    if (!fs.existsSync(src)) {
        return;
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
}

function copyStaticAssets() {
    const t0 = performance.now();
    copyDir('node_modules/monaco-editor/min/vs', 'dist/js/monaco-editor/min/vs');
    copyDir('node_modules/monaco-themes/themes', 'dist/json/monaco-themes');
    copyDir('src/json/monaco-themes', 'dist/json/monaco-themes');
    copyDir('static/json', 'dist/static/json');
    copyDir('static/img', 'dist/static/img');
    copyDir('src/wasm/lodepng', 'dist/wasm/lodepng');
    copyDir('src/wasm/codecs', 'dist/wasm/codecs');
    copyFile('node_modules/@playcanvas/attribute-parser/dist/libs.d.ts', 'dist/types/libs.d.ts');
    console.log(`Copied static assets in ${(performance.now() - t0).toFixed(0)}ms`);
}

async function buildTarget(config) {
    const input = config.entryPoints[0];
    const output = config.outfile || config.outdir;
    const existing = config.plugins || [];
    const cfg = watch ? { ...config, plugins: [...existing, watchLogPlugin(input, output)] } : config;

    console.log(cyan(`${bold(input)} \u2192 ${bold(output)}...`));
    const t0 = performance.now();
    const ctx = await context(cfg);
    if (watch) {
        await ctx.watch();
    } else {
        await ctx.rebuild();
        await ctx.dispose();
    }
    console.log(green(`created ${bold(output)} in ${bold(formatTime(performance.now() - t0))}`));
    return ctx;
}

async function main() {
    copyStaticAssets();

    const t0 = performance.now();
    await Promise.all(configs.map(c => buildTarget(c)));

    if (watch) {
        console.log(`\nInitial build in ${formatTime(performance.now() - t0)} \u2014 watching for changes\u2026`);
    } else {
        console.log(`\nBuild completed in ${formatTime(performance.now() - t0)}`);
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
