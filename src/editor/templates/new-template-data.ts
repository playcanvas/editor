import { guid } from 'playcanvas';

type EntityData = {
    get: (key: string) => string;
    json: () => Record<string, unknown>;
};

editor.once('load', () => {
    class NewTemplateData {
        root: EntityData;

        srcEnts: EntityData[];

        dstEnts: Record<string, unknown>[];

        srcToDst: Record<string, string>;

        rootId: string;

        scriptAttrs: Record<string, unknown>;

        constructor(root: EntityData, srcEnts: EntityData[]) {
            this.root = root;

            this.srcEnts = srcEnts;

            this.dstEnts = [];

            this.srcToDst = {};
        }

        run() {
            this.prepDstEnts();

            this.setScriptAttrs();

            this.dstEnts.forEach(this.remapIds, this);

            return this.prepResult();
        }

        prepDstEnts() {
            this.rootId = this.root.get('resource_id');

            this.srcEnts.forEach(this.handleSrcEnt, this);
        }

        handleSrcEnt(srcEnt: EntityData) {
            const srcId = srcEnt.get('resource_id');

            const dstId = guid.create();

            const dstEnt = srcEnt.json();

            dstEnt.resource_id = dstId;
            dstEnt.template ??= null;
            dstEnt.template_id ??= null;
            dstEnt.template_ent_ids ??= null;

            this.dstEnts.push(dstEnt);

            this.srcToDst[srcId] = dstId;

            if (srcId === this.rootId) {
                dstEnt.parent = null;

                // unlink the root from its source template
                dstEnt.template_id = null;
                dstEnt.template_ent_ids = null;
            }
        }

        setScriptAttrs() {
            this.scriptAttrs = editor.call('template:getScriptAttributes', this.dstEnts);
        }

        remapIds(ent: Record<string, unknown>): void {
            editor.call('template:remapEntityIds', ent, this.scriptAttrs, this.srcToDst);
        }

        prepResult() {
            const ents = editor.call('template:utils', 'entArrayToMap', this.dstEnts);

            return {
                assetData: { entities: ents },
                srcToDst: this.srcToDst
            };
        }
    }

    /**
     * Given the root entity of an intended template, create a json copy of it with new guids. All
     * entity references inside are updated to match new guids.
     *
     * @param root - The root entity.
     * @param sceneEnts - All entities descending from the root.
     * @returns An object with fields 'assetData' (for storing as data of the new template
     * asset, it has the format { entities: <guid to entity map> }), and 'srcToDst' (a map from
     * original to new guids).
     */
    editor.method('template:newTemplateData', (root: EntityData, sceneEnts: EntityData[]) => {
        return new NewTemplateData(root, sceneEnts).run();
    });
});
