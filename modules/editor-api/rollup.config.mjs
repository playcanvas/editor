import { execSync } from 'child_process';
import fs from 'fs';

import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import { dts } from 'rollup-plugin-dts';
import polyfills from 'rollup-plugin-polyfill-node';

import { runTsc } from './utils/plugins/rollup-run-tsc.mjs';

/**
 * @returns {string} Version string like `1.58.0-dev`
 */
const getVersion = () => {
    const text = fs.readFileSync('./package.json', 'utf8');
    const json = JSON.parse(text);
    return json.version;
};

/**
 * @returns {string} Revision string like `644d08d39` (9 digits/chars).
 */
const getRevision = () => {
    let revision;
    try {
        revision = execSync('git rev-parse --short HEAD').toString().trim();
    } catch (e) {
        revision = 'unknown';
    }
    return revision;
};

const replacements = {
    values: {
        'PACKAGE_VERSION': getVersion(),
        'PACKAGE_REVISION': getRevision()
    },
    preventAssignment: true
};

const umd = {
    external: ['@playcanvas/observer'],
    input: 'src/index.ts',
    output: {
        file: 'dist/index.js',
        format: 'umd',
        name: 'api',
        globals: {
            '@playcanvas/observer': 'observer'
        }
    },
    plugins: [
        typescript({
            sourceMap: false
        }),
        replace(replacements),
        commonjs(),
        polyfills(),
        resolve(),
        babel({
            babelHelpers: 'bundled',
            babelrc: false,
            comments: false,
            compact: false,
            minified: false,
            presets: [
                [
                    '@babel/preset-env', {
                        bugfixes: true,
                        loose: true,
                        modules: false,
                        targets: {
                            esmodules: true
                        }
                    }
                ]
            ]
        })
    ]
};

const module = {
    external: ['@playcanvas/observer'],
    input: 'src/index.ts',
    output: {
        file: 'dist/index.mjs',
        format: 'module',
        globals: {
            '@playcanvas/observer': 'observer'
        }
    },
    plugins: [
        typescript({
            sourceMap: false
        }),
        replace(replacements),
        commonjs(),
        polyfills(),
        resolve()
    ]
};

const footer = `export as namespace api;
declare global {
    const editor: typeof globals;
}`;

const types = {
    input: 'types/index.d.ts',
    output: [{
        file: 'dist/index.d.ts',
        footer: footer,
        format: 'es'
    }],
    plugins: [
        runTsc('tsconfig.build.json'),
        dts()
    ]
};

export default () => {
    return [umd, module, types];
};
