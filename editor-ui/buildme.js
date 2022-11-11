var textType = require('ot-text').type;
window.share = require('sharedb/lib/client');
window.share.types.register(textType);

// Copy below to node_modules/ot-text/lib/text.js bottom
//
//
// // Calculate the cursor position after the given operation
// exports.applyToCursor = function (op) {
//     var pos = 0;
//     for (var i = 0; i < op.length; i++) {
//         var c = op[i];
//         switch (typeof c) {
//             case 'number':
//                 pos += c;
//                 break;
//             case 'string':
//                 pos += c.length;
//                 break;
//             case 'object':
//                 //pos -= c.d;
//                 break;
//         }
//     }
//     return pos;
// };
//
// // Generate an operation that semantically inverts the given operation
// // when applied to the provided snapshot.
// // It needs a snapshot of the document before the operation
// // was applied to invert delete operations.
// exports.semanticInvert = function (str, op) {
//     if (typeof str !== 'string') {
//         throw Error('Snapshot should be a string');
//     }
//     checkOp(op);
//
//     // Save copy
//     var originalOp = op.slice();
//
//     // Shallow copy
//     op = op.slice();
//
//     var len = op.length;
//     var cursor, prevOps, tmpStr;
//     for (var i = 0; i < len; i++) {
//         var c = op[i];
//         switch (typeof c) {
//             case 'number':
//                 // In case we have cursor movement we do nothing
//                 break;
//             case 'string':
//                 // In case we have string insertion we generate a string deletion
//                 op[i] = {d: c.length};
//                 break;
//             case 'object':
//                 // In case of a deletion we need to reinsert the deleted string
//                 prevOps = originalOp.slice(0, i);
//                 cursor = this.applyToCursor(prevOps);
//                 tmpStr = this.apply(str, trim(prevOps));
//                 op[i] = tmpStr.substring(cursor, cursor + c.d);
//                 break;
//         }
//     }
//
//     return this.normalize(op);
// };
//

// Run "./node_modules/.bin/browserify buildme.js -o js/realtime/share.uncompressed.js"
