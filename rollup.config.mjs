import fs from 'fs';

import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import swc from '@rollup/plugin-swc';
import copy from 'rollup-plugin-copy';
import { dts } from 'rollup-plugin-dts';
import polyfills from 'rollup-plugin-polyfill-node';
import tsconfigPaths from 'rollup-plugin-tsconfig-paths';

import { runTsc } from './utils/plugins/rollup-run-tsc.mjs';

const production = process.env.NODE_ENV === 'production';
const sourcemap = production ? true : 'inline';

const plugins = () => {
    return [
        replace({
            values: {
                'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
                '.font-regular': '.font-regular-disabled'
            },
            preventAssignment: true
        }),
        commonjs(),
        json(),
        polyfills(),
        tsconfigPaths(),
        resolve({
            extensions: ['.ts', '.js', '.json'],
            browser: true
        }),
        swc({
            swc: {
                jsc: {
                    minify: production ? { mangle: true } : null,
                    externalHelpers: false
                },
                env: {
                    loose: true,
                    bugfixes: true,
                    targets: {
                        chrome: 63 // supports esmodules
                    }
                },
                minify: production
            }
        })
    ];
};

const footer = `export as namespace api;
declare global {
    const editor: typeof globals;
}`;

const API_TARGETS = [
    {
        input: 'modules/editor-api/src/index.ts',
        output: {
            file: 'modules/editor-api/dist/index.js',
            format: 'esm',
            globals: {
                '@playcanvas/observer': 'observer'
            }
        },
        external: ['@playcanvas/observer'],
        plugins: [
            commonjs(),
            polyfills(),
            resolve({
                extensions: ['.ts', '.js', '.json'],
                browser: true
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
    },
    {
        input: 'modules/editor-api/types/index.d.ts',
        output: [{
            file: 'modules/editor-api/dist/index.d.ts',
            footer: footer,
            format: 'es'
        }],
        plugins: [
            runTsc('modules/editor-api/tsconfig.build.json'),
            dts()
        ]
    }
];

const PAGE_TARGETS = [
    {
        input: 'src/editor/index.ts',
        output: {
            file: 'dist/js/editor.js',
            format: 'umd',
            sourcemap
        },
        plugins: plugins()
    },
    {
        input: 'src/editor/blank.ts',
        output: {
            file: 'dist/js/editor-empty.js',
            format: 'umd',
            sourcemap
        },
        plugins: plugins()
    },
    {
        input: 'src/code-editor/index.ts',
        output: {
            file: 'dist/js/code-editor.js',
            format: 'es',
            sourcemap
        },
        plugins: plugins().concat([
            copy({
                targets: [
                    { src: 'node_modules/monaco-editor/min/vs/*', dest: 'dist/js/monaco-editor/min/vs' },
                    { src: 'node_modules/monaco-themes/themes/*', dest: 'dist/json/monaco-themes' },
                    { src: 'src/json/monaco-themes/*', dest: 'dist/json/monaco-themes' }
                ]
            })
        ])
    },
    {
        input: 'src/launch/index.ts',
        output: {
            file: 'dist/js/launch.js',
            format: 'umd',
            sourcemap
        },
        plugins: plugins()
    }
];

const PLUGIN_TARGETS = fs.readdirSync('src/plugins').map((file) => {
    return {
        input: `src/plugins/${file}`,
        output: {
            file: `dist/js/plugins/${file.replace(/\.ts$/, '.js')}`,
            format: 'umd'
        },
        plugins: [
            swc({
                swc: {
                    minify: production
                }
            })
        ]
    };
});

const WORKER_TARGETS = fs.readdirSync('src/workers').map((file) => {
    switch (true) {
        case /console/.test(file): {
            return {
                input: `src/workers/${file}`,
                output: {
                    file: `dist/js/${file.replace(/\.ts$/, '.js')}`,
                    format: 'esm'
                },
                plugins: [
                    tsconfigPaths(),
                    resolve({
                        extensions: ['.ts', '.js', '.json'],
                        browser: true
                    }),
                    commonjs(),
                    swc({
                        swc: {
                            minify: production
                        }
                    })
                ]
            };
        }
        case /png-export/.test(file): {
            return {
                input: `src/workers/${file}`,
                output: {
                    file: `dist/js/${file.replace(/\.ts$/, '.js')}`,
                    format: 'esm'
                },
                plugins: [
                    tsconfigPaths(),
                    resolve({
                        extensions: ['.ts', '.js', '.json'],
                        browser: true
                    }),
                    copy({
                        targets: [
                            { src: 'src/wasm/lodepng', dest: 'dist/wasm' }
                        ]
                    }),
                    swc({
                        swc: {
                            minify: production
                        }
                    })
                ]
            };
        }
        case /esm-script/.test(file): {
            return {
                input: `src/workers/${file}`,
                output: {
                    file: `dist/js/${file.replace(/\.ts$/, '.js')}`,
                    format: 'esm'
                },
                plugins: [
                    tsconfigPaths(),
                    resolve({
                        extensions: ['.ts', '.js', '.json'],
                        browser: true
                    }),
                    copy({
                        targets: [
                            { src: 'node_modules/@playcanvas/attribute-parser/dist/libs.d.ts', dest: 'dist/types' }
                        ]
                    }),
                    swc({
                        swc: {
                            minify: production
                        }
                    })
                ]
            };
        }
        default: {
            return {
                input: `src/workers/${file}`,
                output: {
                    file: `dist/js/${file.replace(/\.ts$/, '.js')}`,
                    format: 'esm'
                },
                plugins: [
                    tsconfigPaths(),
                    resolve({
                        extensions: ['.ts', '.js', '.json'],
                        browser: true
                    }),
                    swc({
                        swc: {
                            minify: production
                        }
                    })
                ]
            };
        }
    }
});

const MODULE_TARGETS = [
    {
        input: 'modules/pcui-diff.ts',
        output: {
            file: 'dist/js/pcui-diff.js',
            format: 'esm'
        },
        plugins: [
            swc({
                swc: {
                    minify: production
                }
            })
        ]
    },
    {
        input: 'modules/texture-convert/src/index.ts',
        output: {
            dir: 'dist/js/texture-convert',
            format: 'esm'
        },
        plugins: [
            commonjs(),
            tsconfigPaths(),
            resolve({
                extensions: ['.ts', '.js', '.json'],
                browser: true
            }),
            copy({
                targets: [{ src: 'src/wasm/codecs', dest: 'dist/wasm' }]
            }),
            swc({
                swc: {
                    minify: production
                }
            })
        ]
    }
];

const SERVICE_WORKER_TARGETS = fs.readdirSync('src/sw').map((file) => {
    return {
        input: `src/sw/${file}`,
        output: {
            file: `dist/js/${file.replace(/\.ts$/, '.js')}`,
            format: 'esm'
        },
        plugins: [
            tsconfigPaths(),
            resolve({
                extensions: ['.ts', '.js', '.json'],
                browser: true
            }),
            swc({
                swc: {
                    minify: production
                }
            })
        ]
    };
});

export default [
    ...API_TARGETS,
    ...PAGE_TARGETS,
    ...PLUGIN_TARGETS,
    ...WORKER_TARGETS,
    ...MODULE_TARGETS,
    ...SERVICE_WORKER_TARGETS
];
