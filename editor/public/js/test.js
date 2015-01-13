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



