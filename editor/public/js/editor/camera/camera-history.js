editor.once('load', function() {
    'use strict';

    var camera;
    var overlapping = 0;
    var position, rotation, eulers, orthoHeight;

    editor.method('camera:history:start', function(entity) {
        if (entity === camera) {
            overlapping++;
            return;
        } else if (camera) {
            editor.call('camera:history:stop');
        }

        var obj = editor.call('entities:get', entity.getGuid());
        if (! obj) return;

        camera = entity;
        overlapping = 1;
        position = camera.getLocalPosition().clone();
        rotation = camera.getLocalRotation().clone();
        eulers = obj.get('rotation');
        orthoHeight = camera.camera.orthoHeight;

        obj.history.enabled = false;
    });

    editor.method('camera:history:stop', function(entity) {
        if (! camera) return;

        if (entity) {
            if (entity !== camera)
                return;

            overlapping--;
            if (overlapping > 0)
                return;
        }

        var obj = editor.call('entities:get', camera.getGuid());
        if (! obj) {
            camera = null;
            return;
        }

        obj.history.enabled = true;

        var dist = position.clone().sub(camera.getLocalPosition()).length();
        var rotA = rotation;
        var rotB = camera.getLocalRotation();
        var theta = rotA.w * rotB.w + rotA.x * rotB.x + rotA.y * rotB.y + rotA.z * rotB.z;

        // not changed
        if (dist < 0.001 && theta > 0.999 && orthoHeight === camera.camera.orthoHeight) {
            camera = null;
            return;
        }

        var get = obj.history._getItemFn;

        var posCur = Array.prototype.slice.call(camera.getLocalPosition().data);
        var rotCur = Array.prototype.slice.call(camera.getLocalEulerAngles().data);
        var ortCur = camera.camera.orthoHeight;

        var posPrev = Array.prototype.slice.call(position.data);
        var rotPrev = eulers.slice(0);
        var ortPrev = orthoHeight;

        camera = null;

        editor.call('history:add', {
            name: 'camera.user',
            undo: function() {
                var item = get();
                if (! item) return;

                item.history.enabled = false;
                item.set('position', posPrev);
                item.set('rotation', rotPrev);
                item.set('components.camera.orthoHeight', ortPrev);
                item.history.enabled = true;
            },
            redo: function() {
                var item = get();
                if (! item) return;

                item.history.enabled = false;
                item.set('position', posCur);
                item.set('rotation', rotCur);
                item.set('components.camera.orthoHeight', ortCur);
                item.history.enabled = true;
            }
        });
    });
});
