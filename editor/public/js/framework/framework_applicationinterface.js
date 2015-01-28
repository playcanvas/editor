pc.extend(pc.fw, function () {
    var DesignerInterface = function (view) {
        // The DesignView Component from the designer
        this.view = view;
    };

    DesignerInterface.prototype = {
        setEntityTransformComponent: function (entity, type, newVal, undoable, oldVal) {
            var resource_id = entity.getGuid();
            if (newVal) {
                newVal = pc.makeArray(newVal.data);
            }

            if (oldVal) {
                oldVal = pc.makeArray(oldVal.data);
            }

            this.view.fireEvent('entitytransformchanged', resource_id, type, newVal, undoable, oldVal);
        },

        setCameraTransformComponent: function (entity, type, newVal, undoable, oldVal) {
            var resource_id = entity.getGuid();

            if (newVal) {
                newVal = pc.makeArray(newVal.data);
            }

            if (oldVal) {
                oldVal = pc.makeArray(oldVal.data);
            }

            this.view.fireEvent('cameratransformchanged', resource_id, type, newVal, undoable, oldVal);
        },

        setCameraViewWindowSize: function (entity, newX, newY) {
            var resource_id = entity.getGuid();
            this.view.fireEvent('cameraviewwindowchanged', resource_id, newX, newY);
        },

        setSelection: function (resourceIds) {
            var entities = Ext.getStore('Entities');
            var assets = Ext.getStore('Assets');

            var records = resourceIds.map(function (resourceId) {
                var record = entities.getNodeById(resourceId);
                if (!record) {
                    record = assets.getById(resourceId);
                }

                return PCD.model.Selection.create(record);
            });

            this.view.fireEvent('select', this.view, records);
        },

        setEntitySelection: function (entities) {
            var store = Ext.getStore('Entities');
            var i, length = entities.length;
            var records = [];

            for(i = 0; i < length ; i++) {
                records.push(PCD.model.Selection.create(store.getNodeById(entities[i])));
            }
            // Fire the 'select' event with an array of PCD.model.Selection objects
            this.view.fireEvent('select', this.view, records);
        },

        setAssetSelection: function (assets) {
            var store = Ext.getStore('Assets');

            var records = assets.map(function (asset) {
                return PCD.model.Selection.create(store.getById(asset));
            });

            this.view.fireEvent('select', this.view, records);
        },

        setContextMeshInstanceSelection: function (model, material, meshInstanceIndex, entityId) {
            this.view.fireEvent('contextmeshselect', model, material, meshInstanceIndex, entityId);
        },

        setMeshInstanceSelection: function (model, material, meshInstanceIndex, entityId) {
            var selection = Ext.create('PCD.model.MeshInstance', {
                modelId: model,
                materialId: material,
                meshInstanceIndex: meshInstanceIndex,
                entityId: entityId
            });

            this.view.fireEvent('select', this.view, [PCD.model.Selection.create(selection)]);
        },

        clearSelection: function () {
            this.view.fireEvent('select', this.view, []);
        }
    };
    return {
        DesignerInterface: DesignerInterface
    };
}());
