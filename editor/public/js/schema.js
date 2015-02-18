// "use strict";

// function Schema(data) {
//     this.data = data;
// }

// Schema.prototype.has = function(path) {
//     return this.data.hasOwnProperty(path);
// };

// Schema.prototype.set = function(path, args) {
//     this.data[path] = args;
// };

// Schema.prototype.get = function(path) {
//     return this.data[path] || null;
// };

// Schema.prototype.unset = function(path) {
//     delete this.data[path];
// };

// Schema.prototype.valid = function(path, value) {
//     // not defined
//     if (! this.data.hasOwnProperty(path))
//         return undefined;

//     var field = this.data[path];

//     // wrong type
//     if (field.type === String) {
//         if (typeof(value) !== 'string') {
//             return undefined;
//         }
//     } else if (! (value instanceof field.type)) {
//         return undefined;
//     }

//     // options
//     if (field.type === String && field.options && field.options.indexOf(value) === -1)
//         return undefined;

//     // number
//     if (field.type === Number) {
//         // min
//         if (field.min !== undefined && value < field.min)
//             return field.min;

//         // max
//         if (field.max !== undefined && value > field.max)
//             return field.max;
//     }

//     // custom validation method
//     if (field.valid)
//         return field.valid(value);

//     // valid
//     return value;
// };


// var raw = {
//     hello: 'world',
//     a: 10,
//     b: {
//         c: 20
//     },
//     foo: [ 1, 2, 3 ]
// };
// console.log(JSON.stringify(raw, null, 4));
// console.log(' ');

// var test = new Observer(raw);

// console.log(' ');

// // console.log(test);

// test.on('*:set', function(path, value, valueOld) {
//     console.log('!!! set    !!!', path, value, valueOld);
// });

// test.on('*:unset', function(path, value) {
//     console.log('!!! unset  !!!', path, value);
// });

// test.on('*:insert', function(path, value, ind) {
//     console.log('!!! insert !!!', path, value, ind);
// });

// test.on('*:remove', function(path, value, ind) {
//     console.log('!!! remove !!!', path, value, ind);
// });

// test.on('*:move', function(path, value, indNew, indOld) {
//     console.log('!!! move   !!!', path, value, indOld, indNew);
// });

// // test.move('foo', 2, 1);
// // test.set('a', { foo: 'bar' });
// test.set('a.fee.foo', 'buz');
// test.set('aOur ', [ 1, 4 ]);

// console.log(' ');
// console.log(test);
// console.log(JSON.stringify(test.json(), null, 4));
