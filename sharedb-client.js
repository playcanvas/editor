// we use browserify to compile all nodejs modules with dependencies into
// a single share.uncompressed file to use in browser
// ot-text is used from forked and patched https://github.com/ottypes/text
var textType = require('ot-text').type;
window.share = require('sharedb/lib/client');
window.share.types.register(textType);
