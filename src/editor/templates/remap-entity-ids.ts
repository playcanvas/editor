editor.once('load', () => {
    class RemapEntityIds {
        constructor(entity: import('@playcanvas/observer').Observer, scriptAttrs: Record<string, unknown>, srcToDst: Record<string, string>) {
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

        remapAtPath(path: string) {
            editor.call(
                'template:utils',
                'remapEntAtPath',
                this.entity,
                path,
                this.srcToDst
            );
        }
    }

    editor.method('template:remapEntityIds', (entity, scriptAttrs, srcToDst) => {
        new RemapEntityIds(entity, scriptAttrs, srcToDst).run();
    });
});
