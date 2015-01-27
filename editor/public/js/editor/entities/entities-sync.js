// editor.once('load', function() {
//     'use strict';

//     var syncPaths = [
//         'name',
//         'parent',
//         'children',
//         'position',
//         'rotations',
//         'scale',
//         'enabled',
//         'components'
//     ];

//     editor.on('entities:add', function(entity) {
//         entity.sync.persist = true;

//         entity.on('*:set', function(path, value) {
//             if (! this.sync.persist)
//                 return;

//             console.log('set', path);

//             // find if field should be sync
//             var i = syncPaths.length;
//             while(i--) {
//                 if (path.indexOf(syncPaths) === 0)
//                     break;
//             }

//             // path not for sync
//             if (i === 0)
//                 return;

//             // array
//             var ind = path.lastIndexOf('.');
//             if (ind !== -1) {
//                 var subPath = path.slice(0, ind);
//                 var subInd = parseInt(path.slice(subPath.length + 1), 10);
//                 var arr = entity.get(subPath);
//                 if (arr instanceof Array) {
//                     // if (subPath === 'children') {
//                     //     console.log('!!!!', subPath.split('.').concat([ subInd ]), value);
//                     //     this.sync.at(subPath.split('.').concat([ subInd ])).set(value);
//                     // } else {
//                         this.sync.at(subPath.split('.')).set(arr);
//                     // }

//                     // if (! isNaN(subInd)) {
//                     //     this.sync.at(subPath.split('.').concat([ subInd ])).set(value);
//                     //     return;
//                     // }
//                 }
//             }

//             // single value
//             this.sync.at(path.split('.')).set(value);
//         });

//         entity.on('children:remove', function(value, ind) {
//             if (! this.sync.persist)
//                 return;

//             console.log(this.sync.path, "remove", value, ind);
//             this.sync.at([ 'children', ind ]).remove();
//         });

//         entity.on('children:insert', function(value, ind) {
//             if (! this.sync.persist)
//                 return;

//             console.log(this.sync.path, "insert", value, ind);
//             this.sync.at([ 'children' ]).insert(ind, value);
//         });
//     });

//     editor.on('realtime:hierarchy', function(op, doc) {
//         var entity = editor.call('entities:get', op.p[1]);

//         if (entity) {
//             entity.sync.persist = false;

//             if (op.p[2] === undefined) {
//                 if (op.hasOwnProperty('od') && op.hasOwnProperty('oi')) {
//                     // update entity
//                     entity.patch(op.oi);

//                 } else if (op.hasOwnProperty('od')) {
//                     // remove entity
//                     entity.destroy();
//                 }

//             } else if (op.hasOwnProperty('oi')) {
//                 // set field
//                 var path = op.p.slice(2).join('.');
//                 entity.set(path, op.oi);

//             } else if (op.hasOwnProperty('ld')) {
//                 // children remove
//                 if (op.p[2] === 'children') {
//                     var child = editor.call('entities:get', op.ld);
//                     if (child) {
//                         entity.remove('children', child.resource_id);
//                     }
//                 }

//             } else if (op.hasOwnProperty('li')) {
//                 // children insert
//                 if (op.p[2] === 'children') {
//                     var child = editor.call('entities:get', op.li);
//                     if (child) {
//                         entity.insert('children', child.resource_id, op.p[3]);
//                     }
//                 }

//             } else {
//                 // unknown remoteop
//                 console.log('remoteop, unknown', op.p.join('.'), op);
//             }

//             entity.sync.persist = true;

//         } else if (op.p[2] === undefined && op.hasOwnProperty('oi')) {
//             // new entity
//             entity = new Observer(op.oi);
//             entity.sync = doc.at([ 'hierarchy', entity.resource_id ]);
//             editor.call('entities:add', entity);

//         } else {
//             // unknown remoteop
//             console.log('remoteop, unknown', op.p.join('.'), op);
//         }
//     });
// });
