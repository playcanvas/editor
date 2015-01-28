pc.extend(pc.designer, function () {
    GizmoComponentData = function () {
        this.gizmoType = pc.designer.GizmoComponentSystem.GizmoType.TRANSLATE;
        this.activeAxis = -1;
    };
    GizmoComponentData = pc.inherits(GizmoComponentData, pc.fw.ComponentData);
    
    return {
        GizmoComponentData: GizmoComponentData
    };
}());