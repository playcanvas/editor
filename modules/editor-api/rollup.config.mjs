import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import swc from '@rollup/plugin-swc';
import { dts } from 'rollup-plugin-dts';
import polyfills from 'rollup-plugin-polyfill-node';

import { runTsc } from './utils/plugins/rollup-run-tsc.mjs';

const TEST = process.env.BUILD === 'test';
console.log('Build:', TEST ? 'TEST' : 'PRODUCTION');

const module = {
    input: 'src/index.ts',
    output: {
        file: 'dist/index.js',
        format: 'module',
        globals: TEST ? undefined : {
            '@playcanvas/observer': 'observer'
        }
    },
    external: TEST ? undefined : ['@playcanvas/observer'],
    plugins: [
        commonjs(),
        polyfills(),
        resolve({
            extensions: ['.ts', '.js', '.json']
        }),
        swc({
            swc: {
                jsc: {
                    externalHelpers: false
                },
                env: {
                    loose: true,
                    bugfixes: true,
                    targets: {
                        chrome: 63 // supports esmodules
                    }
                }
            }
        })
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
    return [module, types];
};
