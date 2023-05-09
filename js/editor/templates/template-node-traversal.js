editor.once('load', function () {
    const bothTypes = ['src', 'dst'];

    class MakeBasicConflict {
        constructor(typeToNode) {
            this.typeToNode = typeToNode;
        }

        run() {
            this.initialize();

            bothTypes.forEach(this.missingFlagForField, this);

            return this.result;
        }

        initialize() {
            const guid = pc.guid.create();

            this.result = {
                conflict_id: guid,
                use_src: 0,
                use_dst: 0
            };
        }

        missingFlagForField(type) {
            if (this.typeToNode[type] === undefined) {
                const missingField = 'missing_in_' + type;

                this.result[missingField] = 1;
            }
        }
    }

    class MakeNodeConflict {
        constructor(data) {
            this.data = data;

            this.typeToNode = this.data.typeToNode || this.data.typeToRoot;
        }

        run() {
            this.setBasicConflict();

            if (this.isPathPresent()) {
                bothTypes.forEach(this.checkAndSetValueField, this);

                this.conflict.path = editor.call('template:utils', 'pathToStr', this.data.path);
            }

            return this.conflict;
        }

        isPathPresent() {
            return this.data.path && this.data.path.length;
        }

        setBasicConflict() {
            this.conflict = new MakeBasicConflict(this.typeToNode).run();
        }

        checkAndSetValueField(type) {
            const node = this.typeToNode[type];

            if (node !== undefined) {
                const field = type + '_value';

                this.conflict[field] = node;
            }
        }
    }

    /**
     * Handle a node for the purposes of finding diff conflicts during recursive traversal of a
     * tree.
     *
     * A reference to a NodeTraversal instance is provided as an argument. We call its
     * 'makeRecursiveCalls' method, unless a conflict or deep equality of nodes has been found
     * here, in which case the traversal's 'addCurPathToKnown' methods is called.
     *
     * @param {object} data - Traversal state data.
     * @param {object} traversal - A NodeTraversal instance.
     */
    class DiffTemplateNode {
        constructor(data, traversal) {
            this.data = data;

            this.traversal = traversal;

            this.fullPath = ['entities', data.entityResourceId].concat(data.path);
        }

        handleNode() {
            if (editor.call('template:attrUtils', 'insideArrayAtMissingIndex', this.data)) {
                this.reportDiff();

            } else if (this.areNodesEqual()) {
                this.traversal.addCurPathToKnown();

            } else if (this.pathStop()) {
                this.reportDiff();

            } else if (this.pathAttrs()) {
                this.handleAttrs();

            } else if (this.areBothNodesMaps()) {
                this.traversal.makeRecursiveCalls();

            } else {
                this.reportDiff();
            }
        }

        handleAttrs() {
            if (editor.call('template:attrUtils', 'isJsonArrayNode', this.data)) {
                this.traversal.callArrayRecursion();

            } else if (editor.call('template:attrUtils', 'isJsonMapNode', this.data)) {
                this.traversal.makeRecursiveCalls();

            } else {
                const h = editor.call('template:attrUtils', 'conflictFieldsForAttr', this.data);

                this.reportDiff(h);
            }
        }

        areNodesEqual() {
            return editor.call(
                'assets:isDeepEqual', this.data.node1, this.data.node2);
        }

        areBothNodesMaps() {
            return [this.data.node1, this.data.node2].every((h) => {
                return editor.call('template:utils', 'isMapObj', h);
            });
        }

        pathStop() {
            return editor.call(
                'template:utils',
                'isPathInSchema',
                this.fullPath,
                'stop_and_report_conflict'
            );
        }

        pathAttrs() {
            return editor.call(
                'template:utils',
                'isPathInSchema',
                this.fullPath,
                'merge_entity_script_attributes'
            );
        }

        reportDiff(extraFields) {
            extraFields = extraFields || {};

            const h = new MakeNodeConflict(this.data).run();

            Object.assign(h, extraFields);

            this.data.conflicts.push(h);

            this.traversal.addCurPathToKnown();
        }
    }

    class NodeTraversal {
        constructor(data) {
            this.data = data;
        }

        run() {
            if (!this.resultKnown()) {
                this.handleNewPath();
            }
        }

        addCurPathToKnown() {
            this.data.knownResultPaths.add(this.data.path);
        }

        makeRecursiveCalls() {
            const a = Object.keys(this.data.node1);

            a.forEach(this.recursiveCallForKey, this);
        }

        callArrayRecursion() {
            const a = editor.call('template:attrUtils', 'arrayToIndexStrs', this.data.node1);

            a.forEach(this.recursiveCallForKey, this);
        }

        resultKnown() {
            return this.data.knownResultPaths.includes(this.data.path);
        }

        handleNewPath() {
            this.nodeHandler = new DiffTemplateNode(this.data, this);

            this.completeData();

            this.setTypeToNode();

            this.nodeHandler.handleNode();
        }

        completeData() {
            const type1 = this.data.type1;

            const type2 = type1 === 'src' ? 'dst' : 'src';

            const h = {
                type2: type2,

                node1: this.nodeFromRoot(type1),

                node2: this.nodeFromRoot(type2),

                parent1: this.parentFromRoot(type1),

                parent2: this.parentFromRoot(type2)
            };

            Object.assign(this.data, h);
        }

        setTypeToNode() {
            const h = {};

            h[this.data.type1] = this.data.node1;

            h[this.data.type2] = this.data.node2;

            this.data.typeToNode = h;
        }

        recursiveCallForKey(key) {
            const h = Object.assign({}, this.data); // copy

            h.path = this.data.path.slice(0); // copy

            h.path.push(key);

            new NodeTraversal(h).run();
        }

        nodeFromRoot(type) {
            const root = this.data.typeToRoot[type];

            return editor.call(
                'template:utils', 'getNodeAtPath', root, this.data.path);
        }

        parentFromRoot(type) {
            const root = this.data.typeToRoot[type];

            return editor.call(
                'template:utils', 'getParentAtPath', root, this.data.path);
        }
    }

    /**
     * A generalized node traversal mechanism.
     *
     * Given a path (data.path) and a type (data.type1), which is in turn 'src' or 'dst', compare
     * the node at that path in both src and dst (of data.typeToRoot) and either stop (and add a
     * conflict to data.conflicts), or make recursive calls with all children nodes.
     *
     * 'NodeTraversal' is used in combination with a handler class, in this case 'DiffTemplateNode'
     * defined below.
     *
     * 'NodeTraversal' calls the 'handleNode' method of a handler instance, which in turn calls the
     * 'makeRecursiveCalls' or 'addCurPathToKnown' of 'NodeTraversal'.
     *
     * @param {object} data - Traversal state data with fields: typeToRoot, conflicts, path, type1.
     */
    editor.method('assets:templateNodeTraversal', function (data) {
        new NodeTraversal(data).run();
    });
});
