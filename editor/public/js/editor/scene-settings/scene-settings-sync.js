// editor.once('load', function() {
//     'use strict';

//     var obj = editor.call('sceneSettings');

//     editor.on('realtime:settings', function(op) {
//         if (op.od && op.oi) {
//             // patch
//             obj.history = false;
//             obj.patch(op.oi);
//             obj.history = true;
//         } else {
//             // unknown
//             console.log('unknown settings operation', op);
//         }
//     });
// });
