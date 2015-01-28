pc.extend(pc.designer.graphics, function() {
    // Private members

    function createTextTexture(device, textContext, text) {
        // White background
        textContext.fillStyle = 'rgb(76, 82, 93)';
        textContext.fillRect(0, 0, textContext.canvas.width, textContext.canvas.height);
        textContext.fillStyle = 'rgb(184, 189, 197)';
        textContext.fillRect(5, 5, textContext.canvas.width-10, textContext.canvas.height-10);

        // Write white text with black border
        textContext.fillStyle = 'rgb(76, 82, 93)';
        textContext.lineWidth = 2.5;
        textContext.strokeStyle = 'black';
        textContext.save();
        textContext.font = '50px Verdana';
        textContext.textAlign = 'center';
        textContext.textBaseline = 'middle';
        var leftOffset = textContext.canvas.width / 2;
        var topOffset = textContext.canvas.height / 2;
        textContext.strokeText(text, leftOffset, topOffset);
        textContext.fillText(text, leftOffset, topOffset);
        textContext.restore();

        // Create a texture
        textTexture = new pc.gfx.Texture(device, {
            format: pc.gfx.PIXELFORMAT_R8_G8_B8
        });
        textTexture.minFilter = pc.gfx.FILTER_LINEAR_MIPMAP_LINEAR;
        textTexture.magFilter = pc.gfx.FILTER_LINEAR;
        textTexture.addressU = pc.gfx.ADDRESS_CLAMP_TO_EDGE;
        textTexture.addressV = pc.gfx.ADDRESS_CLAMP_TO_EDGE;
        textTexture.maxAnisotropy = device.maxSupportedMaxAnisotropy;
        textTexture.setSource(textContext.canvas);

        return textTexture;
    }

    // Public Interface
    var ViewCube = function (device) {
        var textCanvas = document.createElement('canvas');
        textCanvas.width = 256;
        textCanvas.height = 128;
        var textContext = textCanvas.getContext("2d");
        if (textContext) {
            var lookAts = [
                { pos: new pc.Vec3(-0.5, 0, 0), target: new pc.Vec3(-1, 0, 0), up: new pc.Vec3(0, -1, 0) },
                { pos: new pc.Vec3(0.5, 0, 0),  target: new pc.Vec3(1, 0, 0),  up: new pc.Vec3(0, -1, 0) },
                { pos: new pc.Vec3(0, 0.5, 0),  target: new pc.Vec3(0, 1, 0),  up: new pc.Vec3(0, 0, 1) },
                { pos: new pc.Vec3(0, -0.5, 0), target: new pc.Vec3(0, -1, 0), up: new pc.Vec3(0, 0, 1) },
                { pos: new pc.Vec3(0, 0, 0.5),  target: new pc.Vec3(0, 0, 1),  up: new pc.Vec3(0, -1, 0) },
                { pos: new pc.Vec3(0, 0, -0.5), target: new pc.Vec3(0, 0, -1), up: new pc.Vec3(0, -1, 0) }
            ];

            this.faces = [
                { name: "LEFT" },
                { name: "RIGHT" },
                { name: "TOP" },
                { name: "BOTTOM" },
                { name: "FRONT" },
                { name: "BACK" }
            ];

            for (var i = 0; i < this.faces.length; i++) {
                var texture = createTextTexture(device, textContext, this.faces[i].name);

                var faceMaterial = new pc.scene.BasicMaterial();
                faceMaterial.color = new pc.Color(1, 1, 1, 0.35);
                faceMaterial.colorMap = texture;
                faceMaterial.blendType = pc.scene.BLEND_NORMAL;
                faceMaterial.depthTest = false;
                faceMaterial.depthWrite = false;
                faceMaterial.update();

                this.faces[i].plane = pc.scene.procedural.createPlane(device);
                var lookAt = new pc.Mat4().setLookAt(lookAts[i].pos, lookAts[i].target, lookAts[i].up);
                var rot = new pc.Mat4().setFromAxisAngle(pc.Vec3.RIGHT, -90);
                this.faces[i].xform = lookAt.mul(rot);
            }
        } else {
            logERROR('Failed to create 2d Context for viewcube');
            this.faces = [];
        }

        this.projMat = new pc.Mat4().setPerspective(30, 1, 0.1, 10);
        this.viewMat = new pc.Mat4();
        this.tempMat1 = new pc.Mat4();
        this.tempMat2 = new pc.Mat4();
    }

    ViewCube.prototype.render = function (transform) {
        var target = device.getRenderTarget();
        device.updateEnd();
        var oldViewport = target.getViewport();
        target.setViewport({
            x: oldViewport.x + (oldViewport.width - 100),
            y: oldViewport.y + (oldViewport.height - 100),
            width: 100,
            height: 100
        });
        device.setRenderTarget(target);
        device.updateBegin();
        var projId = device.scope.resolve("matrix_projection");
        var viewId = device.scope.resolve("matrix_view");
        var viewProjId = device.scope.resolve("matrix_viewProjection");
        var projMat = projId.getValue();
        var viewMat = viewId.getValue();
        var viewProjMat = viewProjId.getValue();

        projId.setValue(this.projMat);
        viewId.setValue(this.viewMat);
        viewProjId.setValue(this.projMat);

        this.tempMat1.copy(viewMat);
        this.tempMat1.data[12] = 0;
        this.tempMat1.data[13] = 0;
        this.tempMat1.data[14] = 0;

        for (var i = 0; i < this.faces.length; i++) {
            this.tempMat2.multiply(this.tempMat1, this.faces[i].xform);
            this.tempMat2.data[14] -= 4;
            this.faces[i].plane.dispatch(this.tempMat2);
        }

        projId.setValue(projMat);
        viewId.setValue(viewMat);
        viewProjId.setValue(viewProjMat);
        
        device.updateEnd();
        target.setViewport(oldViewport);
        device.updateBegin();
    };

    return {
        ViewCube: ViewCube
    }
}());