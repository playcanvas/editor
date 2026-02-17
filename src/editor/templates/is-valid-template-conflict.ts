editor.once('load', () => {
    const ignorePathsForAll = {
        resource_id: 1
    };

    const templIdsReg = /^template_ent_ids/;

    class IsValidTemplateConflict {
        constructor(conflict: object, rootId: string, srcToDst: object, scriptAttrs: object) {
            this.conflict = conflict;

            this.isRoot = conflict.resource_id === rootId;

            this.srcToDst = srcToDst;

            this.scriptAttrs = scriptAttrs;

            this.path = conflict.path;

            this.src_value = conflict.src_value;

            this.dst_value = conflict.dst_value;
        }

        run() {
            if (this.ignorePath()) {
                return false;

            }
            if (this.conflict.entity_ref_paths) {
                return !editor.call(
                    'template:attrUtils',
                    'valsEqualAfterRemap',
                    this.conflict,
                    this.srcToDst,
                    this.scriptAttrs
                );

            }
            return true;

        }

        ignorePath() {
            return ignorePathsForAll[this.path] ||
                templIdsReg.test(this.path) ||
                this.ignoreForRoot();
        }

        ignoreForRoot() {
            return this.isRoot &&
                editor.call(
                    'template:utils',
                    'isIgnoreRootOverride',
                    this.path
                );
        }

        handleEntityPathConflict() {
            return this.areBothArrays() ?
                this.isArrayDifferent(this.src_value, this.dst_value) :
                this.isValueDifferent(this.src_value, this.dst_value);
        }

        areBothArrays() {
            return [this.src_value, this.dst_value].every(Array.isArray);
        }

        isArrayDifferent(srcAr, dstAr) {
            const diffLen = srcAr.length !== dstAr.length;

            return diffLen || this.isSomeValueDifferent(srcAr, dstAr);
        }

        isSomeValueDifferent(srcAr, dstAr) {
            return srcAr.some((src, index) => {

                const dst = dstAr[index];

                return this.isValueDifferent(src, dst);
            });
        }

        // external entity references are stored as null in asset
        isValueDifferent(src, dst) {
            const oneTrue = src || dst;

            const diffMapped = this.srcToDst[src] !== dst;

            return oneTrue && diffMapped;
        }
    }

    /**
     * Determine if a conflict found by recursive comparison of an instance and a template asset
     * should be reported as an override or ignored. This takes into account that entity id's are
     * expected to be different. The 'srcToDst' argument provides the expected id mapping.
     *
     * @param conflict - The conflict.
     * @param rootId - The guid of the root entity to determine if this conflict involves
     * the root entity.
     * @param srcToDst - The guid mapping.
     * @returns True if the conflict should be reported as an override.
     */
    editor.method('template:isValidTemplateConflict', (conflict: object, rootId: string, srcToDst: object, scriptAttrs: object): boolean => {
        return new IsValidTemplateConflict(conflict, rootId, srcToDst, scriptAttrs).run();
    });
});
