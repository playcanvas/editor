editor.once('load', function () {
    'use strict';

    editor.method('template:addInstance', function (asset, parent, opts) {
        if (! editor.call('permissions:write')) {
            return;
        }

        return new AddTemplateInstance(asset, parent, opts).run();
    });

    class AddTemplateInstance {
        constructor(asset, parent, opts) {
            this.asset = asset;

            this.parent = parent;

            this.opts = opts || {};

            this.childIndex = this.opts.childIndex;

            this.subtreeRootId = this.opts.subtreeRootId;
        }

        run() {
            this.prepData();

            this.subtreeRootId ? this.prepSubtree() : this.prepFull();

            return editor.call(
                'template:utils',
                'addEntitySubtree',
                this.dstRootEnt,
                this.dstEnts,
                this.parent,
                this.childIndex
            );
        }

        prepData() {
            this.setMaps();

            this.allSrcEnts = this.asset.get('data').entities;

            const a = Object.values(this.allSrcEnts);

            this.scriptAttrs = editor.call('template:getScriptAttributes', a);
        }

        setMaps() {
            this.dstToSrc = this.opts.dstToSrc || {};

            this.srcToDst = this.opts.srcToDst ||
                editor.call('template:utils', 'invertMap', this.dstToSrc);
        }

        prepSubtree() {
            this.subtreeRootEnt = this.allSrcEnts[this.subtreeRootId];

            this.createSubtreeEnts();

            const dstRootId = this.srcToDst[this.subtreeRootId];

            this.dstRootEnt = this.dstEnts[dstRootId];

            this.setChildIndex();
        }

        createSubtreeEnts() {
            const ents = editor.call(
                'template:utils',
                'getDescendants',
                this.subtreeRootEnt,
                this.allSrcEnts,
                {}
            );

            this.createDstEnts(ents);
        }

        setChildIndex() {
            const p = this.allSrcEnts[this.subtreeRootEnt.parent];

            this.childIndex = p.children.indexOf(this.subtreeRootId);
        }

        prepFull() {
            this.createDstEnts(this.allSrcEnts);

            const srcRootId = editor.call('template:utils', 'findIdWithoutParent', this.allSrcEnts);

            const dstRootId = this.srcToDst[srcRootId];

            this.dstRootEnt = this.dstEnts[dstRootId];

            this.setInstanceRootFields();
        }

        setInstanceRootFields() {
            this.dstRootEnt.template_ent_ids = this.dstToSrc;

            this.dstRootEnt.parent = this.parent.get('resource_id');

            this.dstRootEnt.template_id = parseInt(this.asset.get('id'), 10);
        }

        createDstEnts(ents) {
            this.dstEnts = editor.call( // updates maps
                'template:createInstanceEntities',
                ents,
                this.srcToDst,
                this.dstToSrc,
                this.scriptAttrs
            );
        }
    }
});
