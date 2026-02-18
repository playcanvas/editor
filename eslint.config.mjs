import playcanvasConfig from '@playcanvas/eslint-config';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import globals from 'globals';

const tsTypeRules = {
    plugins: {
        '@typescript-eslint': tsPlugin
    },
    rules: {
        '@typescript-eslint/typedef': ['error', {
            parameter: true,
            arrowParameter: false
        }]
    }
};

const importConfig = {
    settings: {
        'import/parsers': {
            '@typescript-eslint/parser': ['.ts']
        },
        'import/resolver': {
            typescript: {
                alwaysTryTypes: true
            }
        }
    }
};

const coreConfig = {
    files: [
        'src/core/**/*.ts',
        'src/common/**/*.ts',
        'src/editor/**/*.ts',
        'src/code-editor/**/*.ts',
        'src/launch/**/*.ts',
        'src/plugins/**/*.ts'
    ],
    plugins: tsTypeRules.plugins,
    languageOptions: {
        parser: typescriptParser,
        globals: {
            ...globals.browser,
            config: 'readonly',
            editor: 'readonly',
            log: 'readonly',
            metrics: 'readonly',
            monaco: 'readonly',
            pc: 'readonly',
            pcx: 'readonly',
            pcBootstrap: 'readonly'
        }
    },
    rules: {
        ...tsTypeRules.rules,
        'accessor-pairs': ['error', { setWithoutGet: false, getWithoutSet: false }],
        'curly': ['error', 'all'],
        'jsdoc/require-param': ['error', { checkDestructured: false }],
        'jsdoc/require-param-type': 'off',
        'jsdoc/require-returns-type': 'off',
        'jsdoc/require-returns': 'off',
        'no-use-before-define': 'off',
        'no-var': 'off'
    }
};

const workersConfig = {
    files: ['src/workers/*.ts'],
    plugins: tsTypeRules.plugins,
    languageOptions: {
        parser: typescriptParser,
        globals: {
            ...globals.worker,
            pc: 'readonly'
        }
    },
    rules: {
        ...tsTypeRules.rules,
        'accessor-pairs': ['error', { setWithoutGet: false, getWithoutSet: false }],
        'curly': ['error', 'all'],
        'jsdoc/require-param': ['error', { checkDestructured: false }],
        'jsdoc/require-param-type': 'off',
        'jsdoc/require-returns-type': 'off',
        'jsdoc/require-returns': 'off',
        'no-use-before-define': 'off',
        'no-var': 'off'
    }
};

const serviceWorkersConfig = {
    files: ['src/sw/*.ts'],
    plugins: tsTypeRules.plugins,
    languageOptions: {
        parser: typescriptParser,
        globals: {
            ...globals.serviceworker
        }
    },
    rules: {
        ...tsTypeRules.rules,
        'accessor-pairs': ['error', { setWithoutGet: false, getWithoutSet: false }],
        'curly': ['error', 'all'],
        'jsdoc/require-param': ['error', { checkDestructured: false }],
        'jsdoc/require-param-type': 'off',
        'jsdoc/require-returns-type': 'off',
        'jsdoc/require-returns': 'off',
        'no-use-before-define': 'off',
        'no-var': 'off'
    }
};

const modulesConfig = {
    files: ['modules/**/*.ts'],
    plugins: tsTypeRules.plugins,
    languageOptions: {
        parser: typescriptParser,
        globals: {
            ...globals.browser
        }
    },
    rules: {
        ...tsTypeRules.rules,
        'accessor-pairs': ['error', { setWithoutGet: false, getWithoutSet: false }],
        'curly': ['error', 'all'],
        'jsdoc/require-jsdoc': 'off',
        'jsdoc/require-param': 'off',
        'jsdoc/require-param-type': 'off',
        'jsdoc/require-returns': 'off',
        'jsdoc/require-returns-type': 'off',
        'no-use-before-define': 'off',
        'no-var': 'off'
    }
};

const testConfig = {
    files: ['test/**/*.ts'],
    plugins: tsTypeRules.plugins,
    languageOptions: {
        parser: typescriptParser,
        globals: {
            ...globals.node
        }
    },
    rules: {
        ...tsTypeRules.rules,
        'accessor-pairs': ['error', { setWithoutGet: false, getWithoutSet: false }],
        'curly': ['error', 'all'],
        'no-unused-expressions': 'off',
        'jsdoc/require-param-type': 'off',
        'jsdoc/require-returns-type': 'off',
        'jsdoc/require-returns': 'off',
        'no-use-before-define': 'off',
        'no-var': 'off'
    }
};

const esmJsConfig = {
    files: ['**/*.mjs'],
    languageOptions: {
        globals: {
            ...globals.node
        }
    },
    rules: {
        'curly': ['error', 'all'],
        'import/no-named-as-default': 'off',
        'import/default': 'off'
    }
};

export default [
    importConfig,
    ...playcanvasConfig,
    coreConfig,
    workersConfig,
    serviceWorkersConfig,
    modulesConfig,
    testConfig,
    esmJsConfig,
    {
        ignores: [
            '**/node_modules/**',
            '**/dist/**',
            'src/realtime/share.uncompressed.js', // added when serving
            'src/wasm/**/*.js',
            'test/editor-api',
            'test-suite'
        ]
    }
];
