var fs = require("fs");
var browserify = require('browserify');
var b = browserify();
b.add('./sharedb-client.js');
var outputFile = fs.createWriteStream('js/realtime/share.uncompressed.js');
b.bundle().pipe(outputFile);
