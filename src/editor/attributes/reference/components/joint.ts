import type { AttributeReference } from '../reference.type';

const motionFields = ['linear', 'angular'].flatMap((group) =>
    ['X', 'Y', 'Z'].flatMap((axis) => [
        {
            name: `joint:${group}Motion${axis}`,
            title: `${group}Motion${axis}`,
            subTitle: '{String}',
            description: `Selects whether ${group} motion on the ${axis} axis is locked, limited, or free.`,
            url: `https://api.playcanvas.com/engine/classes/JointComponent.html#${group}motion${axis.toLowerCase()}`
        },
        {
            name: `joint:${group}Limits${axis}`,
            title: `${group}Limits${axis}`,
            subTitle: '{pc.Vec2}',
            description: `Lower and upper limits used when ${group} motion on the ${axis} axis is limited.`,
            url: `https://api.playcanvas.com/engine/classes/JointComponent.html#${group}limits${axis.toLowerCase()}`
        }
    ])
);

export const fields: AttributeReference[] = [
    {
        name: 'joint:component',
        title: 'pc.JointComponent',
        subTitle: '{pc.Component}',
        description: 'Constrains two rigid bodies, or constrains one rigid body to a fixed point in world space.',
        url: 'https://api.playcanvas.com/engine/classes/JointComponent.html'
    },
    {
        name: 'joint:type',
        title: 'type',
        subTitle: '{String}',
        description: 'Selects a fixed, ball, hinge, slider, or six degrees of freedom joint.',
        url: 'https://api.playcanvas.com/engine/classes/JointComponent.html#type'
    },
    {
        name: 'joint:entityA',
        title: 'entityA',
        subTitle: '{pc.Entity}',
        description: 'First constrained entity. It must have a rigid body component.',
        url: 'https://api.playcanvas.com/engine/classes/JointComponent.html#entitya'
    },
    {
        name: 'joint:entityB',
        title: 'entityB',
        subTitle: '{pc.Entity}',
        description: 'Second constrained entity. Leave empty to constrain Entity A to world space.',
        url: 'https://api.playcanvas.com/engine/classes/JointComponent.html#entityb'
    },
    {
        name: 'joint:enableCollision',
        title: 'enableCollision',
        subTitle: '{Boolean}',
        description: 'Allow the two constrained bodies to collide with each other.',
        url: 'https://api.playcanvas.com/engine/classes/JointComponent.html#enablecollision'
    },
    {
        name: 'joint:breakImpulse',
        title: 'breakImpulse',
        subTitle: '{Number}',
        description: 'Impulse above which the joint breaks. Leave empty for an unbreakable joint.',
        url: 'https://api.playcanvas.com/engine/classes/JointComponent.html#breakimpulse'
    },
    {
        name: 'joint:enableLimits',
        title: 'enableLimits',
        subTitle: '{Boolean}',
        description: 'Enable the configured hinge, slider, or ball-joint limits.',
        url: 'https://api.playcanvas.com/engine/classes/JointComponent.html#enablelimits'
    },
    {
        name: 'joint:limits',
        title: 'limits',
        subTitle: '{pc.Vec2}',
        description: 'Lower and upper angular hinge limits or linear slider limits.',
        url: 'https://api.playcanvas.com/engine/classes/JointComponent.html#limits'
    },
    {
        name: 'joint:motorSpeed',
        title: 'motorSpeed',
        subTitle: '{Number}',
        description: 'Target angular hinge speed or linear slider speed.',
        url: 'https://api.playcanvas.com/engine/classes/JointComponent.html#motorspeed'
    },
    {
        name: 'joint:maxMotorForce',
        title: 'maxMotorForce',
        subTitle: '{Number}',
        description: 'Maximum motor force or torque. Set to 0 to disable the motor.',
        url: 'https://api.playcanvas.com/engine/classes/JointComponent.html#maxmotorforce'
    },
    {
        name: 'joint:swingLimitY',
        title: 'swingLimitY',
        subTitle: '{Number}',
        description: 'Maximum ball-joint swing towards its Y axis in degrees.',
        url: 'https://api.playcanvas.com/engine/classes/JointComponent.html#swinglimity'
    },
    {
        name: 'joint:swingLimitZ',
        title: 'swingLimitZ',
        subTitle: '{Number}',
        description: 'Maximum ball-joint swing towards its Z axis in degrees.',
        url: 'https://api.playcanvas.com/engine/classes/JointComponent.html#swinglimitz'
    },
    {
        name: 'joint:twistLimit',
        title: 'twistLimit',
        subTitle: '{Number}',
        description: 'Maximum ball-joint twist about its X axis in degrees.',
        url: 'https://api.playcanvas.com/engine/classes/JointComponent.html#twistlimit'
    },
    ...motionFields,
    {
        name: 'joint:linearStiffness',
        title: 'linearStiffness',
        subTitle: '{pc.Vec3}',
        description: 'Stiffness of the linear springs on the X, Y and Z axes.',
        url: 'https://api.playcanvas.com/engine/classes/JointComponent.html#linearstiffness'
    },
    {
        name: 'joint:linearDamping',
        title: 'linearDamping',
        subTitle: '{pc.Vec3}',
        description: 'Damping of the linear springs on the X, Y and Z axes.',
        url: 'https://api.playcanvas.com/engine/classes/JointComponent.html#lineardamping'
    },
    {
        name: 'joint:linearEquilibrium',
        title: 'linearEquilibrium',
        subTitle: '{pc.Vec3}',
        description: 'Rest positions of the linear springs on the X, Y and Z axes.',
        url: 'https://api.playcanvas.com/engine/classes/JointComponent.html#linearequilibrium'
    },
    {
        name: 'joint:angularStiffness',
        title: 'angularStiffness',
        subTitle: '{pc.Vec3}',
        description: 'Stiffness of the angular springs about the X, Y and Z axes.',
        url: 'https://api.playcanvas.com/engine/classes/JointComponent.html#angularstiffness'
    },
    {
        name: 'joint:angularDamping',
        title: 'angularDamping',
        subTitle: '{pc.Vec3}',
        description: 'Damping of the angular springs about the X, Y and Z axes.',
        url: 'https://api.playcanvas.com/engine/classes/JointComponent.html#angulardamping'
    },
    {
        name: 'joint:angularEquilibrium',
        title: 'angularEquilibrium',
        subTitle: '{pc.Vec3}',
        description: 'Rest angles of the angular springs about the X, Y and Z axes.',
        url: 'https://api.playcanvas.com/engine/classes/JointComponent.html#angularequilibrium'
    }
];
