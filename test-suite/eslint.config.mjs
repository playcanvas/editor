import playcanvasConfig from '@playcanvas/eslint-config';
import typescriptParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
    ...playcanvasConfig,
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                requireConfigFile: false
            },
            globals: {
                ...globals.browser,
                ...globals.mocha,
                ...globals.node,
                config: false,
                editor: false
            }
        },
        rules: {
            'jsdoc/require-jsdoc': 'off',
            'jsdoc/require-param': 'off',
            'jsdoc/require-param-type': 'off',
            'jsdoc/require-returns': 'off',
            'jsdoc/require-returns-type': 'off',
            'no-use-before-define': 'off',
            'no-await-in-loop': 'off',
            'no-loop-func': 'off'
        }
    },
    {
        files: ['**/*.mjs'],
        languageOptions: {
            globals: {
                ...globals.node
            }
        },
        rules: {
            'import/no-unresolved': 'off'
        }
    },
    {
        settings: {
            'import/resolver': {
                node: {
                    extensions: ['.js', '.ts', '.mjs']
                }
            }
        }
    }
];
