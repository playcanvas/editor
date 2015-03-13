editor.once('load', function() {
    'use strict';

    var framework = editor.call('viewport:framework');

    var userCameras = {};
    var userdataDocs = {};

    // Subscribes to user data of specified user
    var addUser = function (userId) {
        editor.once('userdata:' + userId + ':raw', function (data) {
            loadUserData(userId, data);
        });

        userdataDocs[userId] = editor.call('realtime:subscribe:userdata', config.scene.id, userId);
    };

    // Creates user camera and binds to real time events
    var loadUserData = function (userId, data) {
        // add user camera
        var cam = new pc.Entity(framework);
        cam.addComponent('camera', {
            fov: 45,
            projection: 0,
            enabled: true,
            nearClip: 0.1,
            farClip: 2,
            priority: 0
        });

        framework.root.addChild(cam);

        var pos = data.cameras.perspective.position;
        cam.setPosition(pos[0], pos[1], pos[2]);

        var rot = data.cameras.perspective.rotation;
        cam.setEulerAngles(rot[0], rot[1], rot[2]);

        userCameras[userId] = cam;

        editor.call('viewport:render');

        // server > client
        editor.on('realtime:userdata:' + userId + ':op:cameras', function(op) {
            var render = false;
            if (op.p.length === 3) {
                if (op.oi) {
                    if (op.p[2] === 'position') {
                        cam.setPosition(Number(op.oi[0]), Number(op.oi[1]), Number(op.oi[2]));
                        render = true;
                    } else if (op.p[2] === 'rotation') {
                        cam.setEulerAngles(Number(op.oi[0]), Number(op.oi[1]), Number(op.oi[2]));
                        render = true;
                    }

                }
            }

            if (render) {
                editor.call('viewport:render');
            }
        });
    };

    // Add user who comes online
    editor.on('whoisonline:add', function (userId) {
        // ignore the logged in user
        if (userId === config.self.id) return;

        // do not add users without write access
        if (editor.call('permissions:write', userId)) {
            addUser(userId);
        }

        // subscribe to project permission changes
        editor.on('permissions:set:' + userId, function () {
            if (editor.call('permissions:write', userId)) {
                if (!userdataDocs[userId]) {
                    // wait a bit before adding, for userdata to be created at sharejs
                    setTimeout(function () {
                        addUser(userId);
                    }, 500);
                }
            } else {
                removeUser(userId);
            }
        });
    });

    // Removes user camera and unsubscribes from userdata
    var removeUser = function (userId) {
        if (userId === config.self.id) return;

        // unsubscribe from realtime userdata
        if (userdataDocs[userId]) {
            userdataDocs[userId].unsubscribe();
            delete userdataDocs[userId];
            editor.unbind('realtime:userdata:' + userId + ':op:cameras');
        }

        // remove user camera
        if (userCameras[userId]) {
            userCameras[userId].destroy();
            delete userCameras[userId];
            editor.call('viewport:render');
        }
    };

    // Remove user who goes offline
    editor.on('whoisonline:remove', function (userId) {
        removeUser(userId);
        editor.unbind('permissions:set:' + userId);
    });

});
