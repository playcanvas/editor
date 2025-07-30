import { parse } from './parser.ts';
/**
 * Takes an expression as an AST and evaluates it.
 *
 * @param {import('./parser.js').ASTNode} node - The root node of the expression to evaluate
 * @param {{}} context - The variables used in the expression
 * @returns {*} The evaluated expression
 */
function evaluateAST(node, context = {}) {

    /**
     * Expand the context to include null and undefined.
     * This allows expressions like `a !== null`
     */
    const expandedContext = {
        ...context,
        null: null,
        undefined: undefined
    };

    switch (node.type) {
        case 'Literal':
            return node.value;

        case 'Identifier': {
            if (!(node.name in expandedContext)) {
                throw new ReferenceError(`Undefined identifier: ${node.name}`);
            }
            return expandedContext[node.name];
        }

        case 'UnaryExpression': {
            const val = evaluateAST(node.right, expandedContext);
            switch (node.operator) {
                case '!': return !val;
                case '+': return +val;
                case '-': return -val;
                default:
                    throw new Error(`Unknown unary operator: ${node.operator}`);
            }
        }

        case 'BinaryExpression': {
            const leftVal = evaluateAST(node.left, expandedContext);
            const rightVal = evaluateAST(node.right, expandedContext);
            switch (node.operator) {

                // simple arithmetic
                case '+': return leftVal + rightVal;
                case '-': return leftVal - rightVal;
                case '*': return leftVal * rightVal;
                case '/': return leftVal / rightVal;

                // comparison
                case '<': return leftVal < rightVal;
                case '<=': return leftVal <= rightVal;
                case '>': return leftVal > rightVal;
                case '>=': return leftVal >= rightVal;

                // equality
                case '==': return leftVal == rightVal; // eslint-disable-line eqeqeq
                case '!=': return leftVal != rightVal;  // eslint-disable-line eqeqeq
                case '===': return leftVal === rightVal;
                case '!==': return leftVal !== rightVal;

                // logical
                case '&&': return leftVal && rightVal;
                case '||': return leftVal || rightVal;

                default:
                    throw new Error(`Unknown binary operator: ${node.operator}`);
            }
        }

        case 'MemberExpression': {
            const obj = evaluateAST(node.object, expandedContext);
            if (obj === null || obj === undefined) {
                return undefined;
            }
            let propertyKey;
            if (node.computed) {
                // e.g. obj[ expr ]
                propertyKey = evaluateAST(node.property, expandedContext);
            } else {
                // e.g. obj.prop (property is a literal storing the string name)
                propertyKey = node.property.value;
            }
            return obj[propertyKey];
        }

        default:
            throw new Error(`Unknown node type: ${node.type}`);
    }
}


const evaluate = (expression, context = {}) => {

    // If the expression is a string, parse it first
    const ast = typeof expression === 'string' ?
        parse(expression) :
        expression;

    return evaluateAST(ast, context);
};

export { evaluate };
