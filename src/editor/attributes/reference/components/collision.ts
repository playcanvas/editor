import type { AttributeReference } from '../reference.type';

export const fields: AttributeReference[]  = [{
    name: 'collision:component',
    title: 'pc.CollisionComponent',
    subTitle: '{pc.Component}',
    description: 'A collision volume. use this in conjunction with a pc.RigidBodyComponent to make a collision volume that can be simulated using the physics engine. If the pc.Entity does not have a pc.RigidBodyComponent then this collision volume will act as a trigger volume. When an entity with a dynamic or kinematic body enters or leaves an entity with a trigger volume, both entities will receive trigger events.',
    url: 'https://api.playcanvas.com/engine/classes/CollisionComponent.html'
}, {
    name: 'collision:asset',
    title: 'asset',
    subTitle: '{Number}',
    description: 'The model asset that will be used as a source for the triangle-based collision mesh.',
    url: 'https://api.playcanvas.com/engine/classes/CollisionComponent.html#asset'
}, {
    name: 'collision:renderAsset',
    title: 'renderAsset',
    subTitle: '{Number}',
    description: 'The render asset that will be used as a source for the triangle-based collision mesh.',
    url: 'https://api.playcanvas.com/engine/classes/CollisionComponent.html#renderasset'
}, {
    name: 'collision:axis',
    title: 'axis',
    subTitle: '{Number}',
    description: 'Aligns the capsule/cylinder with the local-space X, Y or Z axis of the entity.',
    url: 'https://api.playcanvas.com/engine/classes/CollisionComponent.html#axis'
}, {
    name: 'collision:halfExtents',
    title: 'halfExtents',
    subTitle: '{pc.Vec3}',
    description: 'The half-extents of the box-shaped collision volume in the local x, y and z axes.',
    url: 'https://api.playcanvas.com/engine/classes/CollisionComponent.html#halfextents'
}, {
    name: 'collision:height',
    title: 'height',
    subTitle: '{Number}',
    description: 'The tip-to-tip height of the capsule/cylinder.',
    url: 'https://api.playcanvas.com/engine/classes/CollisionComponent.html#height'
}, {
    name: 'collision:convexHull',
    title: 'convexHull',
    subTitle: '{Boolean}',
    description: 'If true, the collision shape will be a convex hull.',
    url: 'https://api.playcanvas.com/engine/classes/CollisionComponent.html#convexhull'
}, {
    name: 'collision:radius',
    title: 'radius',
    subTitle: '{Number}',
    description: 'The radius of the capsule/cylinder body.',
    url: 'https://api.playcanvas.com/engine/classes/CollisionComponent.html#radius'
}, {
    name: 'collision:type',
    title: 'type',
    subTitle: '{String}',
    description: `The type of collision primitive.
<ul>
<li><b>Box</b> (<code>"box"</code>): Axis-aligned box shape defined by half extents.</li>
<li><b>Sphere</b> (<code>"sphere"</code>): Sphere shape defined by radius.</li>
<li><b>Capsule</b> (<code>"capsule"</code>): Capsule shape (cylinder with hemispherical ends) defined by radius and height.</li>
<li><b>Cylinder</b> (<code>"cylinder"</code>): Cylinder shape defined by radius and height.</li>
<li><b>Cone</b> (<code>"cone"</code>): Cone shape defined by radius and height.</li>
<li><b>Mesh</b> (<code>"mesh"</code>): Arbitrary mesh shape from a model asset.</li>
<li><b>Compound</b> (<code>"compound"</code>): Combines collision shapes from child entities.</li>
</ul>`,
    url: 'https://api.playcanvas.com/engine/classes/CollisionComponent.html#type'
}, {
    name: 'collision:linearOffset',
    title: 'linearOffset',
    subTitle: '{pc.Vec3}',
    description: 'The positional offset of the collision shape from the Entity position along the local axes.',
    url: 'https://api.playcanvas.com/engine/classes/CollisionComponent.html#linearoffset'
}, {
    name: 'collision:angularOffset',
    title: 'angularOffset',
    subTitle: '{pc.Vec3}',
    description: 'The rotational offset of the collision shape from the Entity rotation in local space.',
    url: 'https://api.playcanvas.com/engine/classes/CollisionComponent.html#angularoffset'
}];
