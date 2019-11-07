editor.once('load', function () {
    'use strict';

    editor.method('templates:handleScriptOrderConflict', function (conflict) {

        return new HandleScriptOrderConflict(conflict).run();
    });

    class HandleScriptOrderConflict {
        constructor(conflict) {
            this.conflict = conflict;
        }

        run() {
            this.rmAdded();

            return this.isReorder() ?
                this.prepReorderConflict() : null;
        }

        rmAdded() {
            this.conflict.src_value = editor.call(
                'template:utils',
                'selectPresentInSecond',
                this.conflict.src_value,
                this.conflict.dst_value
            );
        }

        isReorder() {
            return this.conflict.src_value.length >= 2 &&
                !this.sameSrcDstOrder();
        }

        sameSrcDstOrder() {
            const a = editor.call(
                'template:utils',
                'selectPresentInSecond',
                this.conflict.dst_value,
                this.conflict.src_value
            );

            return editor.call('assets:isDeepEqual', this.conflict.src_value, a);
        }

        prepReorderConflict() {
            this.conflict.override_type = 'override_reorder_scripts';

            return this.conflict;
        }
    }
});
