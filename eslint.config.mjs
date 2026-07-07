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
    }
};

const workersConfig = {
    files: ['src/workers/*.ts'],
    languageOptions: {
        globals: {
            ...globals.worker,
            pc: 'readonly'
        }
    }
};

const serviceWorkersConfig = {
    files: ['src/sw/*.ts'],
    languageOptions: {
        globals: {
            ...globals.serviceworker
        }
    }
};

const modulesConfig = {
    files: ['modules/**/*.ts'],
    languageOptions: {
        globals: {
            ...globals.browser
        }
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
        'no-unused-expressions': 'off',
        '@typescript-eslint/no-unused-expressions': 'off'
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
        // deferred during @playcanvas/eslint-config v3 migration — fix incrementally
        rules: {
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': 'warn'
        }
    },
    {
        ignores: [
            '**/node_modules/**',
            '**/dist/**',
            '.claude/**',
            'src/realtime/share.uncompressed.js', // added when serving
            'src/wasm/**/*.js',
            'test/editor-api',
            'test-suite'
        ]
    }
];
