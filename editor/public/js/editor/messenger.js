(function() {
    'use strict';

    var messenger = new Messenger();

    messenger.connect(config.url.messenger.ws);

    messenger.on('connect', function() {
        this.authenticate(config.accessToken, 'designer');
    });

    messenger.on('welcome', function() {
        this.projectWatch(config.project.id);
    });

    messenger.on('message', function(evt) {
        msg.emit('messenger:' + evt.name, evt.data);
    });
})();


// messenger.on('asset.new', function(msg) {
//     // if its material or cubemap and already exists, then just skip
//     if (msg.data.asset.type == 'material' || msg.data.asset.type == 'cubemap') {
//         if (assetStore.getById(msg.data.asset.id)) {
//             return;
//         }
//     }

//     Ext.getStore('Assets').load({
//         id: msg.data.asset.id,
//         addRecords: true,
//         callback: function(records) {
//             if (records) {
//                 messenger.emit('asset.new:' + records[0].data.id, records[0]);
//             }
//         }
//     });
// }.bind(this));

// messenger.on('asset.update', function(msg) {
//     // skip source asset with status incomplete
//     if (msg.data.asset.source && msg.data.asset.status !== 'complete') return;

//     if (msg.data.asset.type == 'material' && this.getEditorPanel().materialEditor.isVisible()) {
//         var material = this.getEditorPanel().materialEditor.getMaterial();
//         if (material && material.get('id') == msg.data.asset.id) {
//             return;
//         }
//     }  else if (msg.data.asset.type == 'cubemap' && this.getEditorPanel().cubemapEditor.isVisible()) {
//         var cubemap = this.getEditorPanel().cubemapEditor.asset;
//         if (cubemap && cubemap.get('id') == msg.data.asset.id) {
//             return;
//         }
//     }


//     Ext.getStore('Assets').load({
//         id: msg.data.asset.id,
//         addRecords: true,
//         callback: function(records) {
//             if (records) {
//                 var record = records[0];
//                 if (record.raw.source && record.raw.task.status == 'complete') {
//                     messenger.emit('asset.uploaded:' + record.raw.id, record);
//                 }
//             }
//         }
//     });
// }.bind(this));

// messenger.on('asset.delete', function(msg) {
//     var asset = Ext.getStore('Assets').getById(msg.data.asset.id);
//     if (!asset) {
//         return;
//     }

//     Ext.getStore('Assets').remove(asset);
// });
