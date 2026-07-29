/**
 * Represents the settings for the currently loaded scene.
 */
export type SceneSettingsProps = {
    /**
     * Physics related settings for the scene.
     */
    physics?: {
        /**
         * An array of 3 numbers that represents the gravity force.
         */
        gravity?: [number, number, number];
    };
    /**
     * Render settings for the scene.
     */
    render?: {
        /**
         * The exposure value tweaks the overall brightness of the scene.
         */
        exposure?: number;
        /**
         * The type of fog used in the scene. Can be one of `pc.FOG_NONE`, `pc.FOG_LINEAR`, `pc.FOG_EXP`, `pc.FOG_EXP2`.
         */
        fog?: number;
        /**
         * An array of 3 numbers representing the color of the fog.
         */
        fog_color?: [number, number, number];
        /**
         * The density of the fog. This property is only valid if the fog property is set to `pc.FOG_EXP` or `pc.FOG_EXP2`.
         */
        fog_density?: number;
        /**
         * The distance from the viewpoint where linear fog reaches its maximum. This property is only valid if the fog property is set to `pc.FOG_LINEAR`.
         */
        fog_end?: number;
        /**
         * The distance from the viewpoint where linear fog begins. This property is only valid if the fog property is set to `pc.FOG_LINEAR`.
         */
        fog_start?: number;
        /**
         * The gamma correction to apply when rendering the scene. Can be one of `pc.GAMMA_NONE`, `pc.GAMMA_SRGB`.
         */
        gamma_correction?: number;
        /**
         * An array of 3 numbers representing the color of the scene's ambient light.
         */
        global_ambient?: [number, number, number];
        /**
         * The maximum lightmap resolution.
         */
        lightmapMaxResolution?: number;
        /**
         * The lightmap baking mode. Can be one of `pc.BAKE_COLOR`, `pc.BAKE_COLORDIR`.
         */
        lightmapMode?: number;
        /**
         * The lightmap resolution multiplier.
         */
        lightmapSizeMultiplier?: number;
        /**
         * The `id` of the cubemap texture to be used as the scene's skybox.
         */
        skybox?: number;
        /**
         * Multiplier for skybox intensity.
         */
        skyboxIntensity?: number;
        /**
         * The mip level of the skybox to be displayed. Only valid for prefiltered cubemap skyboxes.
         */
        skyboxMip?: number;
        /**
         * An array of 3 numbers representing the rotation of the skybox.
         */
        skyboxRotation?: [number, number, number];
        /**
         * The tonemapping transform to apply when writing fragments to the frame buffer. Can be: `pc.TONEMAP_LINEAR`, `pc.TONEMAP_FILMIC`, `pc.TONEMAP_HEJL`, `pc.TONEMAP_ACES`.
         */
        tonemapping?: number;
    };
};
