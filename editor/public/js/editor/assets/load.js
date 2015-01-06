(function() {
    'use strict'

    var onLoad = function(data) {
        // loading.progress = 0.5;

        data = data.response;

        // loading.progress = 0.6;

        // list
        for(var i = 0; i < data.length; i++) {
            if (data[i].source)
                continue;

            var asset = new Observer(data[i]);

            msg.call('assets:add', asset);

            // var item = new ui.GridItem();
            // item.asset = asset;
            // item.class.add('type-' + asset.type);
            // grid.append(item);

            // assetsIndex[asset.id] = item;

            // if (asset.file && asset.type == 'texture') {
            //     item.style.backgroundImage = 'url("http://playcanvas.dev/api/' + asset.file.url + '")';
            // }

            // var icon = document.createElement('div');
            // icon.classList.add('icon');
            // item.element.appendChild(icon);

            // loading.progress = (i / data.length) * 0.4 + 0.6;
        }
        // loading.progress = 1;
    };

    Ajax
    .get('{{url.api}}/projects/{{project.id}}/assets?view=designer&access_token={{accessToken}}')
    .on('load', function(status, data) {
        onLoad(data);
    })
    // .on('progress', function(progress) {
        // loading.progress = .1 + progress * .4;
    // })
    .on('error', function(status, evt) {
        console.log(status, evt);
    });

    // loading.progress = 0.1;
})();
