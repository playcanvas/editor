var fs = require("fs");
var browserify = require('browserify');
var b = browserify();
b.add('./sharedb-client.js');

if (!fs.existsSync('js/realtime')) {
    fs.mkdirSync('js/realtime');
}

var outputFile = fs.createWriteStream('js/realtime/share.uncompressed.js');
b.bundle().pipe(outputFile);
