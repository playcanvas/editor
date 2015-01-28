pc.extend(pc.designer, function() {
    var DRAG_SCALE_FACTOR = 0.5;

    var GizmoComponent = function GizmoComponent(context) {
        // Initialization methods
        this.inits = {};
        this.inits[pc.designer.GizmoComponentSystem.GizmoType.TRANSLATE] = this._initTranslateGizmo;
        this.inits[pc.designer.GizmoComponentSystem.GizmoType.ROTATE] = this._initRotateGizmo;
        this.inits[pc.designer.GizmoComponentSystem.GizmoType.SCALE] = this._initScaleGizmo;
        
        this.bind("set_gizmoType", this.onSetGizmoType.bind(this));
    };
    GizmoComponent = pc.inherits(GizmoComponent, pc.fw.Component);
    
    GizmoComponent.GizmoType = {
        TRANSLATE: 'position',
        ROTATE: 'rotation',
        SCALE: 'scale'
    };

    GizmoComponent.GizmoCoordSys = {
        WORLD: 'world',
        LOCAL: 'local'
    };

    pc.extend(GizmoComponent.prototype, {
        onSetGizmoType: function (name, oldValue, newValue) {
            // Remove previous gizmo shapes from pick system
            //this.system.context.systems.pick.deleteShapes(entity);
            this.entity.pick.deleteShapes();
            
            // Initialize new Gizmo
            this.inits[newValue].call(this);
        },

        _initTranslateGizmo: function () {
            this.entity.pick.addShape(new pc.shape.Box(), 'X');
            this.entity.pick.addShape(new pc.shape.Box(), 'Y');
            this.entity.pick.addShape(new pc.shape.Box(), 'Z');
            this.entity.pick.addShape(new pc.shape.Box(), 'XY');
            this.entity.pick.addShape(new pc.shape.Box(), 'YZ');
            this.entity.pick.addShape(new pc.shape.Box(), 'ZX');
        },
    
        _initRotateGizmo: function () {
            var iradius = 0.1;
            var oradius = 1;

            this.entity.pick.addShape(new pc.shape.Torus(new pc.Mat4(), iradius, oradius), 'X');
            this.entity.pick.addShape(new pc.shape.Torus(new pc.Mat4(), iradius, oradius), 'Y');
            this.entity.pick.addShape(new pc.shape.Torus(new pc.Mat4(), iradius, oradius), 'Z');
        },

        _initScaleGizmo: function () {
            this.entity.pick.addShape(new pc.shape.Box(), 'X');
            this.entity.pick.addShape(new pc.shape.Box(), 'Y');
            this.entity.pick.addShape(new pc.shape.Box(), 'Z');
            this.entity.pick.addShape(new pc.shape.Box(), 'C');
        }

    });

    return {
        GizmoComponent: GizmoComponent
    };
}());
