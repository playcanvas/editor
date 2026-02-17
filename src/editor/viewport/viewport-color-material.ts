import { Color, SHADERLANGUAGE_GLSL, StandardMaterial } from 'playcanvas';

// Creates an instance of standard material setup to use vertex colors or a single color.
const createColorMaterial = (useVertexColor?: boolean) => {
    const material = new StandardMaterial();
    material.useLighting = false;
    material.useTonemap = false;
    material.diffuse = new Color(0, 0, 0);
    material.ambient = new Color(0, 0, 0);
    material.emissiveVertexColor = useVertexColor;
    material.getShaderChunks(SHADERLANGUAGE_GLSL).set('debugOutputPS', '');   // do not apply debug output shader code to gizmo
    material.update();

    // Convenience function to set up color and opacity as a color property.
    addColorProperty(material);

    material.color = Color.WHITE;
    return material;
};

const addColorProperty = (material: StandardMaterial): void => {
    Object.defineProperty(material, 'color', {
        set: function (value: import('playcanvas').Color) {

            const linearColor = new Color();
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

const cloneColorMaterial = (material: StandardMaterial) => {
    const clone = material.clone();

    addColorProperty(clone);
    clone.color = material.color;

    return clone;
};

export { createColorMaterial, cloneColorMaterial };
