// Creates an instance of standard material setup to use vertex colors or a single color.
const createColorMaterial = (useVertexColor) => {
    const material = new pc.StandardMaterial();
    material.useLighting = false;
    material.useTonemap = false;
    material.diffuse = new pc.Color(0, 0, 0);
    material.ambient = new pc.Color(0, 0, 0);
    material.emissiveVertexColor = useVertexColor;
    material.getShaderChunks(pc.SHADERLANGUAGE_GLSL).set('debugOutputPS', '');   // do not apply debug output shader code to gizmo
    material.update();

    // Convenience function to set up color and opacity as a color property.
    addColorProperty(material);

    material.color = pc.Color.WHITE;
    return material;
};

const addColorProperty = (material) => {
    Object.defineProperty(material, 'color', {
        set: function (value) {

            const linearColor = new pc.Color();
            linearColor.linear(value);

            this.emissive = linearColor;
            this.opacity = linearColor.a;

            // used by custom shaders in gizmo-collision
            this.setParameter('uColor', [linearColor.r, linearColor.g, linearColor.b, linearColor.a]);
        },
        get: function () {
            return this.emissive;
        }
    });
};

const cloneColorMaterial = (material) => {
    const clone = material.clone();

    addColorProperty(clone);
    clone.color = material.color;

    return clone;
};

export { createColorMaterial, cloneColorMaterial };
