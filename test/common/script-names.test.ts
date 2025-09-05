import { expect } from 'chai';
import { describe, it } from 'mocha';
import { getReservedScriptNames } from 'playcanvas';

import { normalizeScriptName } from '../../src/common/script-names.ts';

describe('normalizeScriptName', () => {
    it('should return the original when it is valid', () => {
        expect(normalizeScriptName('myScript.js')).to.be.equal('myScript.js');
        expect(normalizeScriptName('myScript.mjs')).to.be.equal('myScript.mjs');
    });

    it('should add .js extension when no .js or .mjs extension already exists', () => {
        // By default append .js
        expect(normalizeScriptName('my-script')).to.be.equal('my-script.js');
        expect(normalizeScriptName('my.script')).to.be.equal('my.script.js');

        // Keep .mjs
        expect(normalizeScriptName('my-script.mjs')).to.be.equal('my-script.mjs');

        // Keep .js
        expect(normalizeScriptName('my-script.js')).to.be.equal('my-script.js');

        // Some edge cases
        expect(normalizeScriptName('my-scriptmjs')).to.be.equal('my-scriptmjs.js');
        expect(normalizeScriptName('my-scriptjs')).to.be.equal('my-scriptjs.js');
    });

    it('should trim leading and trailing whitespace', () => {
        expect(normalizeScriptName('     padded-script.js')).to.be.equal('padded-script.js');
        expect(normalizeScriptName('padded-script.js     \n')).to.be.equal('padded-script.js');
        expect(normalizeScriptName('     padded-script.js      ')).to.be.equal('padded-script.js');
    });

    describe('should return null when using a reserved script name', () => {
        getReservedScriptNames().forEach((reservedScriptName) => {
            describe(`reserved script name ${reservedScriptName}`, () => {
                it(`${reservedScriptName}`, () => {
                    expect(normalizeScriptName(reservedScriptName)).to.be.null;
                });
                it(`${reservedScriptName} with some padding`, () => {
                    expect(normalizeScriptName(`    ${reservedScriptName}   `)).to.be.null;
                });
                it(`${reservedScriptName}.mjs`, () => {
                    expect(normalizeScriptName(`${reservedScriptName}.mjs`)).to.be.null;
                });
                it(`${reservedScriptName}.js`, () => {
                    expect(normalizeScriptName(`${reservedScriptName}.js`)).to.be.null;
                });
            });
        });
    });

    it('should return null for invalid empty ones', () => {
        expect(normalizeScriptName('')).to.be.null;
        expect(normalizeScriptName('   ')).to.be.null;
        expect(normalizeScriptName('  \n ')).to.be.null;
    });

    it('should return null for invalid chars', () => {
        expect(normalizeScriptName('script#.js')).to.be.null;
        expect(normalizeScriptName('script<.js')).to.be.null;
        expect(normalizeScriptName('script$.js')).to.be.null;
        expect(normalizeScriptName('script%.js')).to.be.null;
        expect(normalizeScriptName('script+.js')).to.be.null;
        expect(normalizeScriptName('script!.js')).to.be.null;
        expect(normalizeScriptName('script`.js')).to.be.null;
        expect(normalizeScriptName('script&.js')).to.be.null;
        expect(normalizeScriptName('script=.js')).to.be.null;
        expect(normalizeScriptName('script\'.js')).to.be.null;
        expect(normalizeScriptName('script{.js')).to.be.null;
        expect(normalizeScriptName('script}.js')).to.be.null;
        expect(normalizeScriptName('script@.js')).to.be.null;
        expect(normalizeScriptName('script\\:.js')).to.be.null;
        expect(normalizeScriptName('script/.js')).to.be.null;
        expect(normalizeScriptName('script*.js')).to.be.null;
        expect(normalizeScriptName('script?.js')).to.be.null;
        expect(normalizeScriptName('script".js')).to.be.null;
        expect(normalizeScriptName('script|.js')).to.be.null;
    });

    it('should return null for a filename that starts with a number', () => {
        const filename = '1script.js';
        expect(normalizeScriptName(filename)).to.be.null;
    });
});
