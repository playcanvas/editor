import typescriptConfig from '@playcanvas/eslint-config/typescript';

export default [
    ...typescriptConfig,
    {
        ignores: ['test/fixtures/files/ammo/**']
    }
];
