editor.once('load', function() {
    'use strict';

    editor.once('start', function() {
        editor.emit('realtime:connecting');

        Ajax({
            url: config.url.realtime.http + '/scenes/' + config.scene.id,
            query: {
                access_token: '{{accessToken}}'
            }
        })
        .on('load', function(status) {
            editor.emit('realtime:loading');

            var connection = sharejs.open('pack-' + config.scene.id, 'json', {
                origin: config.url.realtime.http + '/channel',
                authentication: config.accessToken
            }, function(err, doc) {
                if (err) {
                    console.log('error', err);
                    return;
                }

                doc.connection.on('error', function (reason) {
                    console.log('error', reason);
                });

                doc.on('remoteop', function(operations) {
                    for(var i = 0; i < operations.length; i++) {
                        var op = operations[i];
                        editor.emit('realtime:' + op.p[0], op, doc);

                        console.log('realtime:remoteop', Object.keys(op).filter(function(o) { return o !== 'p' }).join(', '), op.p.join('.'));
                    }
                });

                doc.on('change', function() {
                    // console.log('change', arguments);
                });

                doc.on('acknowledge', function() {
                    console.log('realtime:acknowledge', arguments);
                });

                doc.at().on('replace', function (position, oldValue, newValue) {
                    console.log('realtime:replace', position);
                    //console.log('replace ' + position + newValue);
                    // if (position === 'errors') {
                    //     var pack = Ext.getStore('Packs').getAt(0);
                    //     pack.set('errors', newValue);
                    // }
                });

                doc.at().on('insert', function (position, data) {
                    console.log('realtime:insert', position, data);
                    // if (position === 'errors') {
                    //     var pack = Ext.getStore('Packs').getAt(0);
                    //     pack.set('errors', data);
                    // }
                });

                doc.at().on('delete', function (position, data) {
                    console.log('realtime:delete', position, data);
                    // var pack = Ext.getStore('Packs').getAt(0);
                    // pack.set('errors', []);
                });


                editor.emit('realtime:load', doc);
            });
        });
    });
});
