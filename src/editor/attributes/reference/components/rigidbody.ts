/**
 * @type {AttributeReference[]}
 */
export const fields  = [{
    name: 'rigidbody:component',
    title: 'pc.RigidBodyComponent',
    subTitle: '{pc.Component}',
    description: 'The rigidbody Component, when combined with a pc.CollisionComponent, allows your Entities to be simulated using realistic physics. A rigidbody Component will fall under gravity and collide with other rigid bodies, using scripts you can apply forces to the body.',
    url: 'https://api.playcanvas.com/engine/classes/RigidBodyComponent.html'
}, {
    name: 'rigidbody:linearDamping',
    title: 'linearDamping',
    subTitle: '{Number}',
    description: 'Controls the rate at which a body loses linear velocity over time.',
    url: 'https://api.playcanvas.com/engine/classes/RigidBodyComponent.html#lineardamping'
}, {
    name: 'rigidbody:angularDamping',
    title: 'angularDamping',
    subTitle: '{Number}',
    description: 'Controls the rate at which a body loses angular velocity over time.',
    url: 'https://api.playcanvas.com/engine/classes/RigidBodyComponent.html#angulardamping'
}, {
    name: 'rigidbody:angularFactor',
    title: 'angularFactor',
    subTitle: '{pc.Vec3}',
    description: 'Scaling factor for angular movement of the body in each axis.',
    url: 'https://api.playcanvas.com/engine/classes/RigidBodyComponent.html#angularfactor'
}, {
    name: 'rigidbody:friction',
    title: 'friction',
    subTitle: '{Number}',
    description: 'The friction value used when contacts occur between two bodies.',
    url: 'https://api.playcanvas.com/engine/classes/RigidBodyComponent.html#friction'
}, {
    name: 'rigidbody:group',
    title: 'group',
    subTitle: '{Number}',
    description: 'description',
    url: 'https://api.playcanvas.com/engine/classes/RigidBodyComponent.html#group'
}, {
    name: 'rigidbody:linearFactor',
    title: 'linearFactor',
    subTitle: '{pc.Vec3}',
    description: 'Scaling factor for linear movement of the body in each axis.',
    url: 'https://api.playcanvas.com/engine/classes/RigidBodyComponent.html#linearfactor'
}, {
    name: 'rigidbody:mass',
    title: 'mass',
    subTitle: '{Number}',
    description: 'The mass of the body.',
    url: 'https://api.playcanvas.com/engine/classes/RigidBodyComponent.html#mass'
}, {
    name: 'rigidbody:restitution',
    title: 'restitution',
    subTitle: '{Number}',
    description: 'Controls the amount of energy lost when two rigid bodies collide. The restitution of two colliding bodies are multiplied together and this value is then used to scale each body\'s velocity. So if restitution for both bodies is 1, no energy is lost. If one body has a restitution of 0, both bodies will lose all energy. You can informally think of restitution as a measure of how bouncy a body is.',
    url: 'https://api.playcanvas.com/engine/classes/RigidBodyComponent.html#restitution'
}, {
    name: 'rigidbody:type',
    title: 'type',
    subTitle: '{pc.RIGIDBODY_TYPE_*}',
    description: 'The type of RigidBody determines how it is simulated.',
    url: 'https://api.playcanvas.com/engine/classes/RigidBodyComponent.html#type'
}];
