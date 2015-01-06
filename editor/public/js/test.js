// var projectSchema = new Schema({
//     "name": {
//         type: String,
//         valid: function(value) {
//             if (value.length >= 4 && value.length <= 16 && /^[a-zA-Z0-9\-]+$/.test(value)) {
//                 return value;
//             }
//         }
//     },
//     "description": {
//         type: String
//     },
//     "primary_pack": {
//         type: String
//     },
//     "private": {
//         type: Boolean
//     },
//     "website": {
//         type: String
//     },
//     "private_source_assets": {
//         type: Boolean
//     },
//     "settings.width": {
//         type: Number,
//         min: 32,
//         max: 7680
//     },
//     "settings.height": {
//         type: Number,
//         min: 32,
//         max: 4320
//     },
//     "settings.fill_mode": {
//         type: Array,
//         options: [ "KEEP_ASPECT", "FILL_WINDOW", "NONE" ]
//     },
//     "settings.resolution_mode": {
//         type: Array,
//         options: [ "FIXED", "AUTO" ]
//     }
// });



// var project = new Observer(projectRaw, { schema: projectSchema });




var hierarchyOverlay = new ui.Panel();
hierarchyOverlay.class.add('overlay');
hierarchyPanel.append(hierarchyOverlay);

var p = new ui.Progress();
p.on('progress:100', function() {
    hierarchyOverlay.hidden = true;
});
hierarchyOverlay.append(p);


var loaded = function(data) {
    p.progress = 0.6;

    // list
    var total = Object.keys(data).length;
    var i = 0;
    for(var key in data) {
        msg.call('entities:add', new Observer(data[key]))
        p.progress = (++i / total) * 0.4 + 0.6;
    }

    p.progress = 1;
};


Ajax({
    url: '{{url.api}}{{owner.username}}/{{project.name}}/packs/{{pack.resource_id}}',
    query: {
        access_token: '{{accessToken}}',
        flat: 1
    }
})
.on('load', function(status, data) {
    loaded(data.response[0].hierarchy);
})
.on('progress', function(progress) {
    p.progress = 0.1 + progress * .4;
})
.on('error', function(status, evt) {
    console.log(status, evt);
});


p.progress = 0.1;

msg.call('attributes:clear');
