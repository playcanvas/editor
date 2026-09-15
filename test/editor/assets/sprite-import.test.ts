import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

import { expect } from 'chai';
import { describe, it } from 'mocha';
import { spy, stub } from 'sinon';
import { ModuleKind, transpileModule } from 'typescript';

const SOURCE = transpileModule(
    readFileSync('src/editor/pickers/sprite-editor/sprite-editor-import-frames-panel.ts', 'utf8'),
    { compilerOptions: { module: ModuleKind.CommonJS } }
).outputText;
const VALID = { meta: { size: { w: 32, h: 32 } }, frames: { idle: { frame: { x: 0, y: 0, w: 16, h: 16 } } } };

const setup = () => {
    const elements = [];
    const error = spy();
    const set = stub();
    const handlers = {};
    const input = { files: [], style: {}, value: '', addEventListener: (name, fn) => (handlers[name] = fn) };
    const asset = {
        get: () => 32,
        getRaw: () => ({ _data: { 0: { _data: { name: 'idle' } } } }),
        set
    };
    class Element {
        header = { append: spy() };

        innerElement = { append: spy() };

        constructor(args) {
            Object.assign(this, args);
            elements.push(this);
        }

        append = spy();

        on() {
            return { unbind: spy() };
        }

        once = spy();
    }
    runInNewContext(SOURCE, {
        exports: {},
        require: (name: string) =>
            name === '@/common/sentry'
                ? { createLog: () => ({ error }) }
                : { Button: Element, Container: Element, Label: Element, Panel: Element },
        document: { createElement: () => input },
        editor: {
            once: (name, fn) => fn(),
            method: (name, fn) => fn({ atlasAsset: asset }),
            call: (name: string) => (name === 'permissions:write' ? true : new Element({})),
            on: () => ({ unbind: spy() })
        },
        FileReader: class {
            result: string;

            onload: () => void;

            readAsText(text: string) {
                this.result = text;
                this.onload();
            }
        },
        Error
    });
    const button = elements.find((element) => element.text === 'UPLOAD TEXTURE PACKER JSON');
    const panel = elements.find((element) => element.class === 'import-error');
    const label = elements.find((element) => element.text?.startsWith('Please upload'));
    const upload = (text: string) => {
        input.files = [text];
        handlers['change']();
    };
    return { upload, button, panel, label, error, set };
};

describe('Sprite import validation reporting', () => {
    for (const [text, message] of [
        ['invalid', 'File is not valid JSON'],
        ['null', 'missing required meta.size or frames data'],
        [JSON.stringify({ ...VALID, frames: {} }), 'No frames found'],
        [JSON.stringify({ ...VALID, frames: { idle: {} } }), 'missing required frame coordinates']
    ]) {
        it(`shows ${message} without reporting an exception or replacing frames`, () => {
            const { upload, button, panel, label, error, set } = setup();
            upload(text);
            expect(panel.hidden).to.equal(false);
            expect(label.text).to.include(message);
            expect(button.enabled).to.equal(true);
            expect(button.text).to.equal('UPLOAD TEXTURE PACKER JSON');
            expect(set.called).to.equal(false);
            expect(error.called).to.equal(false);
        });
    }

    it('allows a valid retry after rejected input', () => {
        const { upload, button, error, set } = setup();
        upload('null');
        upload(JSON.stringify(VALID));
        expect(set.calledOnce).to.equal(true);
        expect(set.firstCall.args).to.deep.equal([
            'data.frames',
            { 0: { name: 'idle', border: [0, 0, 0, 0], rect: [0, 16, 16, 16], pivot: [0.5, 0.5] } }
        ]);
        expect(button.enabled).to.equal(true);
        expect(error.called).to.equal(false);
    });

    it('still reports unexpected import failures and restores the button', () => {
        const { upload, button, panel, label, error, set } = setup();
        const failure = new Error('Unexpected asset failure');
        set.throws(failure);
        upload(JSON.stringify(VALID));
        expect(error.calledOnceWithExactly(failure)).to.equal(true);
        expect(label.text).to.equal(failure.message);
        expect(panel.hidden).to.equal(false);
        expect(button.enabled).to.equal(true);
    });
});
