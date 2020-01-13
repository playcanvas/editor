editor.once('load', function() {
    'use strict';

    var fields = [{
        name: 'component',
        title: 'pc.RigidBodyComponent',
        subTitle: '{pc.Component}',
        description: 'The rigidbody Component, when combined with a pc.CollisionComponent, allows your Entities to be simulated using realistic physics. A rigidbody Component will fall under gravity and collide with other rigid bodies, using scripts you can apply forces to the body.',
        url: 'http://developer.playcanvas.com/api/pc.RigidBodyComponent.html'
    }, {
        title: 'linearDamping',
        subTitle: '{Number}',
        description: 'Controls the rate at which a body loses linear velocity over time.',
        url: 'http://developer.playcanvas.com/api/pc.RigidBodyComponent.html#linearDamping'
    }, {
        title: 'angularDamping',
        subTitle: '{Number}',
        description: 'Controls the rate at which a body loses angular velocity over time.',
        url: 'http://developer.playcanvas.com/api/pc.RigidBodyComponent.html#angularDamping'
    }, {
        title: 'angularFactor',
        subTitle: '{pc.Vec3}',
        description: 'Scaling factor for angular movement of the body in each axis.',
        url: 'http://developer.playcanvas.com/api/pc.RigidBodyComponent.html#angularFactor'
    }, {
        title: 'friction',
        subTitle: '{Number}',
        description: 'The friction value used when contacts occur between two bodies.',
        url: 'http://developer.playcanvas.com/api/pc.RigidBodyComponent.html#friction'
    }, {
        title: 'group',
        subTitle: '{Number}',
        description: 'description',
        url: 'http://developer.playcanvas.com/api/pc.RigidBodyComponent.html#group'
    }, {
        title: 'linearFactor',
        subTitle: '{pc.Vec3}',
        description: 'Scaling factor for linear movement of the body in each axis.',
        url: 'http://developer.playcanvas.com/api/pc.RigidBodyComponent.html#linearFactor'
    }, {
        title: 'mass',
        subTitle: '{Number}',
        description: 'The mass of the body.',
        url: 'http://developer.playcanvas.com/api/pc.RigidBodyComponent.html#mass'
    }, {
        title: 'restitution',
        subTitle: '{Number}',
        description: 'The amount of energy lost when two objects collide, this determines the bounciness of the object.',
        url: 'http://developer.playcanvas.com/api/pc.RigidBodyComponent.html#restitution'
    }, {
        title: 'type',
        subTitle: '{pc.RIGIDBODY_TYPE_*}',
        description: 'The type of RigidBody determines how it is simulated.',
        url: 'http://developer.playcanvas.com/api/pc.RigidBodyComponent.html#type'
    }];

    for(var i = 0; i < fields.length; i++) {
        fields[i].name = 'rigidbody:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
