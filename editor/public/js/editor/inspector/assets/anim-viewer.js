Object.assign(
    pcui,
    (function () {
        "use strict";

        class Skeleton {
            static _boneVertex = new pc.Vec3();

            static _unitVector = new pc.Vec3(0, 1, 0);

            static _rotationMatrix = new pc.Mat4();

            static _unitBone = [
                [0, 0, 0], [-0.5, 0.3, 0],
                [0, 0, 0], [0.5, 0.3, 0],
                [0, 0, 0], [0, 0.3, -0.5],
                [0, 0, 0], [0, 0.3, 0.5],
                [0, 1, 0], [-0.5, 0.3, 0],
                [0, 1, 0], [0.5, 0.3, 0],
                [0, 1, 0], [0, 0.3, -0.5],
                [0, 1, 0], [0, 0.3, 0.5],
                [0, 0.3, -0.5], [0.5, 0.3, 0],
                [0.5, 0.3, 0], [0, 0.3, 0.5],
                [0, 0.3, 0.5], [-0.5, 0.3, 0],
                [-0.5, 0.3, 0], [0, 0.3, -0.5]
            ];

            constructor(app, entity, color) {
                this._app = app;
                this._entity = entity;

                this._vertexCount = 0;

                this._vertexFormat = new pc.VertexFormat(this._app.graphicsDevice, [
                    { semantic: pc.SEMANTIC_POSITION, components: 3, type: pc.TYPE_FLOAT32 },
                    { semantic: pc.SEMANTIC_COLOR, components: 4, type: pc.TYPE_UINT8, normalize: true }
                ]);

                const mesh = new pc.Mesh();
                mesh.vertexBuffer = new pc.VertexBuffer(this._app.graphicsDevice, this._vertexFormat, 1024 * 2, pc.BUFFER_DYNAMIC);
                mesh.primitive[0].type = pc.PRIMITIVE_LINES;
                mesh.primitive[0].base = 0;
                mesh.primitive[0].indexed = false;
                this._mesh = mesh;

                const material = new pc.BasicMaterial();
                material.blendType = pc.BLEND_NORMAL;
                material.depthTest = false;
                material.color = color || new pc.Color(1, 0.4, 0, 1);
                material.update();
                this._material = material;

                this._meshInstance = new pc.MeshInstance(mesh, material, new pc.GraphNode());
                this._boundingBox = new pc.BoundingBox(new pc.Vec3(), new pc.Vec3(0.1, 0.1, 0.1));
            }

            setColor(color) {
                this._material.color = color;
                this._material.update();
            }

            get meshInstance() {
                return this._meshInstance;
            }

            get boundingBox() {
                return this._boundingBox;
            }

            _createBone(v0, v1) {
                // generate bone transform
                const boneLength = v0.clone().sub(v1).length();
                const boneDirection = v0.clone().sub(v1).normalize();

                const angle = Math.acos(Skeleton._unitVector.dot(boneDirection)) * pc.math.RAD_TO_DEG;
                const axis = new pc.Vec3().cross(new pc.Vec3(0, 1, 0), boneDirection).normalize();
                Skeleton._rotationMatrix.setFromAxisAngle(axis, angle);

                const vertexData = new Float32Array(this._mesh.vertexBuffer.lock());
                const colorData = new Uint32Array(this._mesh.vertexBuffer.lock());

                for (let i = 0; i < Skeleton._unitBone.length; i++) {
                    let boneVertex = Skeleton._boneVertex.set(...Skeleton._unitBone[i]);
                    // scale
                    boneVertex.mul(new pc.Vec3(boneLength * 0.3, -boneLength, boneLength * 0.3));
                    // rotate
                    boneVertex = Skeleton._rotationMatrix.transformPoint(boneVertex);
                    // translate
                    boneVertex.add(v0);
                    // add to data
                    vertexData[this._vertexCount * 4 + 0] = boneVertex.x;
                    vertexData[this._vertexCount * 4 + 1] = boneVertex.y;
                    vertexData[this._vertexCount * 4 + 2] = boneVertex.z;
                    colorData[this._vertexCount * 4 + 3] = 0xFFFFFFFF;
                    this._vertexCount++;
                }

                // update bounding box
                this._boundingBox.add(new pc.BoundingBox(v1, new pc.Vec3(0.1, 0.1, 0.1)));
            }

            update() {
                if (!this._entity.children || this._entity.children.length === 0) return;
                this._vertexCount = 0;
                this._boundingBox = new pc.BoundingBox(new pc.Vec3(), new pc.Vec3(0.1, 0.1, 0.1));
                this._entity.children.forEach((c) => {
                    this._createSkeleton(c);
                });
                if (this._vertexCount === 0) {
                    this._meshInstance.visible = false;
                } else {
                    this._meshInstance.cull = false;
                    this._meshInstance.visible = true;
                    this._mesh.vertexBuffer.unlock();
                    this._mesh.primitive[0].count = this._vertexCount;
                }
            }

            _createSkeleton(entity) {
                entity.children.forEach((c) => {
                    if (![entity.name, c.name].includes('RootNode')) {
                        this._createBone(entity.getPosition(), c.getPosition());
                    }
                    this._createSkeleton(c);
                });
            }
        }

        class AnimViewer extends pcui.Container {
            constructor(args) {
                super(args);

                this.dom.classList.add("anim-viewer");

                this._canvas = new pcui.Canvas({
                    useDevicePixelRatio: true
                });
                this.append(this._canvas);
                this._app = args.app;

                this._layer = new pc.Layer({
                    id: -1,
                    enabled: true,
                    opaqueSortMode: 2,
                    transparentSortMode: 3
                });
                this._frontLayer = new pc.Layer({
                    id: -2,
                    enabled: true,
                    opaqueSortMode: 2,
                    transparentSortMode: 3
                });
                this._layerComposition = new pc.LayerComposition("anim-viewer");
                this._layerComposition.push(this._layer);
                this._layerComposition.push(this._frontLayer);

                this._entity = null;
                this._renderTarget = null;
                this._showSkeleton = true;
                this._showModel = true;
                this._renderComponents = [];

                this._root = new pc.Entity("root");
                this._root._enabledInHierarchy = true;
                this._root.enabled = true;

                // create camera entity
                this._cameraOrigin = new pc.Entity("cameraOrigin");
                this._camera = new pc.Entity("camera");
                this._camera.addComponent("camera", {
                    clearColor: new pc.Color(41 / 255, 53 / 255, 56 / 255),
                    layers: [-1, -2]
                });
                this._camera.setPosition(0, 0, 3);
                this._cameraOrigin.addChild(this._camera);
                this._root.addChild(this._cameraOrigin);
                this._rotationX = -15;
                this._rotationY = 45;

                // create directional light entity
                this._light = new pc.Entity("light");
                this._light.addComponent("light", {
                    type: "directional",
                    layers: []
                });
                this._light.setPosition(0, 0.5, 3);
                this._light.setLocalEulerAngles(45, 135, 0);
                this._root.addChild(this._light);
                // this._light.setEulerAngles(45, 0, 0);

                this._root.syncHierarchy();

                this._playing = true;

                // create UI
                this.createUIContainer();

                this._messageLabel = new pcui.Label({
                    class: 'message-label',
                    text: ''
                });
                this.dom.append(this._messageLabel.dom);
                this._messageLabel.hidden = true;

                // listen for mouse events
                let mouseDown = false;
                this._canvas.dom.addEventListener("mousedown", (e) => {
                    if (e.button === 0) {
                        mouseDown = true;
                    }
                });
                window.addEventListener("mouseup", (e) => {
                    if (e.button === 0) {
                        mouseDown = false;
                    }
                });
                window.addEventListener("mousemove", (e) => {
                    if (mouseDown) {
                        this._rotationX = Math.min(
                            Math.max(this._rotationX + -e.movementY * 0.3, -90),
                            90
                        );
                        this._rotationY += -e.movementX * 0.3;
                        requestAnimationFrame(() => this.render(0));
                    }
                });
            }

            displayMessage(text) {
                this._messageLabel.text = text;
                this._messageLabel.hidden = false;
                this.dom.classList.add('hide');
                this.clearView();
            }

            hideMessage() {
                this._messageLabel.hidden = true;
                this.dom.classList.remove('hide');
            }

            _setPlaying() {
                this._playing = true;
                this._playButton.text = "Pause";
            }

            _setPaused() {
                this._playing = false;
                this._playButton.text = "Play";
            }

            get showSkeleton() {
                return this._showSkeleton;
            }

            set showSkeleton(value) {
                this._showSkeleton = value;
                if (!this._playing) {
                    this.render(0);
                }
            }

            get showModel() {
                return this._showModel;
            }

            set showModel(value) {
                this._showModel = value;
                if (!this._playing) {
                    this.render(0);
                }
            }

            createUIContainer() {
                this._uiContainer = new pcui.Container({
                    class: "anim-viewer-ui-container"
                });

                this._playButton = new pcui.Button({
                    class: "anim-viewer-play-button",
                    text: "Pause"
                });

                this._playButton.on("click", () => {
                    if (this._playing) {
                        this._setPaused();
                    } else {
                        this._setPlaying();
                    }
                });
                this._uiContainer.append(this._playButton);

                this._slider = new pcui.SliderInput({
                    class: "anim-viewer-slider",
                    value: 0,
                    min: 0,
                    max: 1
                });

                this._slider.on("change", (value) => {
                    if (this._suppressSliderChange) return;
                    this._playing = true;
                    if (this._entity) this._entity.anim.baseLayer.activeStateCurrentTime = value;
                    this.render(0);
                    this._setPaused();
                });
                this._uiContainer.append(this._slider);
                this.append(this._uiContainer);
            }

            createRenderTarget() {
                this._width =
                    this._canvas.dom.offsetParent.offsetWidth * this._canvas.pixelRatio;
                this._height =
                    this._canvas.dom.offsetParent.offsetHeight * this._canvas.pixelRatio;
                this._canvas.width = this._width / this._canvas.pixelRatio;
                this._canvas.height = this._height / this._canvas.pixelRatio;

                const width = this._width;
                const height = this._height;

                const texture = new pc.Texture(this._app.graphicsDevice, {
                    width: width,
                    height: height,
                    format: pc.PIXELFORMAT_R8_G8_B8_A8
                });

                const target = new pc.RenderTarget({
                    name: 'AnimViewerRT',
                    colorBuffer: texture
                });

                target.buffer = new ArrayBuffer(width * height * 4);
                target.pixels = new Uint8Array(target.buffer);
                target.pixelsClamped = new Uint8ClampedArray(target.buffer);

                return target;
            }

            clearView() {
                this._animTrack = null;
                this._skeleton = null;
                this._entity = null;
                this._setPaused();
                if (this._uiContainer) {
                    this._uiContainer.disabled = true;
                    this._slider.value = 0;
                    this._slider.sliderMax = 1;
                }
            }

            loadView(animTrack, entity) {
                if (!animTrack) {
                    this.displayMessage("No animation track provided.");
                    return;
                } else if (!entity) {
                    this.displayMessage("No entity provided.");
                    return;
                }
                this.hideMessage();

                this._animTrack = animTrack;
                this._skeleton = null;
                if (entity && entity.model) {
                    this._entity = new pc.Entity("entity");
                    this._entity.addComponent("model", {
                        type: "asset"
                    });
                    this._entity.model.asset = entity.model.asset;
                } else {
                    this._entity = entity;
                }


                this._entity.removeComponent("anim");
                this._entity.addComponent("anim", {
                    activate: true
                });
                this._entity.anim.rootBone = this._entity;
                this._entity.anim.assignAnimation("preview", animTrack);
                this._entity.enabled = true;

                if (this._uiContainer) {
                    this._uiContainer.disabled = false;
                    this._slider.value = 0;
                    this._slider.max = animTrack.duration;
                    this._slider.sliderMax = animTrack.duration;
                }

                // set camera
                if (entity && entity.model) {
                    this._entityMeshInstances = this._entity.model.meshInstances;
                } else if (entity) {
                    this._renderComponents = [];
                    const getHierarchyRenderComponents = (entity) => {
                        if (entity.render) {
                            this._renderComponents.push(entity.render);
                        }
                        entity.children.forEach((child) => {
                            getHierarchyRenderComponents(child);
                        });
                    };
                    getHierarchyRenderComponents(this._entity);
                    this._renderComponents.forEach((render) => {
                        render._cloneSkinInstances();
                    });
                }

                let color;
                if (this._renderComponents.length > 0 || this._entity.model && this._entity.model.meshInstances.length > 0) {
                    color = new pc.Color(1, 1, 1, 0.5);
                    this._skeleton = new Skeleton(this._app, this._entity, color);
                } else {
                    this._skeleton = new Skeleton(this._app, this._entity);
                }

                this._setupCamera = true;

                this._setPlaying();

                this._lastTime = null;

                this._renderTarget = this.createRenderTarget();

                // begin render loop
                const renderStep = (time) => {
                    if (time <= this._lastTime) return;
                    if (!this._lastTime) {
                        this.render(1 / 60);
                    } else {
                        const dt = (time - this._lastTime) / 1000;
                        if (this._playing && !this.hidden) {
                            this.render(dt);
                        }
                    }
                    this._lastTime = time;
                    this._suppressSliderChange = true;
                    if (this._playing && this._entity.anim.baseLayer.activeStateProgress === 1) {
                        this._slider.value = 1;
                    } else if (this._playing) {
                        if (
                            this._entity.anim.baseLayer.activeStateDuration >
                            (1 / 60) * 5
                        ) {
                            this._slider.value =
                                this._entity.anim.baseLayer.activeStateCurrentTime % this._entity.anim.baseLayer.activeStateDuration;
                        }
                    }
                    this._suppressSliderChange = false;
                    requestAnimationFrame(renderStep);
                };
                requestAnimationFrame(renderStep);
            }

            render(dt) {
                if (this._entity) this._entity.anim.layers[0].update(dt);


                if (this._skeleton && this._showSkeleton) {
                    this._skeleton.update();
                    this._frontLayer.addMeshInstances([this._skeleton.meshInstance]);

                    if (this._renderComponents.length > 0 || this._entity.model && this._entity.model.meshInstances.length > 0) {
                        if (this._showModel) {
                            this._skeleton.setColor(new pc.Color(1, 1, 1, 0.5));
                        } else {
                            this._skeleton.setColor(new pc.Color(1, 0.4, 0, 1));
                        }
                    }
                }

                if (this._setupCamera) {
                    if (!this._showSkeleton) {
                        this._skeleton.update();
                    }
                    this._cameraOrigin.setLocalPosition(0, this._skeleton.boundingBox.center.y, 0);
                    this._rotationX = -15;
                    this._rotationY = 45;
                    this._cameraOrigin.setLocalEulerAngles(
                        this._rotationX,
                        this._rotationY,
                        0
                    );

                    this._camera.setLocalPosition(0, 0, Math.max(...this._skeleton.boundingBox.halfExtents.data) * 3.5);
                    this._setupCamera = false;
                }

                // update scene
                this._cameraOrigin.setLocalEulerAngles(
                    this._rotationX,
                    this._rotationY,
                    0
                );
                this._light.setLocalRotation(this._cameraOrigin.getLocalRotation());
                this._light.rotateLocal(90, 0, 0);

                this._layer.renderTarget = this._renderTarget;
                this._frontLayer.renderTarget = this._renderTarget;

                if (this._showModel && this._entityMeshInstances) {
                    this._layer.addMeshInstances(this._entityMeshInstances);
                }
                if (this._showModel && this._renderComponents) {
                    this._renderComponents.forEach((render) => {
                        render.meshInstances.forEach((meshInstance) => {
                            if (meshInstance.skinInstance) {
                                meshInstance.skinInstance.updateMatrices(meshInstance.node);
                            }
                        });
                        this._layer.addMeshInstances(render.meshInstances);
                    });
                }

                this._layer.addLight(this._light.light);
                this._layer.addCamera(this._camera.camera);
                this._frontLayer.addCamera(this._camera.camera);

                // disable fog
                const backupFogType = this._app.scene.fog;
                this._app.scene.fog = pc.FOG_NONE;

                const backupAmbientLight = this._app.scene.ambientLight;
                this._app.scene.ambientLight = new pc.Color(0.5, 0.5, 0.5);

                this._app.renderComposition(this._layerComposition);

                this._app.scene.ambientLight = backupAmbientLight;

                // restore fog settings
                this._app.scene.fog = backupFogType;

                const width = this._width;
                const height = this._height;

                this._camera.camera.aspectRatio = height / width;

                // read pixels from texture
                var device = this._app.graphicsDevice;
                device.gl.bindFramebuffer(
                    device.gl.FRAMEBUFFER,
                    this._renderTarget._glFrameBuffer
                );
                device.gl.readPixels(
                    0,
                    0,
                    width,
                    height,
                    device.gl.RGBA,
                    device.gl.UNSIGNED_BYTE,
                    this._renderTarget.pixels
                );

                // render to canvas
                const ctx = this._canvas.dom.getContext("2d");
                ctx.putImageData(
                    new ImageData(this._renderTarget.pixelsClamped, width, height),
                    (this._canvas.width * this._canvas.pixelRatio - width) / 2,
                    (this._canvas.height * this._canvas.pixelRatio - height) / 2
                );

                this._layer.removeLight(this._light.light);
                this._layer.removeCamera(this._camera.camera);
                this._frontLayer.removeCamera(this._camera.camera);
                if (this._showModel && this._entityMeshInstances) {
                    this._layer.removeMeshInstances(this._entityMeshInstances);
                }
                if (this._showModel && this._renderComponents) {
                    this._renderComponents.forEach((render) => {
                        this._layer.removeMeshInstances(render.meshInstances);
                    });
                }
                if (this._skeleton && this._showSkeleton) {
                    this._frontLayer.removeMeshInstances([this._skeleton.meshInstance]);
                }

                this._layer.renderTarget = null;
            }
        }

        return {
            AnimViewer: AnimViewer
        };
    })()
);
