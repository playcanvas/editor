editor.once('load', function() {
    'use strict';

    var app = editor.call('viewport:app');
    var device = app.graphicsDevice;
    var renderer = app.renderer;
    var scene = editor.call('preview:scene');

    var sphere = new pc.Entity();
    sphere.name = 'sphere';
    sphere.setPosition(0, 0, -2);
    sphere.addComponent('model', {
        type: 'sphere'
    });
    scene.root.addChild(sphere);

    var cameraEntity = new pc.Entity();
    cameraEntity.name = 'camera';
    cameraEntity.addComponent('camera', {
        nearClip: 0.1,
        farClip: 128,
        clearColor: new pc.Color(0.0, 0.5, 1.0, 1.0),
        frustumCulling: false
    });
    scene.root.addChild(cameraEntity);

    var cameraComponent = cameraEntity.camera;
    var camera = cameraComponent.camera;



    editor.method('preview:render:material', function(asset, target) {
        // console.log('rendering material', asset.get('name'));

        scene.root.syncHierarchy();

        camera.setAspectRatio(target.height / target.width);
        camera.setRenderTarget(target);

        cameraComponent.frameBegin();
        renderer.render(scene, camera);
        cameraComponent.frameEnd();

        console.log(scene)

        // renderer.render(scene, camera);

        // var material = app.assets.get(asset.get('id'));
        //
        // if (! material.resource)
        //     return;
        //
        // console.log(material.resource.diffuseMap);
        //
        // sphere.material = material.resource;
        //
        // scene._activeCamera = camera;
        //
        // camera.setAspectRatio(target.height / target.width);
        // camera.setRenderTarget(target);
        // camera.getProjectionMatrix();
        // renderer.updateCameraFrustum(camera);
        // renderer.setCamera(camera);
        // renderer.dispatchGlobalLights(scene);
        //
        // console.log(camera, sphere)
        //
        // var oldBlending = device.getBlending();
        // device.setBlending(false);
        //
        // var drawCalls = [ sphere.model.meshInstances[0] ];
        //
        // for(var i = 0; i < drawCalls.length; i++) {
        //     var opChan = 'r';
        //     var meshInstance = drawCalls[i];
        //     if (! meshInstance.command && meshInstance.material) {
        //         var mesh = meshInstance.mesh;
        //         var material = meshInstance.material;
        //
        //         renderer.modelMatrixId.setValue(meshInstance.node.worldTransform.data);
        //
        //         if (! meshInstance._shader[pc.SHADER_FORWARD]) {
        //             meshInstance._shader[pc.SHADER_FORWARD] = material.variants[meshInstance._shaderDefs];
        //             if (! meshInstance._shader[pc.SHADER_FORWARD]) {
        //                 material.updateShader(device, scene, meshInstance._shaderDefs);
        //                 meshInstance._shader[pc.SHADER_FORWARD] = material.variants[meshInstance._shaderDefs] = material.shader;
        //             }
        //         }
        //
        //         device.setShader(meshInstance._shader[pc.SHADER_FORWARD]);
        //
        //         // Uniforms I: material
        //         var parameters = material.parameters;
        //         for (var paramName in parameters) {
        //             var parameter = parameters[paramName];
        //             if (! parameter.scopeId)
        //                 parameter.scopeId = device.scope.resolve(paramName);
        //
        //             parameter.scopeId.setValue(parameter.data);
        //         }
        //
        //         renderer.alphaTestId.setValue(material.alphaTest);
        //
        //         device.setBlending(material.blend);
        //         device.setBlendFunction(material.blendSrc, material.blendDst);
        //         device.setBlendEquation(material.blendEquation);
        //         device.setColorWrite(material.redWrite, material.greenWrite, material.blueWrite, material.alphaWrite);
        //         device.setCullMode(material.cull);
        //         device.setDepthWrite(material.depthWrite);
        //         device.setDepthTest(material.depthTest);
        //         device.setStencilTest(false);
        //
        //         // Uniforms II: meshInstance overrides
        //         var parameters = meshInstance.parameters;
        //         for (var paramName in parameters) {
        //             var parameter = parameters[paramName];
        //             if (! parameter.scopeId)
        //                 parameter.scopeId = device.scope.resolve(paramName);
        //
        //             parameter.scopeId.setValue(parameter.data);
        //         }
        //
        //         var style = meshInstance.renderStyle;
        //
        //         device.setVertexBuffer(mesh.vertexBuffer, 0);
        //         device.setIndexBuffer(mesh.indexBuffer[style]);
        //         device.draw(mesh.primitive[style]);
        //
        //         console.log(material);
        //     }
        // }
        //
        // camera.setRenderTarget(null);
        // device.setBlending(oldBlending);
    });
});
