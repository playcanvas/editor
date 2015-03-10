editor.once('load', function() {
    'use strict';

    var assetsPanel = editor.call('layout.assets');
    var uploadJobs = 0;

    var uploadFile = function(file, fn) {
        var form = new FormData();
        form.append('file', file, file.name);

        var job = ++uploadJobs;
        editor.call('status:job', 'asset-upload:' + job, 0);

        Ajax({
            url: '/editor/project/{{project.id}}/asset-upload',
            method: 'POST',
            query: {
                'access_token': '{{accessToken}}'
            },
            data: form,
            ignoreContentType: true,
            headers: {
                Accept: 'application/json'
            }
        })
        .on('load', function(status, data) {
            editor.call('status:text', data);
            editor.call('status:job', 'asset-upload:' + job);
        })
        .on('progress', function(progress) {
            editor.call('status:job', 'asset-upload:' + job, progress);
        })
        .on('error', function(status, data) {
            editor.call('status:error', data);
            editor.call('status:job', 'asset-upload:' + job);
        });
        //     var id = data.response[0].id;

        //     // // once asset created
        //     // var evtAssetAdd = editor.once('assets:add[' + id + ']', function(asset) {
        //     //     evtAssetAdd = null;
        //     //     // need small delay
        //     //     setTimeout(function() {
        //     //         // select asset
        //     //         editor.call('selector:clear');
        //     //         editor.call('selector:add', 'asset', asset);
        //     //     }, 0);
        //     // });

        //     // // selector might be changed, then don't autoselect
        //     // editor.once('selector:change', function() {
        //     //     if (evtAssetAdd)
        //     //         evtAssetAdd.unbind();
        //     // });
        // })
        // .on('error', function(status, evt) {
        //     // console.log(status, evt);
        // });



        // // var url = '/edit/' + itemId + '/upload/picture';
        // var formData = new FormData();
        // formData.append('file', file, file.name);

        // var progress = document.querySelector('#previews .item[data-id="' + file.id + '"] > .progress');
        // var bar = progress.querySelector('.bar');

        // var xhr = new XMLHttpRequest();
        // xhr.withCredentials = true;

        // xhr.upload.addEventListener('progress', function(e) {
        //     if (e.lengthComputable) {
        //         var percentage = Math.round((e.loaded * 100) / e.total);
        //         bar.style.width = percentage + '%';
        //     }
        // }, false);

        // xhr.addEventListener('load', function(e) {
        //     if (xhr.status == 200) {
        //         fn.call(file, null, JSON.parse(xhr.responseText));
        //     } else {
        //         progress.parentNode.classList.add('error');
        //         fn.call(file, new Error(xhr.status));
        //     }
        // }, false);

        // xhr.addEventListener('error', function(e) {
        //     console.log('error');
        // });

        // xhr.addEventListener('abort', function(e) {
        //     console.log('aborted');
        // });

        // xhr.open('POST', url, true);
        // xhr.setRequestHeader('Accept', 'application/json');
        // xhr.send(formData);
    };

    var dropRef = editor.call('drop:target', {
        ref: assetsPanel.element,
        type: 'files',
        drop: function(type, data) {
            if (type !== 'files')
                return;

            for(var i = 0; i < data.length; i++) {
                uploadFile(data[i]);
            }
        }
    });

    dropRef.element.classList.add('assets-drop-area');
});
