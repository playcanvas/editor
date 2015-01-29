// editor.once('load', function() {
//     'use strict';

//     editor.method('selector:delete', function() {
//         var type = editor.call('selector:type');
//         var items = editor.call('selector:items');

//         // nothing to delete
//         if (! type || ! items.length)
//             return;

//         // different types
//         switch(type) {
//             case 'entity':
//                 items.forEach(function(entity) {
//                     editor.call('entities:remove', entity);
//                 });
//                 break;
//             case 'asset':
//                 items.forEach(function(asset) {
//                     editor.call('assets:remove', asset);
//                 });
//                 break;
//             default:
//                 return;
//         }
//     });

//     // bind to DELETE key
//     window.addEventListener('keydown', function(evt) {
//         if (evt.keyCode === 46) { // DELETE key
//             editor.call('selector:delete');
//         }
//     });
// });
