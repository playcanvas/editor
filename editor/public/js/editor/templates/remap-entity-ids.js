editor.once('load', function () {
    'use strict';

    editor.method('template:remapEntityIds', function (entity, scriptAttrs, srcToDst) {
        new RemapEntityIds(entity, scriptAttrs, srcToDst).run();
    });

    class RemapEntityIds {
        constructor(entity, scriptAttrs, srcToDst) {
            this.entity = entity;

            this.scriptAttrs = scriptAttrs;

            this.srcToDst = srcToDst;
        }

        run() {
            this.handleTemplMap();

            this.setEntPaths();

            this.entPaths.forEach(this.remapAtPath, this);
        }

        handleTemplMap() {
            if (this.entity.template_ent_ids) {
                this.entity.template_ent_ids = editor.call(
                    'template:utils',
                    'remapOrAssignKeys',
                    this.entity.template_ent_ids,
                    this.srcToDst
                );
            }
        }

        setEntPaths() {
            this.entPaths = editor.call(
                'template:allEntityPaths',
                this.entity,
                this.scriptAttrs
            );
        }

        remapAtPath(path) {
            editor.call(
                'template:utils',
                'remapEntAtPath',
                this.entity,
                path,
                this.srcToDst
            );
        }
    }
});
