editor.once('load', function () {
    'use strict';

    class HandleChildrenConflict {
        constructor(conflict, overrides) {
            this.conflict = conflict;

            this.overrides = overrides;
        }

        run() {
            this.setMaps();

            this.rmAdded();

            this.rmReparented();

            return this.isReorder() ?
                this.prepReorderConflict() : null;
        }

        setMaps() {
            this.addedIds = editor.call(
                'template:utils',
                'entArrayToMap',
                this.overrides.addedEntities
            );

            this.dstToSrc = editor.call(
                'template:utils',
                'invertMap',
                this.overrides.srcToDst
            );
        }

        rmAdded() {
            this.conflict.src_value = this.conflict.src_value.filter(id => {
                return !this.addedIds[id];
            });
        }

        rmReparented() {
            this.conflict.src_value = this.conflict.src_value.filter(srcId => {
                const dstId = this.overrides.srcToDst[srcId];

                return this.conflict.dst_value.includes(dstId);
            });
        }

        isReorder() {
            return this.conflict.src_value.length >= 2 &&
                !this.sameSrcDstOrder();
        }

        sameSrcDstOrder() {
            let a = this.conflict.dst_value.map(dstId => {
                const srcId = this.dstToSrc[dstId];

                return this.conflict.src_value.includes(srcId) && srcId;
            });

            a = editor.call('template:utils', 'rmFalsey', a);

            return editor.call('assets:isDeepEqual', this.conflict.src_value, a);
        }

        prepReorderConflict() {
            this.conflict.override_type = 'override_reorder_children';

            return this.conflict;
        }
    }

    editor.method('templates:handleChildrenConflict', function (conflict, overrides) {
        return new HandleChildrenConflict(conflict, overrides).run();
    });
});
