import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import swc from '@rollup/plugin-swc';
import polyfills from 'rollup-plugin-polyfill-node';

export default {
    input: 'src/editor-api/index.ts',
    output: {
        file: 'test/editor-api/dist/index.js',
        format: 'module'
    },
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
                        chrome: 63
                    }
                }
            }
        })
    ]
};
