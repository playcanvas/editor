/**
 * A custom AABB is configured when the centre field holds a vector. An explicit
 * null means the feature is off — a zero vector does not.
 */
export const hasCustomAabb = (entity: any, component: 'model' | 'render') => {
    return Array.isArray(entity.get(`components.${component}.aabbCenter`));
};
