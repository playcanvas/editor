import { expect } from 'chai';
import { describe, it } from 'mocha';

import { evaluate } from '../../src/editor/scripting/expr-eval/evaluate.ts';
import { parse } from '../../src/editor/scripting/expr-eval/parser.ts';

describe('expr-eval: Evaluate Function', () => {

    it('should handle integer arithmetic', () => {
        expect(evaluate('2 + 3')).to.equal(5);
        expect(evaluate('10 - 4')).to.equal(6);
        expect(evaluate('5 * 2')).to.equal(10);
        expect(evaluate('20 / 5')).to.equal(4);
    });

    it('should handle float arithmetic', () => {
        expect(evaluate('2.0 + 3.0')).to.equal(5);
        expect(evaluate('2. + 3.')).to.equal(5);
        expect(evaluate('.1 + .1')).to.equal(0.2);
    });

    it('should handle comparison operators', () => {
        expect(evaluate('3 < 5')).to.equal(true);
        expect(evaluate('10 >= 10')).to.equal(true);
        expect(evaluate('8 === 8')).to.equal(true);
        expect(evaluate('7 !== 7')).to.equal(false);
    });

    it('should handle logical operators', () => {
        expect(evaluate('true && false')).to.equal(false);
        expect(evaluate('true || false')).to.equal(true);
        expect(evaluate('true && (false || true)')).to.equal(true);
    });

    it('should handle property access and parentheses', () => {
        const context = { data: { value: 4 }, multiplier: 3 };
        // (data.value + 2) * multiplier => (4 + 2) * 3 = 18
        expect(evaluate('(data.value + 2) * multiplier', context)).to.equal(18);
    });

    it('should handle string ', () => {
        expect(evaluate('"hello" + " world"')).to.equal('hello world');
        expect(evaluate('"abc" === "abc"')).to.equal(true);
    });

    it('it should handle context params', () => {
        const context = { a: 5, b: 3, nested: { abc: 42, abc3: 4 } };
        expect(evaluate('a + b', context)).to.equal(8);
        expect(evaluate('nested.abc + b', context)).to.equal(45);
    });

    it('should handle object notation', () => {
        const context = { b: 3, nested: { abc: 42, abc3: 4 } };
        expect(evaluate('nested["abc"]', context)).to.equal(42);
        expect(evaluate('nested["abc" + b]', context)).to.equal(4);
    });

    it('should handle array notation', () => {
        const context = { b: [2, 3, 4] };
        expect(evaluate('b[1] + b[2]', context)).to.equal(7);
        expect(evaluate('b[0] + b[2]', context)).to.equal(6);
        expect(evaluate('b[0] + b[100]', context)).to.be.NaN;
    });

    it('should handle cyclical references', () => {
        const context = { a: 1, self: null };
        context.self = context;
        expect(evaluate('a', context)).to.equal(1);
        expect(evaluate('self.a', context)).to.equal(1);
        expect(evaluate('self.self.a', context)).to.equal(1);
        expect(evaluate('self.self.self.a', context)).to.equal(1);
    });

    it('should handle null and undefined literals', () => {
        expect(evaluate('3 !== null')).to.equal(true);
        expect(evaluate('3 !== undefined')).to.equal(true);
        expect(evaluate('undefined === null')).to.equal(false);
        expect(evaluate('3 !== (null||undefined)')).to.equal(true);
    });

    // Failures

    it('should throw correct Syntax Errors', () => {
        expect(_ => evaluate('a + ')).to.throw(SyntaxError);
        expect(_ => evaluate('a asd')).to.throw(SyntaxError);
        expect(_ => evaluate('(((')).to.throw(SyntaxError);
    });

    it('should throw correct Reference Errors', () => {
        expect(() => evaluate('a')).to.throw(ReferenceError);
    });

});

describe('expr-eval: Parse Expression', () => {

    it('should parse and expression into AST', () => {
        expect(parse('2 + 3')).to.deep.equal({
            type: 'BinaryExpression',
            operator: '+',
            left: { type: 'Literal', value: 2 },
            right: { type: 'Literal', value: 3 }
        });
    });

    it('should correctly evaluate AST', () => {
        const ast = parse('2 + 3');
        expect(evaluate(ast)).to.equal(5);
    });

});
