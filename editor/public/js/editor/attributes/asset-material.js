var A;
(function() {
    'use strict';

    var mapping = {
        ambient: "vec3",
        ambientTint: "boolean",
        diffuse: "vec3",
        diffuseMap: "texture",
        diffuseMapTiling: "vec2",
        diffuseMapOffset: "vec2",
        diffuseMapTint: "boolean",
        specular: "vec3",
        specularMap: "texture",
        specularMapTiling: "vec2",
        specularMapOffset: "vec2",
        specularMapTint: "boolean",
        specularAntialias: "boolean",
        conserveEnergy: "boolean",
        shininess: "float",
        glossMap: "texture",
        glossMapTiling: "vec2",
        glossMapOffset: "vec2",
        fresnelModel: "float",
        fresnelFactor: "float",
        emissive: "vec3",
        emissiveMap: "texture",
        emissiveMapTiling: "vec2",
        emissiveMapOffset: "vec2",
        emissiveMapTint: "boolean",
        normalMap: "texture",
        normalMapTiling: "vec2",
        normalMapOffset: "vec2",
        bumpMapFactor: "float",
        heightMap: "texture",
        heightMapTiling: "vec2",
        heightMapOffset: "vec2",
        opacity: "float",
        opacityMap: "texture",
        opacityMapTiling: "vec2",
        opacityMapOffset: "vec2",
        reflectivity: "float",
        sphereMap: "texture",
        cubeMap: "cubemap",
        lightMap: "texture",
        aoMap: "texture",
        aoUvSet: "float",
        depthTest: "boolean",
        depthWrite: "boolean",
        cull: "float",
        blendType: "float"
    };

    msg.on('attributes:inspect[asset]', function(assets) {
        if (assets.length !== 1 || assets[0].type !== 'material')
            return;

        var asset = assets[0];
        A = asset;

        // properties panel
        var paramsPanel = msg.call('attributes:addPanel', {
            name: 'Material Properties'
        });
        // paramsPanel.hidden = true;


        // model
        var fieldModel = msg.call('attributes:addField', {
            parent: paramsPanel,
            name: 'Shading',
            link: asset,
            path: 'data.shader'
        });


        // // ambient
        // var ambientPanel = msg.call('attributes:addPanel', {
        //     parent: paramsPanel,
        //     name: 'Ambient'
        // });


        // // map
        // var fieldAmbientMap = msg.call('attributes:addField', {
        //     parent: ambientPanel,
        //     type: 'number',
        //     name: 'Texture',
        //     link: asset,
        //     path: 'data.parameters.0.data'
        // });

        // // map, hide/show color
        // fieldAmbientMap.on('change', function(value) {
        //     fieldAmbientTint.parent.hidden = ! value;
        //     fieldAmbientColor[0].parent.hidden = ! (fieldAmbientTint.value || ! value);
        // });

        // // tint
        // var fieldAmbientTint = msg.call('attributes:addField', {
        //     parent: ambientPanel,
        //     type: 'checkbox',
        //     name: 'Tint',
        //     link: asset,
        //     path: 'data.parameters.0.data'
        // });
        // fieldAmbientTint.parent.hidden = ! fieldAmbientMap.value;

        // fieldAmbientTint.on('change', function(value) {
        //     fieldAmbientColor[0].parent.hidden = ! (value || ! fieldAmbientMap.value);
        // });

        // // color
        // var fieldAmbientColor = msg.call('attributes:addField', {
        //     parent: ambientPanel,
        //     type: 'vec3',
        //     name: 'Color',
        //     link: asset,
        //     path: 'data.parameters.0.data'
        // });
        // fieldAmbientColor[0].parent.hidden = ! (fieldAmbientTint.value || ! fieldAmbientMap.value);


        // // diffuse
        // var diffusePanel = msg.call('attributes:addPanel', {
        //     parent: paramsPanel,
        //     name: 'Diffuse'
        // });

        // // map
        // var fieldDiffuseMap = msg.call('attributes:addField', {
        //     parent: diffusePanel,
        //     type: 'number',
        //     name: 'Texture',
        //     link: asset,
        //     path: 'data.diffuseMap'
        // });

        // // map, hide/show offset and tiling, as well as color
        // fieldDiffuseMap.on('change', function(value) {
        //     fieldDiffuseOffset[0].parent.hidden = value === 0;
        //     fieldDiffuseTiling[0].parent.hidden = value === 0;
        //     fieldDiffuseTint.parent.hidden = ! value;
        //     fieldDiffuseColor[0].parent.hidden = ! (fieldDiffuseTint.value || value === 0);
        // });

        // // offset
        // var fieldDiffuseOffset = msg.call('attributes:addField', {
        //     parent: diffusePanel,
        //     type: 'vec2',
        //     name: 'Offset',
        //     link: asset,
        //     path: 'data.diffuseMapOffset'
        // });

        // // tiling
        // var fieldDiffuseTiling = msg.call('attributes:addField', {
        //     parent: diffusePanel,
        //     type: 'vec2',
        //     name: 'Tiling',
        //     link: asset,
        //     path: 'data.diffuseMapTiling'
        // });

        // // tint
        // var fieldDiffuseTint = msg.call('attributes:addField', {
        //     parent: diffusePanel,
        //     type: 'checkbox',
        //     name: 'Tint',
        //     link: asset,
        //     path: 'data.diffuseTint'
        // });

        // // tint, hide/show color
        // fieldDiffuseTint.on('change', function(value) {
        //     fieldDiffuseColor[0].parent.hidden = ! (value || ! fieldDiffuseMap.value);
        // });

        // // color
        // var fieldDiffuseColor = msg.call('attributes:addField', {
        //     parent: diffusePanel,
        //     type: 'vec3',
        //     name: 'Color',
        //     link: asset,
        //     path: 'data.diffuse'
        // });

        // fieldDiffuseColor[0].parent.hidden = ! (fieldDiffuseTint.value || ! fieldDiffuseMap.value);



        // // specular
        // var specularPanel = msg.call('attributes:addPanel', {
        //     parent: paramsPanel,
        //     name: 'Specular'
        // });

        // // map
        // var fieldSpecularMap = msg.call('attributes:addField', {
        //     parent: specularPanel,
        //     type: 'number',
        //     name: 'Specular',
        //     link: asset,
        //     path: 'data.specularMap'
        // });

        // // map, hide/show offset and tiling, as well as color
        // fieldSpecularMap.on('change', function(value) {
        //     fieldSpecularOffset[0].parent.hidden = value === 0;
        //     fieldSpecularTiling[0].parent.hidden = value === 0;
        //     fieldSpecularTint.parent.hidden = ! value;
        //     fieldSpecularColor[0].parent.hidden = ! (fieldSpecularTint.value || value === 0);
        // });

        // // offset
        // var fieldSpecularOffset = msg.call('attributes:addField', {
        //     parent: specularPanel,
        //     type: 'vec2',
        //     name: 'Offset',
        //     link: asset,
        //     path: 'data.specularMapOffset'
        // });

        // // tiling
        // var fieldSpecularTiling = msg.call('attributes:addField', {
        //     parent: specularPanel,
        //     type: 'vec2',
        //     name: 'Tiling',
        //     link: asset,
        //     path: 'data.specularMapTiling'
        // });

        // // tint
        // var fieldSpecularTint = msg.call('attributes:addField', {
        //     parent: specularPanel,
        //     type: 'checkbox',
        //     name: 'Tint',
        //     link: asset,
        //     path: 'data.specularTint'
        // });

        // // tint, hide/show color
        // fieldSpecularTint.on('change', function(value) {
        //     fieldSpecularColor[0].parent.hidden = ! (value || ! fieldSpecularMap.value);
        // });

        // // color
        // var fieldSpecularColor = msg.call('attributes:addField', {
        //     parent: specularPanel,
        //     type: 'vec3',
        //     name: 'Color',
        //     link: asset,
        //     path: 'data.specular'
        // });

        // fieldSpecularColor[0].parent.hidden = ! (fieldSpecularTint.value || ! fieldSpecularMap.value);

        // // shininess
        // var fieldShininess = msg.call('attributes:addField', {
        //     parent: specularPanel,
        //     type: 'number',
        //     name: 'Shininess',
        //     link: asset,
        //     path: 'data.shininess'
        // });

        // // map (gloss)
        // var fieldGlossMap = msg.call('attributes:addField', {
        //     parent: specularPanel,
        //     type: 'number',
        //     name: 'Glossiness',
        //     link: asset,
        //     path: 'data.glossMap'
        // });

        // // map, hide/show offset and tiling, as well as color
        // fieldGlossMap.on('change', function(value) {
        //     fieldGlossOffset[0].parent.hidden = value === 0;
        //     fieldGlossTiling[0].parent.hidden = value === 0;
        // });

        // // offset
        // var fieldGlossOffset = msg.call('attributes:addField', {
        //     parent: specularPanel,
        //     type: 'vec2',
        //     name: 'Offset',
        //     link: asset,
        //     path: 'data.glossMapOffset'
        // });

        // // tiling
        // var fieldGlossTiling = msg.call('attributes:addField', {
        //     parent: specularPanel,
        //     type: 'vec2',
        //     name: 'Tiling',
        //     link: asset,
        //     path: 'data.glossMapTiling'
        // });



        // // emissive
        // var emissivePanel = msg.call('attributes:addPanel', {
        //     parent: paramsPanel,
        //     name: 'Emissive'
        // });

        // // map
        // var fieldEmissiveMap = msg.call('attributes:addField', {
        //     parent: emissivePanel,
        //     type: 'number',
        //     name: 'Texture',
        //     link: asset,
        //     path: 'data.emissiveMap'
        // });

        // // map, hide/show offset and tiling, as well as color
        // fieldEmissiveMap.on('change', function(value) {
        //     fieldEmissiveOffset[0].parent.hidden = value === 0;
        //     fieldEmissiveTiling[0].parent.hidden = value === 0;
        //     fieldEmissiveTint.parent.hidden = ! value;
        //     fieldEmissiveColor[0].parent.hidden = ! (fieldEmissiveTint.value || value === 0);
        // });

        // // offset
        // var fieldEmissiveOffset = msg.call('attributes:addField', {
        //     parent: emissivePanel,
        //     type: 'vec2',
        //     name: 'Offset',
        //     link: asset,
        //     path: 'data.emissiveMapOffset'
        // });

        // // tiling
        // var fieldEmissiveTiling = msg.call('attributes:addField', {
        //     parent: emissivePanel,
        //     type: 'vec2',
        //     name: 'Tiling',
        //     link: asset,
        //     path: 'data.emissiveMapTiling'
        // });

        // // tint
        // var fieldEmissiveTint = msg.call('attributes:addField', {
        //     parent: emissivePanel,
        //     type: 'checkbox',
        //     name: 'Tint',
        //     link: asset,
        //     path: 'data.emissiveTint'
        // });

        // // tint, hide/show color
        // fieldEmissiveTint.on('change', function(value) {
        //     fieldEmissiveColor[0].parent.hidden = ! (value || ! fieldEmissiveMap.value);
        // });

        // // color
        // var fieldEmissiveColor = msg.call('attributes:addField', {
        //     parent: emissivePanel,
        //     type: 'vec3',
        //     name: 'Color',
        //     link: asset,
        //     path: 'data.emissive'
        // });

        // fieldEmissiveColor[0].parent.hidden = ! (fieldEmissiveTint.value || ! fieldEmissiveMap.value);



        // // parallax
        // var parallaxPanel = msg.call('attributes:addPanel', {
        //     parent: paramsPanel,
        //     name: 'Parallax'
        // });

        // // map
        // var fieldParallaxMap = msg.call('attributes:addField', {
        //     parent: parallaxPanel,
        //     type: 'number',
        //     name: 'Texture',
        //     link: asset,
        //     path: 'data.parallaxMap'
        // });

        // // map, hide/show offset and tiling, as well as color
        // fieldParallaxMap.on('change', function(value) {
        //     fieldParallaxOffset[0].parent.hidden = value === 0;
        //     fieldParallaxTiling[0].parent.hidden = value === 0;
        //     fieldParallaxStrength.parent.hidden = value === 0;
        // });

        // // offset
        // var fieldParallaxOffset = msg.call('attributes:addField', {
        //     parent: parallaxPanel,
        //     type: 'vec2',
        //     name: 'Offset',
        //     link: asset,
        //     path: 'data.parallaxMapOffset'
        // });
        // fieldParallaxOffset[0].parent.hidden = ! fieldEmissiveMap.value;

        // // tiling
        // var fieldParallaxTiling = msg.call('attributes:addField', {
        //     parent: parallaxPanel,
        //     type: 'vec2',
        //     name: 'Tiling',
        //     link: asset,
        //     path: 'data.parallaxMapTiling'
        // });
        // fieldParallaxTiling[0].parent.hidden = ! fieldEmissiveMap.value;

        // // strength
        // var fieldParallaxStrength = msg.call('attributes:addField', {
        //     parent: parallaxPanel,
        //     type: 'number',
        //     name: 'Strength',
        //     link: asset,
        //     path: 'data.parallaxStrength'
        // });
        // fieldParallaxStrength.parent.hidden = ! fieldEmissiveMap.value;



        // // reflection
        // var reflectionPanel = msg.call('attributes:addPanel', {
        //     parent: paramsPanel,
        //     name: 'Reflection'
        // });

        // // spheremap
        // var fieldReflectionSphere = msg.call('attributes:addField', {
        //     parent: reflectionPanel,
        //     type: 'number',
        //     name: 'Sphere Map',
        //     link: asset,
        //     path: 'data.sphereMap'
        // });
        // fieldReflectionSphere.on('change', function(value) {
        //     fieldReflectionStrength.parent.hidden = ! fieldReflectionSphere.value && ! fieldReflectionCubeMap.value;
        //     fieldReflectionCubeMap.parent.hidden = !! value;
        // });

        // // cubemap
        // var fieldReflectionCubeMap = msg.call('attributes:addField', {
        //     parent: reflectionPanel,
        //     type: 'number',
        //     name: 'Cube Map',
        //     link: asset,
        //     path: 'data.cubeMap'
        // });
        // fieldReflectionCubeMap.on('change', function(value) {
        //     fieldReflectionStrength.parent.hidden = ! fieldReflectionSphere.value && ! fieldReflectionCubeMap.value;
        //     fieldReflectionSphere.parent.hidden = !! value;
        // });

        // // reflectivity
        // var fieldReflectionStrength = msg.call('attributes:addField', {
        //     parent: reflectionPanel,
        //     type: 'number',
        //     name: 'Reflectivity',
        //     link: asset,
        //     path: 'data.reflectivity'
        // });
        // fieldReflectionStrength.parent.hidden = ! fieldReflectionSphere.value && ! fieldReflectionCubeMap.value;


        // // lightmap
        // var lightmapPanel = msg.call('attributes:addPanel', {
        //     parent: paramsPanel,
        //     name: 'LightMap'
        // });

        // // map
        // var fieldLightMap = msg.call('attributes:addField', {
        //     parent: lightmapPanel,
        //     type: 'number',
        //     name: 'Texture',
        //     link: asset,
        //     path: 'data.lightMap'
        // });


        // // render states
        // var renderStatesPanel = msg.call('attributes:addPanel', {
        //     parent: paramsPanel,
        //     name: 'Render States'
        // });

        // // depthTest
        // var fieldDepthTest = msg.call('attributes:addField', {
        //     parent: renderStatesPanel,
        //     type: 'checkbox',
        //     name: 'Depth Test',
        //     link: asset,
        //     path: 'data.depthTest'
        // });

        // // depthWrite
        // var fieldDepthWrite = msg.call('attributes:addField', {
        //     parent: renderStatesPanel,
        //     type: 'checkbox',
        //     name: 'Depth Write',
        //     link: asset,
        //     path: 'data.depthWrite'
        // });

        // // culling
        // var fieldCullMode = msg.call('attributes:addField', {
        //     parent: renderStatesPanel,
        //     type: 'number',
        //     name: 'Cull Mode',
        //     link: asset,
        //     path: 'data.cullMode'
        // });

        // // culling
        // var fieldBlendType = msg.call('attributes:addField', {
        //     parent: renderStatesPanel,
        //     type: 'number',
        //     name: 'Blend Type',
        //     link: asset,
        //     path: 'data.blendType'
        // });
    });
})();
