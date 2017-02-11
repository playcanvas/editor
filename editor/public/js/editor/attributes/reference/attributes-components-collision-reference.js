editor.once('load', function() {
    'use strict';

    var fields = [{
        name: 'component',
        title: 'pc.CollisionComponent',
        subTitle: '{pc.Component}',
        description: 'A collision volume. use this in conjunction with a pc.RigidBodyComponent to make a collision volume that can be simulated using the physics engine. If the pc.Entity does not have a pc.RigidBodyComponent then this collision volume will act as a trigger volume. When an entity with a dynamic or kinematic body enters or leaves an entity with a trigger volume, both entities will receive trigger events.',
        url: 'http://developer.playcanvas.com/api/pc.CollisionComponent.html'
    }, {
        title: 'asset',
        subTitle: '{Number}',
        description: 'The model asset that will be used as a source for the triangle-based collision mesh.',
        url: 'http://developer.playcanvas.com/api/pc.CollisionComponent.html#asset'
    }, {
        title: 'axis',
        subTitle: '{Number}',
        description: 'Aligns the capsule/cylinder with the local-space X, Y or Z axis of the entity',
        url: 'http://developer.playcanvas.com/api/pc.CollisionComponent.html#axis'
    }, {
        title: 'halfExtents',
        subTitle: '{pc.Vec3}',
        description: 'The half-extents of the collision box. This is a 3-dimensional vector: local space half-width, half-height, and half-depth.',
        url: 'http://developer.playcanvas.com/api/pc.CollisionComponent.html#halfExtents'
    }, {
        title: 'height',
        subTitle: '{Number}',
        description: 'The tip-to-tip height of the capsule/cylinder.',
        url: 'http://developer.playcanvas.com/api/pc.CollisionComponent.html#height'
    }, {
        title: 'radius',
        subTitle: '{Number}',
        description: 'The radius of the capsule/cylinder body.',
        url: 'http://developer.playcanvas.com/api/pc.CollisionComponent.html#radius'
    }, {
        title: 'type',
        subTitle: '{String}',
        description: 'The type of collision primitive. Can be: box, sphere, capsulse, cylinder, mesh.',
        url: 'http://developer.playcanvas.com/api/pc.CollisionComponent.html#type'
    }];

    for(var i = 0; i < fields.length; i++) {
        fields[i].name = 'collision:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
