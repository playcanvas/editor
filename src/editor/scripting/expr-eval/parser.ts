/**
 * @typedef {Object} ASTNode
 * @property {'BinaryExpression'|'UnaryExpression'|'MemberExpression'|'Identifier'|'Literal'} type - The type or kind of this AST node
 * @property {string} [name] - The associated token
 * @property {string} [operator] - The type of operator for this AST node
 * @property {string|number|boolean|null} [value] - The value of the node, if applicable
 * @property {ASTNode} [object] - Reference to the object node, in nested props
 * @property {boolean} [computed] - Whether the node is computed ie `obj["a" + "b"]`
 * @property {ASTNode} [property] - The AST Node of a nodes property ie `obj.prop`
 * @property {ASTNode} [left] - The left node in a binary expression, ie `a` in `a + b`
 * @property {ASTNode} [right] - The right node in a binary expression, ie `b` in `a + b`
 */

/**
 * Tokenizes a string based on the grammar rules below
 * @param {string} str - The expression to tokenize
 * @returns {string[]} An array of tokens
 */
const tokenize = (str) => {
    // This regex captures:
    // - numbers (int or float)
    // - parentheses, punctuation ( ( ) [ ] . )
    // - logical/comparison/operators (&&, ||, ==, ===, !=, !==, <=, >=, <, >, +, -, *, /, !)
    // - identifiers (including underscores and $)
    // - strings in quotes (single or double)
    const tokenPattern = /\s*(\d+\.\d*|\.\d+|\d+|[A-Z_$][\w$]*|\.|&&|\|\||===|!==|==|!=|<=|>=|[<>+\-*/!()[\]]|"[^"]*"|'[^']*')\s*/gi;

    const result = [];
    let match;
    while ((match = tokenPattern.exec(str)) !== null) {
        result.push(match[1]);
    }
    return result;
};


// Utils
const NUM_REGEXP = /^(?:\d*\.\d+|\d+\.\d*|\d+)$/;
const IDENTIFIER_REGEXP = /^[A-Z_$][\w$]*$/i;

/**
 * @param {string} token - Checks if the token is a number
 * @returns {boolean} true if the token is a number, otherwise false
 */
const isNumber = token => NUM_REGEXP.test(token);

/**
 * @param {string} token - Checks if the token is a string
 * @returns {boolean} true if the token is a string, false otherwise
 */
const isString = token => (
    (token.startsWith('"') && token.endsWith('"')) ||
    (token.startsWith('\'') && token.endsWith('\''))
);

/**
 * Assumes string has quotation marks, and removes them
 * @param {string} token - The string to parse
 * @returns {string} returns the string without quotes
 */
const parseString = token => token.slice(1, -1);

/**
 * Checks if the token is a identifier, such as a variable
 * @param {string} token - The token to check
 * @returns {boolean} returns true if the token is a identifier, false otherwise
 */
const isIdentifier = token => IDENTIFIER_REGEXP.test(token);

/**
 * Parses an array of tokens into an AST.
 * Uses a the following set of grammar rules.
 *
 * Grammar outline with "member expressions":
 * expression -> or
 * or         -> and ("||" and)*
 * and        -> equality ("&&" equality)*
 * equality   -> comparison (("==","===","!=","!==") comparison)*
 * comparison -> term (("<", "<=", ">", ">=") term)*
 * term       -> factor (("+"|"-") factor)*
 * factor     -> unary (("*"|"/") unary)*
 * unary      -> ("!" | "+" | "-") unary | member
 * member     -> primary ("." identifier | "[" expression "]")*
 * primary    -> NUMBER | STRING | true | false | identifier | "(" expression ")"
 *
 * @param {string[]} tokens - The array of tokens to parse
 * @returns {ASTNode} - The parsed AST
 */
const parseTokens = (tokens) => {

    let position = 0;

    // Helper functions for navigating the tokens
    const advance = () => tokens[position++];
    const previous = () => tokens[position - 1];
    const peek = () => tokens[position];
    const isAtEnd = () => position >= tokens.length;

    const match = (...expected) => {
        if (!isAtEnd() && expected.includes(peek())) {
            position++;
            return true;
        }
        return false;
    };

    // Parsing functions

    const parseExpression = () => parseOr();

    function parseOr() {
        let node = parseAnd();
        while (match('||')) {
            const operator = previous();
            const right = parseAnd();
            node = { type: 'BinaryExpression', operator, left: node, right };
        }
        return node;
    }

    function parseAnd() {
        let node = parseEquality();
        while (match('&&')) {
            const operator = previous();
            const right = parseEquality();
            node = { type: 'BinaryExpression', operator, left: node, right };
        }
        return node;
    }

    function parseEquality() {
        let node = parseComparison();
        while (match('==', '!=', '===', '!==')) {
            const operator = previous();
            const right = parseComparison();
            node = { type: 'BinaryExpression', operator, left: node, right };
        }
        return node;
    }

    function parseComparison() {
        let node = parseTerm();
        while (match('<', '<=', '>', '>=')) {
            const operator = previous();
            const right = parseTerm();
            node = { type: 'BinaryExpression', operator, left: node, right };
        }
        return node;
    }

    function parseTerm() {
        let node = parseFactor();
        while (match('+', '-')) {
            const operator = previous();
            const right = parseFactor();
            node = { type: 'BinaryExpression', operator, left: node, right };
        }
        return node;
    }

    function parseFactor() {
        let node = parseUnary();
        while (match('*', '/')) {
            const operator = previous();
            const right = parseUnary();
            node = { type: 'BinaryExpression', operator, left: node, right };
        }
        return node;
    }

    function parseUnary() {
        if (match('!', '+', '-')) {
            const operator = previous();
            const right = parseUnary();
            return { type: 'UnaryExpression', operator, right };
        }
        return parseMember();
    }

    function consume(expected, errorMsg) {
        if (check(expected)) return advance();
        throw new Error(`${errorMsg} (found '${peek() ?? 'EOF'}')`);
    }

    function consumeIdentifier(msg) {
        const t = peek();
        if (isIdentifier(t)) {
            advance();
            return t;
        }
        throw new Error(`${msg} (found '${t ?? 'EOF'}')`);
    }

    function check(tokenVal) {
        if (isAtEnd()) return false;
        return peek() === tokenVal;
    }

    // Member Expression Handling
    function parseMember() {

        // Start with a primary (number, string, identifier, or (expr))
        let node = parsePrimary();

        // Then handle property access: "." identifier or "[" expression "]"
        while (true) {
            if (match('.')) {
                // object.prop
                const propertyName = consumeIdentifier('Expected property name after \'.\'');
                node = {
                    type: 'MemberExpression',
                    object: node,
                    property: { type: 'Literal', value: propertyName },
                    computed: false
                };
            } else if (match('[')) {
                // object[ expression ]
                const propertyExpr = parseExpression(); // parse what's inside []
                consume(']', 'Expected \']\' after property expression');
                node = {
                    type: 'MemberExpression',
                    object: node,
                    property: propertyExpr,
                    computed: true
                };
            } else {
                break;
            }
        }
        return node;
    }

    function parsePrimary() {
        if (match('(')) {
            const exprNode = parseExpression();
            consume(')', 'Expected \')\' after expression');
            return exprNode;
        }

        if (isAtEnd()) {
            throw new SyntaxError('Unexpected end of input');
        }

        const token = advance();

        if (isNumber(token)) {
            return { type: 'Literal', value: parseFloat(token) };
        }
        if (isString(token)) {
            return { type: 'Literal', value: parseString(token) };
        }
        if (token === 'true') {
            return { type: 'Literal', value: true };
        }
        if (token === 'false') {
            return { type: 'Literal', value: false };
        }
        // Otherwise, treat as identifier
        if (isIdentifier(token)) {
            return { type: 'Identifier', name: token };
        }

        throw new Error(`Unexpected token "${token}" in parsePrimary`);
    }

    const ast = parseExpression();

    if (!isAtEnd()) {
        throw new SyntaxError(`Unexpected identifier '${peek()}'`);
    }

    return ast;
};

const parse = (expression) => {
    const tokens = tokenize(expression);
    return parseTokens(tokens);
};

export { parse };
