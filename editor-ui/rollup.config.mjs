import path from 'path';

import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import strip from '@rollup/plugin-strip';
import terser from '@rollup/plugin-terser';

import autoprefixer from 'autoprefixer';
import postcss from 'postcss';
import sass from 'rollup-plugin-sass';

const production = process.env.NODE_ENV === 'production';
const sourcemap = production ? true : 'inline';

const aliasEntries = () => {
    const entries = [];

    if (process.env.PCUI_PATH) {
        entries.push({
            find: /^@playcanvas\/pcui/,
            replacement: path.resolve(process.env.PCUI_PATH)
        });
    }

    if (process.env.PCUI_GRAPH_PATH) {
        entries.push({
            find: /^@playcanvas\/pcui-graph/,
            replacement: path.resolve(process.env.PCUI_GRAPH_PATH)
        });
    }

    if (process.env.EDITOR_API_PATH) {
        entries.push({
            find: /^@playcanvas\/editor-api/,
            replacement: path.resolve(process.env.EDITOR_API_PATH)
        });
    }

    if (process.env.OBSERVER_PATH) {
        entries.push({
            find: /^@playcanvas\/observer/,
            replacement: path.resolve(process.env.OBSERVER_PATH)
        });
    }

    return {
        entries: entries
    };
};

export default [
    {
        input: 'js/index.js',
        output: {
            file: 'dist/js/editor.js',
            format: 'umd',
            sourcemap
        },
        plugins: [
            sass({
                insert: false,
                output: 'dist/css/editor.css',
                outputStyle: 'compressed',
                processor: css => postcss([autoprefixer])
                .process(css)
                .then(result => result.css)
            }),
            alias(aliasEntries()),
            replace({
                values: {
                    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
                    '___$insertStyle': 'REPLACE_FUNCTION',
                    '.font-regular': '.font-regular-disabled'
                },
                preventAssignment: true
            }),
            strip({
                include: '**/*.(mjs|js)',
                functions: ['REPLACE_FUNCTION', 'styleInject']
            }),
            commonjs(),
            resolve(),
            production && terser()
        ]
    },
    {
        input: 'js/empty/index.js',
        output: {
            file: 'dist/js/editor-empty.js',
            format: 'umd',
            sourcemap
        },
        plugins: [
            sass({
                insert: false,
                output: 'dist/css/editor-empty.css',
                outputStyle: 'compressed',
                processor: css => postcss([autoprefixer])
                .process(css)
                .then(result => result.css)
            }),
            alias(aliasEntries()),
            replace({
                values: {
                    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
                    '___$insertStyle': 'REPLACE_FUNCTION',
                    '.font-regular': '.font-regular-disabled'
                },
                preventAssignment: true
            }),
            strip({
                include: '**/*.(mjs|js)',
                functions: ['REPLACE_FUNCTION', 'styleInject']
            }),
            commonjs(),
            resolve(),
            production && terser()
        ]
    },
    {
        input: 'js/code-editor-v2/index.js',
        output: {
            file: 'dist/js/code-editor-v2.js',
            format: 'es',
            sourcemap
        },
        plugins: [
            sass({
                insert: false,
                output: 'dist/css/code-editor-v2.css',
                outputStyle: 'compressed',
                processor: css => postcss([autoprefixer])
                .process(css)
                .then(result => result.css)
            }),
            alias(aliasEntries()),
            replace({
                values: {
                    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
                    '___$insertStyle': 'REPLACE_FUNCTION',
                    '.font-regular': '.font-regular-disabled'
                },
                preventAssignment: true
            }),
            strip({
                include: '**/*.(mjs|js)',
                functions: ['REPLACE_FUNCTION', 'styleInject']
            }),
            commonjs(),
            resolve(),
            production && terser()
        ]
    },
    {
        input: 'js/launch/index.js',
        output: {
            file: 'dist/js/launch.js',
            format: 'umd',
            sourcemap
        },
        plugins: [
            sass({
                insert: false,
                output: 'dist/css/launch.css',
                outputStyle: 'compressed',
                processor: css => postcss([autoprefixer])
                .process(css)
                .then(result => result.css)
            }),
            alias(aliasEntries()),
            replace({
                values: {
                    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
                    '___$insertStyle': 'REPLACE_FUNCTION',
                    '.font-regular': '.font-regular-disabled'
                },
                preventAssignment: true
            }),
            strip({
                include: '**/*.(mjs|js)',
                functions: ['REPLACE_FUNCTION', 'styleInject']
            }),
            commonjs(),
            resolve(),
            production && terser()
        ]
    },
    {
        input: 'sass/_error.scss',
        output: {
            dir: 'dist'
        },
        plugins: [
            sass({
                insert: false,
                output: 'dist/css/error.css',
                outputStyle: 'compressed',
                processor: css => postcss([autoprefixer])
                .process(css)
                .then(result => result.css)
            })
        ]
    },
    {
        input: 'sass/_code_editor.scss',
        output: {
            dir: 'dist'
        },
        plugins: [
            sass({
                insert: false,
                output: 'dist/css/code_editor.css',
                outputStyle: 'compressed',
                processor: css => postcss([autoprefixer])
                .process(css)
                .then(result => result.css)
            })
        ]
    }

];
