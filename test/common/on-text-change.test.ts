import type { TextInput } from '@playcanvas/pcui';
import { expect } from 'chai';
import { describe, it } from 'mocha';

import { onTextChange } from '../../src/common/pcui/compat-utils';

// a stand-in that emits change like a keyChange TextInput: on each keyup, then again on blur
const fakeInput = (value = '') => {
    const handlers: ((value: string) => void)[] = [];
    const input = {
        value,
        on: (_name: string, fn: (value: string) => void) => handlers.push(fn),
        emit: (next: string) => {
            input.value = next;
            handlers.forEach((fn) => fn(next));
        }
    };
    return input;
};

describe('onTextChange', () => {
    it('ignores the repeat change a blur emits for a value already seen', () => {
        const input = fakeInput();
        const seen: string[] = [];
        onTextChange(input as unknown as TextInput, (value) => seen.push(value));

        input.emit('S');
        input.emit('Sp');
        input.emit('Sp');

        expect(seen).to.deep.equal(['S', 'Sp']);
    });

    it('ignores a change to the value the input started with', () => {
        const input = fakeInput('orbit');
        const seen: string[] = [];
        onTextChange(input as unknown as TextInput, (value) => seen.push(value));

        input.emit('orbit');
        input.emit('');

        expect(seen).to.deep.equal(['']);
    });
});
