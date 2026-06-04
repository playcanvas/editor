import typescriptConfig from '@playcanvas/eslint-config/typescript';
import globals from 'globals';

const coreConfig = {
    files: [
        'src/core/**/*.ts',
        'src/common/**/*.ts',
        'src/editor/**/*.ts',
        'src/code-editor/**/*.ts',
        'src/launch/**/*.ts',
        'src/plugins/**/*.ts'
    ],
    languageOptions: {
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
        '@typescript-eslint/typedef': ['error', {
            parameter: true,
            arrowParameter: false
        }],
        'accessor-pairs': ['error', { setWithoutGet: false, getWithoutSet: false }],
        'curly': ['error', 'all'],
        'no-use-before-define': 'off',
        'no-var': 'off'
    }
};

const workersConfig = {
    files: ['src/workers/*.ts'],
    languageOptions: {
        globals: {
            ...globals.worker,
            pc: 'readonly'
        }
    },
    rules: {
        '@typescript-eslint/typedef': ['error', {
            parameter: true,
            arrowParameter: false
        }],
        'accessor-pairs': ['error', { setWithoutGet: false, getWithoutSet: false }],
        'curly': ['error', 'all'],
        'no-use-before-define': 'off',
        'no-var': 'off'
    }
};

const serviceWorkersConfig = {
    files: ['src/sw/*.ts'],
    languageOptions: {
        globals: {
            ...globals.serviceworker
        }
    },
    rules: {
        '@typescript-eslint/typedef': ['error', {
            parameter: true,
            arrowParameter: false
        }],
        'accessor-pairs': ['error', { setWithoutGet: false, getWithoutSet: false }],
        'curly': ['error', 'all'],
        'no-use-before-define': 'off',
        'no-var': 'off'
    }
};

const modulesConfig = {
    files: ['modules/**/*.ts'],
    languageOptions: {
        globals: {
            ...globals.browser
        }
    },
    rules: {
        '@typescript-eslint/typedef': ['error', {
            parameter: true,
            arrowParameter: false
        }],
        'accessor-pairs': ['error', { setWithoutGet: false, getWithoutSet: false }],
        'curly': ['error', 'all'],
        'no-use-before-define': 'off',
        'no-var': 'off'
    }
};

const testConfig = {
    files: ['test/**/*.ts'],
    languageOptions: {
        globals: {
            ...globals.node
        }
    },
    rules: {
        '@typescript-eslint/typedef': ['error', {
            parameter: true,
            arrowParameter: false
        }],
        'accessor-pairs': ['error', { setWithoutGet: false, getWithoutSet: false }],
        'curly': ['error', 'all'],
        'no-unused-expressions': 'off',
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
        'import-x/no-named-as-default': 'off',
        'import-x/default': 'off'
    }
};

export default [
    ...typescriptConfig,
    coreConfig,
    workersConfig,
    serviceWorkersConfig,
    modulesConfig,
    testConfig,
    esmJsConfig,
    {
        files: [
            'src/core/**/*.ts',
            'src/common/**/*.ts',
            'src/editor/**/*.ts',
            'src/code-editor/**/*.ts',
            'src/launch/**/*.ts',
            'src/plugins/**/*.ts'
        ],
        rules: {
            'no-unused-expressions': ['error', { allowTaggedTemplates: true }]
        }
    },
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
