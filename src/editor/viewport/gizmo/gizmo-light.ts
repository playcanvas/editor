import type { EventHandle } from '@playcanvas/observer';
import {
    BlendState,
    BLENDEQUATION_ADD,
    BLENDMODE_ONE_MINUS_SRC_ALPHA,
    BLENDMODE_SRC_ALPHA,
    Color,
    Entity,
    LIGHTSHAPE_DISK,
    LIGHTSHAPE_PUNCTUAL,
    LIGHTSHAPE_RECT,
    LIGHTSHAPE_SPHERE,
    math,
    Mesh,
    MeshInstance,
    PRIMITIVE_LINES,
    SEMANTIC_ATTR15,
    ShaderMaterial,
    type AppBase,
    type GraphicsDevice,
    type Material
} from 'playcanvas';

import { GIZMO_MASK } from '@/core/constants';
import type { EntityObserver } from '@/editor-api';

import { createColorMaterial } from '../viewport-color-material';

editor.once('load', () => {
    let app;
    // selected entity gizmos
    let entities = { };
    // pool of gizmos
    const pool = [];

    const CIRCLE_SEGMENTS = 72;

    // colors
    const colorBehind = new Color(1, 1, 1, 0.5);
    const colorPrimary = new Color(1, 1, 1);
    let container;
    let material, materialBehind, materialSpot, materialSpotBehind;

    // per-type mesh + front/back material configuration
    type MeshConfig = { mesh: Mesh; matFront: Material; matBack: Material };
    const meshConfigs: Record<string, MeshConfig> = {};

    const layerFront = editor.call('gizmo:layers', 'Bright Gizmo');
    const layerBack = editor.call('gizmo:layers', 'Dim Gizmo');

    // map of area-light shape constants to gizmo type names
    const areaShapeToType: Record<number, string> = {
        [LIGHTSHAPE_RECT]: 'rectangle',
        [LIGHTSHAPE_DISK]: 'disk',
        [LIGHTSHAPE_SPHERE]: 'sphere'
    };

    // derive which gizmo mesh to draw for a given light at the current camera distance
    const getGizmoType = (light: any, distanceToCamera: number): string => {
        if (light.shape !== LIGHTSHAPE_PUNCTUAL) {
            return areaShapeToType[light.shape] ?? light.type;
        }
        if (light.type === 'point' && distanceToCamera < light.range) {
            return 'pointclose';
        }
        return light.type;
    };

    // appends CIRCLE_SEGMENTS line segments (2 vertices each) forming a circle in the
    // selected plane to positions. The perpendicular axis can be offset by axisOffset.
    // If outers is provided, outerValue is pushed twice per segment to match.
    const pushCircle = (
        positions: number[],
        radius: number,
        plane: 'xy' | 'xz' | 'yz',
        axisOffset = 0,
        outers: number[] | null = null,
        outerValue = 0
    ) => {
        const factor = 360 / CIRCLE_SEGMENTS * math.DEG_TO_RAD;
        for (let i = 0; i < CIRCLE_SEGMENTS; i++) {
            const s0 = Math.sin(factor * i) * radius;
            const c0 = Math.cos(factor * i) * radius;
            const s1 = Math.sin(factor * (i + 1)) * radius;
            const c1 = Math.cos(factor * (i + 1)) * radius;
            switch (plane) {
                case 'xy':
                    positions.push(s0, c0, axisOffset, s1, c1, axisOffset);
                    break;
                case 'xz':
                    positions.push(s0, axisOffset, c0, s1, axisOffset, c1);
                    break;
                case 'yz':
                    positions.push(axisOffset, c0, s0, axisOffset, c1, s1);
                    break;
            }
            if (outers) {
                outers.push(outerValue, outerValue);
            }
        }
    };

    // creates an entity with a render component assigned to a single layer
    const makeLayerEntity = (layerId: number): Entity => {
        const entity = new Entity();
        entity.addComponent('render', {
            castShadows: false,
            layers: [layerId]
        });
        return entity;
    };

    // creates a fresh [front, behind] mesh instance pair for a given gizmo type
    const createMeshInstancesForType = (type: string): [MeshInstance, MeshInstance] => {
        const config = meshConfigs[type];

        const front = new MeshInstance(config.mesh, config.matFront);
        front.mask = GIZMO_MASK;
        front.pick = false;

        const behind = new MeshInstance(config.mesh, config.matBack);
        behind.mask = GIZMO_MASK;
        behind.pick = false;

        return [front, behind];
    };

    // gizmo class
    class Gizmo {
        _link: EntityObserver | null = null;

        events: EventHandle[] = [];

        type = '';

        // outer entity carrying the primary (bright) mesh instance, rendered
        // into the 'Bright Gizmo' layer before scene geometry
        entity: Entity | null = null;

        // child entity carrying the behind (dim) mesh instance, rendered into
        // the 'Dim Gizmo' layer after scene geometry with the depth buffer cleared
        entityBehind: Entity | null = null;

        // update lines
        update() {
            if (!app) {
                return;
            } // webgl not available

            if (!this._link || !this._link.entity) {
                return;
            }

            const light = this._link.entity.light;
            this.entity.enabled = !!(light && light.enabled && this._link.entity.enabled);
            if (!this.entity.enabled) {
                return;
            }

            this.entity.setPosition(this._link.entity.getPosition());

            const cameraPos = editor.call('camera:current').getPosition();
            const type = getGizmoType(light, this.entity.getPosition().distance(cameraPos));

            if (this.type !== type) {
                this.type = type;

                // set new mesh instances based on type
                if (meshConfigs[this.type]) {
                    const [front, behind] = createMeshInstancesForType(this.type);
                    this.entity.render.meshInstances = [front];
                    this.entityBehind.render.meshInstances = [behind];
                    this.entity.setLocalScale(1, 1, 1);
                    this.entity.setEulerAngles(0, 0, 0);
                } else {
                    this.entity.render.meshInstances = [];
                    this.entityBehind.render.meshInstances = [];
                    this.entity.enabled = false;
                    return;
                }
            }

            switch (this.type) {
                case 'directional':
                    this.entity.setRotation(this._link.entity.getRotation());
                    break;
                case 'point':
                    this.entity.setLocalScale(light.range, light.range, light.range);
                    this.entity.lookAt(cameraPos);
                    break;
                case 'pointclose':
                    this.entity.setLocalScale(light.range, light.range, light.range);
                    break;
                case 'spot': {
                    this.entity.setRotation(this._link.entity.getRotation());
                    const front = this.entity.render.meshInstances[0];
                    const behind = this.entityBehind.render.meshInstances[0];
                    front.setParameter('range', light.range);
                    front.setParameter('innerAngle', light.innerConeAngle);
                    front.setParameter('outerAngle', light.outerConeAngle);
                    behind.setParameter('range', light.range);
                    behind.setParameter('innerAngle', light.innerConeAngle);
                    behind.setParameter('outerAngle', light.outerConeAngle);
                    break;
                }
                case 'rectangle':
                case 'disk':
                case 'sphere':
                    this.entity.setRotation(this._link.entity.getRotation());
                    this.entity.setLocalScale(this._link.entity.getLocalScale());
                    break;
            }
        }

        // link to entity
        link(obj: EntityObserver) {
            if (!app) {
                return;
            } // webgl not available

            this.unlink();
            this._link = obj;

            this.events.push(this._link.once('destroy', () => {
                this.unlink();
            }));

            this.entity = makeLayerEntity(layerFront.id);
            container.addChild(this.entity);

            this.entityBehind = makeLayerEntity(layerBack.id);
            this.entity.addChild(this.entityBehind);
        }

        // unlink
        unlink() {
            if (!app) {
                return;
            } // webgl not available

            if (!this._link) {
                return;
            }

            this.events.forEach(event => event.unbind());
            this.events = [];

            this._link = null;
            this.type = '';

            this.entity.destroy();
            this.entity = null;
            this.entityBehind = null;
        }

        static createMaterials() {
            // material
            material = createColorMaterial();
            material.color = colorPrimary;
            material.update();

            // materialBehind
            materialBehind = createColorMaterial();
            materialBehind.color = colorBehind;
            materialBehind.blendState = new BlendState(true, BLENDEQUATION_ADD, BLENDMODE_SRC_ALPHA, BLENDMODE_ONE_MINUS_SRC_ALPHA);
            materialBehind.depthTest = false;
            materialBehind.update();

            const vshaderSpot = `
                attribute vec3 vertex_position;
                attribute float outer;
                
                uniform mat4 matrix_model;
                uniform mat4 matrix_viewProjection;
                uniform float range;
                uniform float innerAngle;
                uniform float outerAngle;
                
                void main(void)
                {
                    vec4 positionW = vec4(vertex_position, 1.0);
                    float radius = (outer * (sin(radians(outerAngle)) * range)) + ((1.0 - outer) * (sin(radians(innerAngle)) * range));
                    positionW.xz *= radius;
                    positionW.y *= range * ((outer * cos(radians(outerAngle))) + ((1.0 - outer) * cos(radians(innerAngle))));
                    positionW = matrix_model * positionW;
                    gl_Position = matrix_viewProjection * positionW;
                }`;

            const fshaderSpot = `
                uniform vec4 uColorSpot;
                
                void main(void)
                {
                    gl_FragColor = uColorSpot;
                }`;

            const shaderSpotDesc = {
                uniqueName: 'LightGizmoSpotShader',
                vertexGLSL: vshaderSpot,
                fragmentGLSL: fshaderSpot,
                attributes: {
                    vertex_position: 'POSITION',
                    outer: 'ATTR15'
                }
            };

            materialSpot = new ShaderMaterial(shaderSpotDesc);
            materialSpot.setParameter('uColorSpot', new Float32Array([colorPrimary.r, colorPrimary.g, colorPrimary.b, colorPrimary.a]));
            materialSpot.update();

            materialSpotBehind = new ShaderMaterial(shaderSpotDesc);
            materialSpotBehind.setParameter('uColorSpot', new Float32Array([colorBehind.r, colorBehind.g, colorBehind.b, colorBehind.a]));
            materialSpotBehind.blendState = new BlendState(true, BLENDEQUATION_ADD, BLENDMODE_SRC_ALPHA, BLENDMODE_ONE_MINUS_SRC_ALPHA);
            materialSpotBehind.depthTest = false;
            materialSpotBehind.update();
        }

        static createDirectional(device: GraphicsDevice) {
            const rad = math.DEG_TO_RAD;
            const size = 0.2;
            const length = -(2 - size * 2);
            const positions = [
                0, 0, 0,
                0, length, 0,

                // triangle
                Math.sin(0 * rad) * size, length, Math.cos(0 * rad) * size,
                Math.sin(120 * rad) * size, length, Math.cos(120 * rad) * size,
                Math.sin(120 * rad) * size, length, Math.cos(120 * rad) * size,
                Math.sin(240 * rad) * size, length, Math.cos(240 * rad) * size,
                Math.sin(240 * rad) * size, length, Math.cos(240 * rad) * size,
                Math.sin(0 * rad) * size, length, Math.cos(0 * rad) * size,

                // triangle corners
                Math.sin(0 * rad) * size, length, Math.cos(0 * rad) * size,
                0, length - (size * 2), 0,
                Math.sin(120 * rad) * size, length, Math.cos(120 * rad) * size,
                0, length - (size * 2), 0,
                Math.sin(240 * rad) * size, length, Math.cos(240 * rad) * size,
                0, length - (size * 2), 0
            ];

            return Gizmo.createMesh(device, positions, null);
        }

        static createPoint(device: GraphicsDevice) {
            const positions: number[] = [];
            pushCircle(positions, 1, 'xy');
            return Gizmo.createMesh(device, positions, null);
        }

        static createPointClose(device: GraphicsDevice) {
            const positions: number[] = [];
            pushCircle(positions, 1, 'xz');
            pushCircle(positions, 1, 'xy');
            pushCircle(positions, 1, 'yz');
            return Gizmo.createMesh(device, positions, null);
        }

        static createSpot(device: GraphicsDevice) {
            // two edge lines from apex down to the rim at y=-1
            const positions: number[] = [
                0, 0, 0, Math.sin(0), -1, Math.cos(0),
                0, 0, 0, Math.sin(Math.PI), -1, Math.cos(Math.PI)
            ];
            const outers: number[] = [1, 1, 1, 1];

            // inner cone ring (outer=0) and outer cone ring (outer=1)
            pushCircle(positions, 1, 'xz', -1, outers, 0);
            pushCircle(positions, 1, 'xz', -1, outers, 1);

            return Gizmo.createMesh(device, positions, outers);
        }

        static createRectangle(device: GraphicsDevice) {
            // 4 lines
            const positions = [
                -0.5, 0, -0.5, 0.5, 0, -0.5,
                -0.5, 0, 0.5, 0.5, 0, 0.5,
                -0.5, 0, -0.5, -0.5, 0, 0.5,
                0.5, 0, -0.5, 0.5, 0, 0.5
            ];

            return Gizmo.createMesh(device, positions, null);
        }

        static createDisk(device: GraphicsDevice) {
            const positions: number[] = [];
            pushCircle(positions, 0.5, 'xz');
            return Gizmo.createMesh(device, positions, null);
        }

        static createSphere(device: GraphicsDevice) {
            const positions: number[] = [];
            pushCircle(positions, 0.5, 'xz');
            pushCircle(positions, 0.5, 'xy');
            pushCircle(positions, 0.5, 'yz');
            return Gizmo.createMesh(device, positions, null);
        }

        static createMesh(device: GraphicsDevice, positions: number[], outers: number[] | null) {
            // mesh
            const mesh = new Mesh(device);
            mesh.setPositions(positions);

            if (outers) {
                mesh.setVertexStream(SEMANTIC_ATTR15, outers, 1);
            }
            mesh.update(PRIMITIVE_LINES);

            // keep the mesh alive across mesh-instance destroys triggered by
            // the render component's meshInstances setter when swapping types
            mesh.incRefCount();

            return mesh;
        }
    }

    editor.on('selector:change', (type: string, items: EntityObserver[]) => {
        // clear gizmos
        if (type !== 'entity') {
            for (const key in entities) {
                entities[key].unlink();
                pool.push(entities[key]);
            }
            entities = { };
            return;
        }

        // index selection
        const ids = { };
        for (let i = 0; i < items.length; i++) {
            ids[items[i].get('resource_id')] = items[i];
        }

        let render = false;

        // remove
        for (const key in entities) {
            if (ids[key]) {
                continue;
            }

            pool.push(entities[key]);
            entities[key].unlink();
            delete entities[key];
            render = true;
        }

        // add
        for (const key in ids) {
            if (entities[key]) {
                continue;
            }

            let gizmo = pool.shift();
            if (!gizmo) {
                gizmo = new Gizmo();
            }

            gizmo.link(ids[key]);
            entities[key] = gizmo;

            render = true;
        }

        if (render) {
            editor.call('viewport:render');
        }
    });

    editor.once('viewport:load', (application: AppBase) => {
        app = application;
        const device = app.graphicsDevice;

        container = new Entity(app);
        app.root.addChild(container);

        Gizmo.createMaterials();

        const addConfig = (
            type: string,
            mesh: Mesh,
            matFront: Material = material,
            matBack: Material = materialBehind
        ) => {
            meshConfigs[type] = { mesh, matFront, matBack };
        };

        addConfig('directional', Gizmo.createDirectional(device));
        addConfig('point', Gizmo.createPoint(device));
        addConfig('pointclose', Gizmo.createPointClose(device));
        addConfig('spot', Gizmo.createSpot(device), materialSpot, materialSpotBehind);
        addConfig('rectangle', Gizmo.createRectangle(device));
        addConfig('disk', Gizmo.createDisk(device));
        addConfig('sphere', Gizmo.createSphere(device));
    });

    editor.on('viewport:gizmoUpdate', () => {
        for (const key in entities) {
            entities[key].update();
        }
    });
});
