pc.script.create( "designer_camera", function (app) {
    // Cache systems
    var camsys = app.systems.camera;
    var modelsys = app.systems.model;

    // shared vectors
    var x = new pc.Vec3();
    var y = new pc.Vec3();
    var z = new pc.Vec3();
    var offset = new pc.Vec3();

    var quatX = new pc.Quat();
    var quatY = new pc.Quat();
    var tempRot = new pc.Quat();

    var tempMat = new pc.Mat4();

    // touch constants
    var PAN_TRIGGER_DISTANCE = 6;
    var SCALE_TRIGGER_DISTANCE = 80;
    var ROTATION_TRIGGER_DISTANCE = 1;
    var TOUCH_ZOOM_FACTOR = 0.1;
    var TOUCH_ROTATION_FACTOR = 0.1;


    var DesignerCamera = function (entity) {
        this.entity = entity;

        this.mouse = new pc.Mouse();

        this.mouse.attach(document.body);

        this.mouse.bind(pc.EVENT_MOUSEDOWN, this.onMouseDown.bind(this));
        this.mouse.bind(pc.EVENT_MOUSEMOVE, this.onMouseMove.bind(this));
        this.mouse.bind(pc.EVENT_MOUSEWHEEL, this.onMouseWheel.bind(this));
        this.mouse.bind(pc.EVENT_MOUSEUP, this.onMouseUp.bind(this));

        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));

        this.canvasFocused = false;
        this.rightClickOnCanvas = false;

        // init touch controls if they are available
        this.touch = app.touch;
        if (this.touch) {
            this.touch.bind('touchstart', this.onTouchStart.bind(this));
            this.touch.bind('touchmove', this.onTouch.bind(this));
            this.touch.bind('touchend', this.onTouchEnd.bind(this));

            this.initialCenter = [0,0]; // the center of all the touches when a two-finger touch starts
            this.previousCenter = [0,0]; // the center of all the touches in the previous frame
            this.previousTouch = null; // the one-finger touch in the previous frame
        }

        this.focus = this.entity.focus || new pc.Vec3();

        this.transition = {
            eyeStart: new pc.Vec3(),
            eyeEnd: new pc.Vec3(),
            focusStart: new pc.Vec3(),
            focusEnd: new pc.Vec3(),
            startTime: 0,
            duration: 0.3,
            active: false
        };

        this.frameScale = 10; // This is used to scale dollying to prevent zooming past the object that is framed

        this.flySpeed = new pc.Vec3();
        this.flyFast = false;
        this.flySpeedModifier = 1;
        this.flyDuration = 0;
        this.flyMode = false;
        this.flyModeKeys = {
            65: false, // A
            68: false, // D
            69: false, // E
            81: false, // Q
            83: false, // S
            87: false  // W
        };

        this.isPanning = false;
        this.isOrbiting = false;
        this.isLookingAround = false;

        this.undoTimeout = null;
        this.combineHistory = false;

        this.lowerCaseName = this.entity.getName().toLowerCase();
    };

    DesignerCamera.prototype.destroy = function () {
        this.mouse.detach();
    };

    DesignerCamera.prototype.frameSelection = function (selection) {
        if (!this.flyMode) {
            this.combineHistory = false;
        }

        var model;
        if (selection.model) {
            model = selection.model.model;
        }

        // TODO: Move AABB syncing out to the engine scene manager
        var aabb = new pc.shape.Aabb();
        if (model) {
            var meshInstances = model.meshInstances;
            if (meshInstances.length > 0) {
                meshInstances[0].syncAabb();
                aabb.copy(meshInstances[0].aabb);
                for (var i = 1; i < meshInstances.length; i++) {
                    meshInstances[i].syncAabb();
                    aabb.add(meshInstances[i].aabb);
                }
            }
        } else {
            aabb = new pc.shape.Aabb(selection.getPosition(), new pc.Vec3(5, 5, 5));
        }

        var transition = this.transition;
        transition.focusStart = this.focus.clone();
        transition.focusEnd = aabb.center;
        transition.eyeStart = this.entity.getPosition().clone();

        var vec = new pc.Vec3();
        vec.sub2(transition.focusEnd, transition.focusStart);
        transition.eyeEnd.add2(transition.eyeStart, vec);

        // convert eyeStart and eyeEnd to local coordinates
        tempMat.copy(this.entity.getParent().getWorldTransform()).invert();
        tempMat.transformPoint(transition.eyeStart, transition.eyeStart);
        tempMat.transformPoint(transition.eyeEnd, transition.eyeEnd);

        var averageExtent = (aabb.halfExtents.x + aabb.halfExtents.y + aabb.halfExtents.z) / 3;
        var offset = averageExtent / Math.tan(0.5 * this.entity.camera.fov * Math.PI / 180.0);

        var camWtm = this.entity.getWorldTransform();
        var lookDir = camWtm.getZ();
        lookDir.normalize().scale(offset * 1.5);
        transition.eyeEnd.add2(transition.focusEnd, lookDir);

        if (this.entity.camera.projection === pc.PROJECTION_ORTHOGRAPHIC) {
            transition.orthoHeightStart = this.entity.camera.orthoHeight;
            transition.orthoHeightEnd = averageExtent * 1.1;
            transition.eyeEnd.add2(transition.focusEnd, lookDir.normalize().scale(1000));
        }

        transition.startTime = pc.time.now();
        transition.active = true;
        editor.call('viewport:frameSelectionStart');

        this.frameScale = averageExtent * 50;

        // The next line may seem redundant. However, we're forcing the script's render
        // function to be fired, thereby allowing the next animation step to be scheduled.
        editor.call('viewport:render');
    };

    DesignerCamera.prototype.pan = function(movement) {
        var ltm = this.entity.getLocalTransform();
        var position = this.entity.getLocalPosition();

        ltm.getX(x);
        ltm.getY(y);

        offset.sub2(this.focus, position);

        var factor;
        if (this.entity.camera.projection === pc.PROJECTION_PERSPECTIVE) {
            factor = offset.length() * 0.0022;
        } else {
            factor = offset.length() * this.entity.camera.orthoHeight * 0.0000075;
        }

        var factorX = pc.math.clamp(movement[0], -100.0, 100.0) * factor;
        var factorY = pc.math.clamp(movement[1], -100.0, 100.0) * factor;

        y.scale(factorY);
        x.scale(-factorX);

        position.add(y).add(x);
        this.focus.add(x).add(y);

        this.setCameraProperties({
            position: position,
            focus: this.focus
        });

        editor.call('viewport:render');
    };

    /**
    * @function
    * @name DesignerCamera#dolly
    * @description Dolly the camera along the z-axis of the camera's local transform.
    * The dolly amount is scaled to be a reasonable value for each turn of the mouse wheel and
    * it scales to prevent dollying past the focus if there is one.
    * @param {Number} distance Normalized distance to dolly between -1 and 1.
    */
    DesignerCamera.prototype.dolly = function (distance) {
        // Dolly along the Z axis of the camera's local transform
        var factor = distance * 2.5;

        // transform the focus point to the camera's local space
        var wtm = this.entity.getWorldTransform();
        wtm.invert();
        wtm.transformPoint(this.focus, z);

        // if the focus point is in front of the camera
        // then scale the dolly factor by the distance and the frameScale
        if (z.z < 0) {
            var worldPosition = this.entity.getPosition();
            offset.sub2(this.focus, worldPosition);
            var dis = offset.length();
            factor *= pc.math.clamp(dis * dis / 100000, 0.1, 5);
        }
        // otherwise do not take distance into account so that dollying speed is constant
        else {
            factor *= pc.math.clamp(1 / this.frameScale, 0.1, 5);
        }

        var ltm = this.entity.getLocalTransform();
        ltm.getZ(z);
        z.scale(-factor);

        var position = this.entity.getLocalPosition();
        position.add(z);

        this.setCameraProperties({
            position: position
        });

        editor.call('viewport:render');
    };

    DesignerCamera.prototype.orbit = function (rotation) {
        // orbit around focus point but if a transition is active orbit around
        // transition.focusEnd and change transition.eyeEnd so that we end up at the right place
        // after the transition ends
        var eyePos = this.transition.active ? this.transition.eyeEnd : this.entity.getPosition();
        var focus = this.transition.active ? this.transition.focusEnd : this.focus;
        var targetToEye = new pc.Vec3().sub2(eyePos, focus);

        quatX.setFromAxisAngle(this.entity.right, -rotation[1]);
        quatY.setFromAxisAngle(pc.Vec3.UP, -rotation[0]);
        quatY.mul(quatX);

        quatY.transformVector(targetToEye, targetToEye);

        eyePos.add2(focus, targetToEye);

        tempMat.copy(this.entity.getParent().getWorldTransform()).invert();
        tempMat.transformPoint(eyePos, eyePos);

        quatY.mul(this.entity.getRotation());

        tempRot.copy(this.entity.getParent().getRotation()).invert().mul(quatY);

        this.setCameraProperties({
            position: eyePos,
            rotation: tempRot.getEulerAngles()
        });

        editor.call('viewport:render');
    };

    DesignerCamera.prototype.lookAt = function (rotation) {

        quatY.setFromAxisAngle(pc.Vec3.UP, -rotation[0]);
        quatX.setFromAxisAngle(this.entity.right, -rotation[1]);
        quatY.mul(quatX);

        quatY.mul2(quatY, this.entity.getRotation());

        var targetToEye = new pc.Vec3().sub2(this.focus, this.entity.getPosition());
        var dist = targetToEye.length();
        this.focus.add2(this.entity.getPosition(), this.entity.forward.scale(dist));

        tempRot.copy(this.entity.getParent().getRotation()).invert().mul(quatY);

        this.setCameraProperties({
            rotation: tempRot.getEulerAngles(),
            focus: this.focus
        });

        editor.call('viewport:render');
    };

    DesignerCamera.prototype.updateViewWindow = function (delta) {
        var newHeight = this.entity.camera.orthoHeight - delta;
        if (newHeight < 1) {
            newHeight = 1;
        }

        this.setCameraProperties({
            orthoHeight: newHeight
        });

        editor.call('viewport:render');
    };

    DesignerCamera.prototype.onMouseWheel = function (e) {
        if (e.event.target !== app.graphicsDevice.canvas) {
            return;
        }

        switch (this.entity.camera.projection) {
            case pc.PROJECTION_ORTHOGRAPHIC:
                var delta = e.wheel * 10;
                this.updateViewWindow(delta);
                break;
            case pc.PROJECTION_PERSPECTIVE:
                this.dolly(e.wheel);
                break;
            default:
                break;
        }

        // reset combineHistory flag after a while
        if (this.undoTimeout) {
            clearTimeout(this.undoTimeout);
        }

        this.undoTimeout = setTimeout(function () {
            this.combineHistory = false;
        }.bind(this), 250);
    };

    DesignerCamera.prototype.onMouseUp = function (e) {
        var left = e.buttons[pc.MOUSEBUTTON_LEFT];
        var middle = e.buttons[pc.MOUSEBUTTON_MIDDLE];
        var right = e.buttons[pc.MOUSEBUTTON_RIGHT];

        // remember that we started a right click from inside the canvas
        // to prevent context menu on Windows later
        if (e.button === pc.MOUSEBUTTON_RIGHT && this.canvasFocused) {
            this.rightClickOnCanvas = true;
        }

        if (!left) {
            this.isOrbiting = false;
        }

        if (!left && !middle) {
            this.isPanning = false;
        }

        if (!right) {
            this.isLookingAround = false;
            this.mouse._buttons[pc.MOUSEBUTTON_RIGHT] = false;
        }

        if (!left && !middle && !right) {
            this.combineHistory = false;
            this.canvasFocused = false;

            if (!this.flyMode) {
                app.toggleGizmoInteraction(true);
            }
        }

    };

    DesignerCamera.prototype.onKeyDown = function (e) {
        if (e.target && e.target.tagName.toLowerCase() === 'input') {
            return;
        }

        if (this.isOrbiting || this.isPanning || this.entity.camera.projection === pc.PROJECTION_ORTHOGRAPHIC) {
            return;
        }

        if (this.flyModeKeys[e.which] !== undefined) {
            this.flyModeKeys[e.which] = true;
            this.toggleFlyMode(true);
        }

        if (this.flyMode && (e.which in this.flyModeKeys || e.shiftKey || e.altKey || e.ctrlKey)) {
            this.calculateFlySpeed(e);
        }
    };

    DesignerCamera.prototype.toggleFlyMode = function (toggle) {
        if (this.flyMode !== toggle) {
            this.flyMode = toggle;
            if (toggle) {
                this.flySpeedModifier = 0.1;
                editor.call('viewport:flyModeStart');
                editor.call('viewport:render');
            } else {
                this.flySpeedModifier = 0;
                this.flyDuration = 0;
                editor.call('viewport:flyModeEnd');
            }
        }
    };

    DesignerCamera.prototype.calculateFlySpeed = function (e) {
        var right = 0;
        var forward = 0;
        var up = 0;

        if (this.flyModeKeys['A'.charCodeAt(0)]) {
            right = -1;
        } else if (this.flyModeKeys['D'.charCodeAt(0)]) {
            right = 1;
        }

        if (this.flyModeKeys['W'.charCodeAt(0)]) {
            forward = 1;
        } else if (this.flyModeKeys['S'.charCodeAt(0)]) {
            forward = -1;
        }

        if (this.flyModeKeys['Q'.charCodeAt(0)]) {
            up = -1;
        } else if (this.flyModeKeys['E'.charCodeAt(0)]) {
            up = 1;
        }

        if (e.ctrlKey || e.altKey) {
            this.flySpeedModifier = 0;
            this.flyDuration = 0;
        } else if (e.shiftKey) {
            this.flyFast = true;
        } else {
            this.flyFast = false;
        }

        this.flySpeed.set(right, up, -forward).normalize();
    };

    DesignerCamera.prototype.onKeyUp = function (e) {
        if (e.target && e.target.tagName.toLowerCase() === 'input' || this.entity.camera.projection === pc.PROJECTION_ORTHOGRAPHIC) {
            return;
        }

        if (this.flyModeKeys[e.which] !== undefined) {
            this.flyModeKeys[e.which] = false;

            if (this.flyMode) {
                var disableFlyMode = true;
                for (var key in this.flyModeKeys) {
                    if (this.flyModeKeys[key]) {
                        disableFlyMode = false;
                        break;
                    }
                }

                if (disableFlyMode) {
                    this.toggleFlyMode(false);
                }
            }
        }

        // 16, 17, 18: shift / ctrl / alt keys
        if (this.flyMode && (e.which in this.flyModeKeys || e.which === 16 || e.which === 17 || e.which === 18)) {
            this.calculateFlySpeed(e);
        }
    };

    DesignerCamera.prototype.onMouseDown = function (e) {
        this.canvasFocused = (e.event.target === app.graphicsDevice.canvas);
        this.rightClickOnCanvas = false;
    };

    DesignerCamera.prototype.onMouseMove = function (e) {
        if (!this.canvasFocused || app.activeGizmo.isDragging) {
            return;
        }

        var left = e.buttons[pc.MOUSEBUTTON_LEFT];
        var middle = e.buttons[pc.MOUSEBUTTON_MIDDLE];
        var right = e.buttons[pc.MOUSEBUTTON_RIGHT];
        var isOrtho = (this.entity.camera.projection === pc.PROJECTION_ORTHOGRAPHIC);

        if (!this.flyMode && !this.isOrbiting && !this.isLookingAround && (middle || (left && (e.shiftKey || isOrtho)))) {
            this.pan([e.dx, e.dy]);
            this.isPanning = true;
            app.toggleGizmoInteraction(false);
        } else if (!isOrtho) {
            if (!this.flyMode && !this.isPanning && !this.isLookingAround && left) {
                this.orbit([pc.math.RAD_TO_DEG*e.dx/300.0, pc.math.RAD_TO_DEG*e.dy/300.0]);
                this.isOrbiting = true;
                app.toggleGizmoInteraction(false);
            } else if (!this.isOrbiting && !this.isPanning && right) {
                this.lookAt([pc.math.RAD_TO_DEG*e.dx/300.0, pc.math.RAD_TO_DEG*e.dy/300.0]);
                this.isLookingAround = true;
                app.toggleGizmoInteraction(false);
            }
        }
    };


    DesignerCamera.prototype.onTouchStart = function (e) {
        if (e.touches.length === 2) {
            this.initialFingerDistance = this.calculateDistanceBetweenTouches(e.touches[0], e.touches[1]);
            this.previousFingerDistance = 0;
            this.calculateCenterOfTouches(e.touches[0], e.touches[1], this.initialCenter);
            this.copyCenter(this.initialCenter, this.previousCenter);
            this.isZooming = false;
            this.isPanning = false;
        } else if (e.touches.length === 1) {
            this.previousTouch = e.touches[0];
        }
    };

    DesignerCamera.prototype.calculateDistanceBetweenTouches = function (touch1, touch2) {
        var x = touch1.x - touch2.x;
        var y = touch1.y - touch2.y;
        return Math.sqrt(x*x + y*y);
    };

    DesignerCamera.prototype.calculateCenterOfTouches = function (touch1, touch2, result) {
        result[0] = (touch1.x + touch2.x)/2;
        result[1] = (touch1.y + touch2.y)/2;
    };

    DesignerCamera.prototype.calculateCenterDistance = function (center1, center2) {
        var x = center1[0] - center2[0];
        var y = center1[1] - center2[1];
        return Math.sqrt(x*x + y*y);
    };

    DesignerCamera.prototype.copyCenter = function (from, to) {
        to[0] = from[0];
        to[1] = from[1];
    };

    DesignerCamera.prototype.onTouch = function (e) {
        if (e.touches.length == 2) {
            this.handleTwoFingerTouch(e);
        } else if (e.touches.length == 1) {
            this.handleOneFingerTouch(e);
        }
    };

    DesignerCamera.prototype.handleOneFingerTouch = function (e) {
        var dx = 0; dy = 0;
        var fingerDistance = 0;
        var touch = e.touches[0];

        fingerDistance = this.calculateDistanceBetweenTouches(touch, this.previousTouch);

        if (fingerDistance > ROTATION_TRIGGER_DISTANCE) {

            // calculate the different between this touch and the previous
            dx = touch.x - this.previousTouch.x;
            dy = touch.y - this.previousTouch.y;

            this.orbit([dx*TOUCH_ROTATION_FACTOR, dy*TOUCH_ROTATION_FACTOR]);
        }

        this.previousTouch = touch;

        e.event.preventDefault();
        e.event.stopPropagation();
    };

    DesignerCamera.prototype.handleTwoFingerTouch = function (e) {
        var i;
        var dx = 0; dy = 0, ds = 0;
        var touch1 = e.touches[0];
        var touch2 = e.touches[1];

        // calculate center point of all touches for pan
        var center = [];
        this.calculateCenterOfTouches(touch1, touch2, center);
        var centerDistance = this.calculateCenterDistance(center, this.initialCenter);

        // calculate finger distance for pinch zoom
        var fingerDistance = this.calculateDistanceBetweenTouches(e.touches[0], e.touches[1]);
        var fingerDistanceSinceStart = Math.abs(fingerDistance - this.initialFingerDistance);

        // if we are already zooming or if the fingers have separated enough since the beginning of the touch e
        // then scale
        if (this.isZooming || fingerDistanceSinceStart > SCALE_TRIGGER_DISTANCE) {
            ds = fingerDistance - this.previousFingerDistance;
            this.isZooming = true;

            switch (this.entity.camera.projection) {
                case pc.scene.Projection.ORTHOGRAPHIC:
                    var delta = ds*TOUCH_ZOOM_FACTOR * 10;
                    this.updateViewWindow(delta);
                    break;
                case pc.scene.Projection.PERSPECTIVE:
                    this.dolly(ds*TOUCH_ZOOM_FACTOR);
                    break;
            }
        }
        // otherwise if we are already panning or
        // the center of all the touches has moved enough then pan
        else if (this.isPanning || centerDistance > PAN_TRIGGER_DISTANCE) {
            this.isPanning = true;
            dx = center[0] - this.previousCenter[0];
            dy = center[1] - this.previousCenter[1];
            this.pan([dx, dy]);
        }
        this.copyCenter(center, this.previousCenter);
        this.previousFingerDistance = fingerDistance;

        e.event.preventDefault();
        e.event.stopPropagation();
    };

    DesignerCamera.prototype.onTouchEnd = function (e) {
        if (e.touches.length === 1) {
            // if a finger was raised then reset the previous touch
            this.previousTouch = e.touches[0];
        } else if (e.touches.length === 0) {
            this.combineHistory = false;
        }
    };

    DesignerCamera.prototype.toolsUpdate = function (dt) {
        // Ideally this would be done in an update function but udpate isn't called in the Designer
        var transition = this.transition;
        if (transition.active) {
            var elapsed = (pc.time.now() - transition.startTime) / 1000;
            if (elapsed > transition.duration) {
                transition.active = false;
                elapsed = transition.duration;
                editor.call('viewport:frameSelectionEnd');
            }

            var eyePos = new pc.Vec3();
            var alpha = pc.math.smootherstep(0, 1, elapsed / transition.duration);
            eyePos.lerp(transition.eyeStart, transition.eyeEnd, alpha);
            this.focus.lerp(transition.focusStart, transition.focusEnd, alpha);

            var data = {
                position: eyePos,
                focus: this.focus
            };

            if (this.entity.camera.projection === pc.PROJECTION_ORTHOGRAPHIC) {
                data.orthoHeight = pc.math.lerp(transition.orthoHeightStart, transition.orthoHeightEnd, alpha);
            }

            this.setCameraProperties(data);

            editor.call('viewport:render');

            if (!transition.active) {
                this.combineHistory = false;
            }
        } else {
            if (this.flyMode) {
                var pos = this.entity.getLocalPosition();

                offset.copy(this.flySpeed);

                // transform offset with camera transform
                this.entity.getWorldTransform().transformVector(offset, offset);

                // increase speed while keys are held down
                if (this.flySpeedModifier > 0) {
                    this.flyDuration += dt;
                    if (this.flyDuration > 2) {
                        this.flySpeedModifier += dt * 0.3;
                    }
                }

                offset.scale(this.flySpeedModifier);
                if (this.flyFast) {
                    offset.scale(3);
                }


                pos.add(offset);
                this.focus.add(offset);

                this.setCameraProperties({
                    position: pos,
                    focus: this.focus
                });

                editor.call('viewport:render');
            }
        }
    };

    DesignerCamera.prototype.setCameraProperties = function (data) {
        if (this.undoTimeout) {
            clearTimeout(this.undoTimeout);
            this.undoTimeout = null;
        }

        if (app.isUserCamera(this.entity)) {
            var entity = editor.call('entities:get', this.entity.getGuid());
            if (entity) {
                var pos = this.entity.getLocalPosition();
                var oldPosition = [pos.x, pos.y, pos.z];

                var rot = this.entity.getLocalEulerAngles();
                var oldRotation = [rot.x, rot.y, rot.z];

                var oldOrthoHeight = this.entity.camera.orthoHeight;

                var newPosition = data.position ? [data.position.x, data.position.y, data.position.z] : oldPosition;
                var newRotation = data.rotation ? [data.rotation.x, data.rotation.y, data.rotation.z] : oldRotation;
                var newOrthoHeight = data.orthoHeight !== undefined ? data.orthoHeight : oldOrthoHeight;

                // set entity position / rotation / orthoHeight as one undoable action
                var action = {
                    name: 'entity.' + this.entity.getGuid() + '.designercamera',
                    combine: this.combineHistory,
                    undo: function () {
                        var historyEnabled = entity.history.enabled;
                        entity.history.enabled = false;
                        entity.set('position', oldPosition);
                        entity.set('rotation', oldRotation);
                        entity.set('components.camera.orthoHeight', oldOrthoHeight);
                        entity.history.enabled = historyEnabled;
                    }.bind(this),
                    redo: function () {
                        var historyEnabled = entity.history.enabled;
                        entity.history.enabled = false;
                        entity.set('position', newPosition);
                        entity.set('rotation', newRotation);
                        entity.set('components.camera.orthoHeight', newOrthoHeight);
                        entity.history.enabled = historyEnabled;

                    }.bind(this)
                };

                // raise history event
                if (this.combineHistory) {
                    entity.history.emit('record', 'update', action);
                } else {
                    entity.history.emit('record', 'add', action);
                }

                var historyEnabled = entity.history.enabled;
                entity.history.enabled = false;

                // set the properties to the camera entity
                if (data.position !== undefined) {
                    entity.set('position', newPosition);
                }

                if (data.rotation !== undefined) {
                    entity.set('rotation', newRotation);
                }

                if (data.orthoHeight !== undefined) {
                    entity.set('components.camera.orthoHeight', newOrthoHeight);
                }
                entity.history.enabled = historyEnabled;

                // combine events from now on until this becomes false again
                this.combineHistory = true;
            }
        } else {
            var userdata = editor.call('userdata');
            if (data.position !== undefined) {
                this.entity.setLocalPosition(data.position);
                userdata.set('cameras.' + this.lowerCaseName + '.position', [data.position.x.toFixed(4), data.position.y.toFixed(4), data.position.z.toFixed(4)]);
            }

            if (data.rotation !== undefined) {
                this.entity.setLocalEulerAngles(data.rotation);
                userdata.set('cameras.' + this.lowerCaseName + '.rotation', [data.rotation.x.toFixed(4), data.rotation.y.toFixed(4), data.rotation.z.toFixed(4)]);
            }

            if (data.orthoHeight !== undefined) {
                this.entity.camera.orthoHeight = data.orthoHeight;
                userdata.set('cameras.' + this.lowerCaseName + '.orthoHeight', data.orthoHeight.toFixed(4));
            }

            if (data.focus !== undefined) {
                userdata.set('cameras.' + this.lowerCaseName + '.focus', [data.focus.x.toFixed(4), data.focus.y.toFixed(4), data.focus.z.toFixed(4)]);
            }
        }
    };

    DesignerCamera.prototype.destroy = function () {
        this.mouse.detach(document.body);
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
    };

    return DesignerCamera;
});
