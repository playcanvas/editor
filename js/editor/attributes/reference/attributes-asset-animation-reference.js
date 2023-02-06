editor.once('load', function () {
    var fields = [{
        name: 'asset',
        title: 'pc.Animation',
        subTitle: '{Class}',
        description: 'An animation is a sequence of keyframe arrays which map to the nodes of a skeletal hierarchy. It controls how the nodes of the hierarchy are transformed over time.',
        url: 'http://developer.playcanvas.com/api/pc.Animation.html'
    }, {
        title: 'name',
        description: 'The name of the animation',
        url: 'http://developer.playcanvas.com/api/pc.Animation.html'
    }, {
        title: 'duration',
        description: 'Duration of the animation in seconds.',
        url: 'http://developer.playcanvas.com/api/pc.Animation.html'
    }];

    // fields reference
    for (let i = 0; i < fields.length; i++) {
        fields[i].name = 'asset:animation:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
