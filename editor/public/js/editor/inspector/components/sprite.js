Object.assign(pcui, (function () {
    'use strict';

    const COMPONENT_ATTRIBUTES = [{
        label: 'Type',
        path: 'components.sprite.type',
        type: 'select',
        args: {
            type: 'string',
            options: [{
                v: 'simple', t: 'Simple'
            }, {
                v: 'animated', t: 'Animated'
            }]
        }
    }, {
        label: 'Sprite',
        path: 'components.sprite.spriteAsset',
        type: 'asset',
        args: {
            assetType: 'sprite'
        }
    }, {
        label: 'Frame',
        path: 'components.sprite.frame',
        type: 'number',
        args: {
            min: 0,
            precision: 0
        }
    }, {
        label: 'Width',
        path: 'components.sprite.width',
        type: 'number'
    }, {
        label: 'Height',
        path: 'components.sprite.height',
        type: 'number'
    }, {
        label: 'Color',
        path: 'components.sprite.color',
        type: 'rgb'
    }, {
        label: 'Opacity',
        path: 'components.sprite.opacity',
        type: 'slider',
        args: {
            min: 0,
            max: 1,
            precision: 3
        }
    }, {
        label: 'Flip X',
        path: 'components.sprite.flipX',
        type: 'boolean'
    }, {
        label: 'Flip Y',
        path: 'components.sprite.flipY',
        type: 'boolean'
    }, {
        label: 'Speed',
        path: 'components.sprite.speed',
        type: 'number'
    }, {
        label: 'Batch Group',
        path: 'components.sprite.batchGroupId',
        type: 'batchgroup'
    }, {
        label: 'Layers',
        path: 'components.sprite.layers',
        type: 'layers',
        args: {
            excludeLayers: [
                LAYERID_DEPTH,
                LAYERID_SKYBOX,
                LAYERID_IMMEDIATE
            ]
        }
    }, {
        label: 'Draw Order',
        path: 'components.sprite.drawOrder',
        type: 'number'
    }, {
        label: 'Auto Play',
        path: 'components.sprite.autoPlayClip',
        type: 'select',
        args: {
            type: 'string',
            allowNull: true,
            options: []
        }
    }];

    const CLIP_ATTRIBUTES = [{
        label: 'Name',
        path: 'components.sprite.clips.$.name',
        type: 'string'
    }, {
        label: 'Loop',
        path: 'components.sprite.clips.$.loop',
        type: 'boolean'
    }, {
        label: 'Frames Per Second',
        path: 'components.sprite.clips.$.fps',
        type: 'number',
        args: {
            step: 1
        }
    }, {
        label: 'Sprite',
        path: 'components.sprite.clips.$.spriteAsset',
        type: 'asset',
        args: {
            assetType: 'sprite'
        }
    }];

    // add reference fields
    COMPONENT_ATTRIBUTES.forEach(attr => {
        if (!attr.path) return;
        const parts = attr.path.split('.');
        attr.reference = `sprite:${parts[parts.length - 1]}`;
    });

    CLIP_ATTRIBUTES.forEach(attr => {
        if (!attr.path) return;
        const parts = attr.path.split('.');
        attr.reference = `spriteAnimation:${parts[parts.length - 1]}`;
    });

    const CLASS_CLIP = 'sprite-component-inspector-clip';

    const REGEX_CLIP = /^components.sprite.clips.\d+$/;
    const REGEX_CLIP_NAME = /^components.sprite.clips.\d+\.name$/;

    function getClipsGroupedByName(entities) {
        const result = {};

        // first group clips by name
        entities.forEach(e => {
            const clips = e.get('components.sprite.clips');
            if (!clips) return;

            for (const key in clips) {
                const clip = clips[key];
                if (!result[clip.name]) {
                    result[clip.name] = [];
                }

                result[clip.name].push(key);
            }
        });

        return result;
    }

    function getCommonClips(entities) {
        const result = getClipsGroupedByName(entities);

        // then remove all clips who are not shared across all entities
        for (const key in result) {
            if (result[key].length !== entities.length) {
                delete result[key];
            }
        }

        return result;
    }

    class SpriteComponentInspector extends pcui.ComponentInspector {
        constructor(args) {
            args = Object.assign({}, args);
            args.component = 'sprite';

            super(args);

            this._assets = args.assets;

            this._attributesInspector = new pcui.AttributesInspector({
                history: args.history,
                assets: args.assets,
                projectSettings: args.projectSettings,
                attributes: COMPONENT_ATTRIBUTES,
                templateOverridesInspector: this._templateOverridesInspector
            });
            this.append(this._attributesInspector);

            this._containerClips = new pcui.Container({
                flex: true
            });
            this.append(this._containerClips);

            this._clipInspectors = {};

            this._btnAddClip = new pcui.Button({
                text: 'ADD CLIP',
                icon: 'E120',
                flexGrow: 1,
                hidden: true
            });

            this._btnAddClip.on('click', this._onClickAddClip.bind(this));

            this.append(this._btnAddClip);

            this._timeoutAfterClipNameChange = null;

            this._suppressToggleFields = false;

            ['type', 'spriteAsset'].forEach(field => {
                this._field(field).on('change', this._toggleFields.bind(this));
            });
        }

        _onClickAddClip() {
            // copy entities for redo / undo
            const entities = this._entities.slice();

            // search clips of all entities for the largest key
            let largestKey = 1;
            for (let i = 0; i < entities.length; i++) {
                const clips = entities[i].get('components.sprite.clips');
                if (! clips) continue;

                for (const key in clips) {
                    largestKey = Math.max(largestKey, parseInt(key, 10) + 1);
                }
            }

            const groupedClips = getClipsGroupedByName(entities);
            let suffix = largestKey;
            let desiredName = 'Clip ' + suffix;
            while (groupedClips[desiredName]) {
                suffix++;
                desiredName = 'Clip ' + suffix;
            }

            function redo() {
                entities.forEach(e => {
                    const entity = e.latest();
                    if (!entity || !entity.has('components.sprite')) return;

                    const history = entity.history.enabled;
                    entity.history.enabled = false;
                    const clips = entity.get('components.sprite.clips') || {};
                    let clipKey = 0;
                    for (const key in clips) {
                        clipKey = Math.max(clipKey, parseInt(key, 10) + 1);
                    }

                    entity.set('components.sprite.clips.' + clipKey, {
                        name: desiredName,
                        fps: 30,
                        loop: true,
                        spriteAsset: null
                    });
                    entity.history.enabled = history;
                });
            }

            function undo() {
                entities.forEach(e => {
                    const entity = e.latest();
                    if (!entity) return;

                    const history = entity.history.enabled;
                    entity.history.enabled = false;

                    // find clip by clip name
                    const clips = entity.get('components.sprite.clips');
                    if (! clips) return;

                    let clipKey = null;
                    for (const key in clips) {
                        if (clips[key].name === desiredName) {
                            clipKey = key;
                            break;
                        }
                    }

                    if (clipKey === null) return;

                    entity.unset('components.sprite.clips.' + clipKey);
                    entity.history.enabled = history;
                });
            }

            if (this._history) {
                this._history.add({
                    name: 'entities.components.sprite.clips',
                    undo: undo,
                    redo: redo
                });
            }

            redo();
        }

        _createClipInspector(entities, clipName, clipKeys, insertBeforeElement) {
            const inspector = new SpriteClipInspector({
                clipName: clipName,
                clipKeys: clipKeys,
                removable: true,
                history: this._history,
                assets: this._assets,
                templateOverridesInspector: this._templateOverridesInspector
            });

            if (insertBeforeElement) {
                this._containerClips.appendBefore(inspector, insertBeforeElement);
            } else {
                this._containerClips.append(inspector);
            }

            this._clipInspectors[clipName] = inspector;

            inspector.link(entities);

            return inspector;
        }

        _field(name) {
            return this._attributesInspector.getField(`components.sprite.${name}`);
        }

        _onSetClip(clipName) {
            const existing = this._clipInspectors[clipName];
            if (existing) {
                existing.destroy();
                delete this._clipInspectors[clipName];
            }

            const commonClips = getCommonClips(this._entities);

            // try to insert the clip at the correct index
            const idx = Object.keys(commonClips).indexOf(clipName);
            if (idx === -1) return;

            const nextSibling = this._containerClips.dom.childNodes[idx];

            this._createClipInspector(this._entities, clipName, commonClips[clipName], nextSibling);

            this._updateAutoPlayOptions(commonClips);
        }

        _onUnsetClip(clipName) {
            const inspector = this._clipInspectors[clipName];
            if (inspector) {
                inspector.destroy();
                delete this._clipInspectors[clipName];
            }

            this._updateAutoPlayOptions();
        }

        _onSetClipName(entity, name, oldName) {
            // update autoPlayClip
            if (entity.get('components.sprite.autoPlayClip') === oldName) {
                const history = entity.history.enabled;
                entity.history.enabled = false;
                entity.set('components.sprite.autoPlayClip', name);
                entity.history.enabled = history;
            }

            if (this._timeoutAfterClipNameChange) {
                cancelAnimationFrame(this._timeoutAfterClipNameChange);
            }

            this._timeoutAfterClipNameChange = requestAnimationFrame(this._onAfterClipNameChange.bind(this));
        }

        _onAfterClipNameChange() {
            if (!this._entities) return;

            // make sure we are still only showing the common clips between entities
            // and add any missing ones / remove any obsolete
            const commonClips = getCommonClips(this._entities);

            // remove obsolete clips
            for (const name in this._clipInspectors) {
                if (!commonClips[name]) {
                    this._clipInspectors[name].destroy();
                    delete this._clipInspectors[name];
                }
            }

            // add new clips
            const names = Object.keys(commonClips);
            names.forEach((name, i) => {
                if (this._clipInspectors[name]) return;

                const nextSibling = this._containerClips.dom.childNodes[i];
                this._createClipInspector(this._entities, name, commonClips[name], nextSibling);
            });

            this._updateAutoPlayOptions(commonClips);
        }

        _updateAutoPlayOptions(commonClips) {
            commonClips = commonClips || getCommonClips(this._entities);

            // fill auto play enum with clip names
            const autoPlayOptions = [{
                v: null, t: 'None'
            }];

            for (const name in commonClips) {
                if (commonClips[name].length === this._entities.length) {
                    autoPlayOptions.push({
                        v: name, t: name
                    });
                }
            }

            this._field('autoPlayClip').options = autoPlayOptions;
        }

        _toggleFields() {
            if (this._suppressToggleFields) return;

            const isAnimated = this._field('type').value === 'animated';
            const isSimple = this._field('type').value === 'simple';

            this._containerClips.hidden = !isAnimated;
            this._btnAddClip.hidden = !isAnimated;
            this._field('autoPlayClip').parent.hidden = !isAnimated;
            this._field('speed').parent.hidden = !isAnimated;

            this._field('frame').parent.hidden = !isSimple;
            this._field('spriteAsset').hidden = !isSimple;
            this._field('batchGroupId').parent.hidden = !isSimple || !editor.call('users:hasFlag', 'has2DBatchGroups');

            let hideSizeFields = !isSimple || !this._field('spriteAsset').value;
            if (!hideSizeFields) {
                const asset = this._assets.get(this._field('spriteAsset').value);
                if (!asset || !asset.get('data.renderMode')) {
                    hideSizeFields = true;
                }
            }

            this._field('width').parent.hidden = hideSizeFields;
            this._field('height').parent.hidden = hideSizeFields;
        }

        link(entities) {
            super.link(entities);

            this._suppressToggleFields = true;

            this._attributesInspector.link(entities);

            this._btnAddClip.hidden = false;

            // event for new clips
            entities.forEach((e, i) => {
                this._entityEvents.push(e.on('*:set', (path, value, oldValue) => {
                    if (REGEX_CLIP.test(path)) {
                        this._onSetClip(value.name);
                    } else if (REGEX_CLIP_NAME.test(path)) {
                        this._onSetClipName(e, value, oldValue);
                    }
                }));
            });

            // event for deleted clips
            entities.forEach((e, i) => {
                this._entityEvents.push(e.on('*:unset', (path, value) => {
                    if (!REGEX_CLIP.test(path)) return;
                    this._onUnsetClip(value.name);
                }));
            });

            // group clips by name to find the ones that are common between entities
            const commonClips = getCommonClips(entities);

            // create all existing clips
            for (const name in commonClips) {
                this._createClipInspector(entities, name, commonClips[name]);
            }

            this._updateAutoPlayOptions(commonClips);

            this._suppressToggleFields = false;

            this._toggleFields();
        }

        unlink() {
            super.unlink();
            this._attributesInspector.unlink();

            for (const key in this._clipInspectors) {
                this._clipInspectors[key].destroy();
            }
            this._clipInspectors = {};

            this._btnAddClip.hidden = true;
        }
    }

    class SpriteClipInspector extends pcui.Panel {
        constructor(args) {
            args = Object.assign({
                collapsible: true,
                headerText: args.clipName
            }, args);

            super(args);

            this.class.add(CLASS_CLIP);

            this._entities = null;

            this._spriteInspector = args.spriteInspector;
            this._templateOverridesInspector = args.templateOverridesInspector;

            this._clipKeys = args.clipKeys;

            this._attrs = utils.deepCopy(CLIP_ATTRIBUTES);
            // replace '$' with the actual clip key
            this._attrs.forEach(attr => {
                attr.paths = args.clipKeys.map(key => attr.path.replace('$', key));
                delete attr.path;
            });

            this._inspector = new pcui.AttributesInspector({
                attributes: this._attrs,
                assets: args.assets,
                history: args.history,
                templateOverridesInspector: this._templateOverridesInspector
            });

            this.append(this._inspector);

            if (this._templateOverridesInspector) {
                this._templateOverridesInspector.registerElementForPath(`components.sprite.clips.${args.clipKeys[0]}`, this);
            }

            const fieldName = this._inspector.getField(this._getPathTo('name'));
            fieldName.on('change', this._onClipNameChange.bind(this));
        }

        _getPathTo(field) {
            return `components.sprite.clips.${this._clipKeys[0]}.${field}`;
        }

        _onClipNameChange(value) {
            this.headerText = value;
        }

        _onClickRemove(evt) {
            super._onClickRemove(evt);

            let prev = {};

            // copy for redo / undo
            const clipKeys = this._clipKeys.slice();
            const entities = this._entities.slice();

            const redo = () => {
                prev = {};

                entities.forEach((e, i) => {
                    const entity = e.latest();
                    if (!entity || !entity.has('components.sprite')) return;

                    const path = `components.sprite.clips.${clipKeys[i]}`;
                    if (!entity.has(path)) return;

                    const clip = entity.get(path);
                    const autoPlayClip = entity.get('components.sprite.autoPlayClip');
                    prev[e.get('resource_id')] = { clip, autoPlayClip };

                    const history = entity.history.enabled;
                    entity.history.enabled = false;

                    entity.unset(path);

                    // if this is the clip to be autoPlayed then unset it
                    if (autoPlayClip === clip.name) {
                        entity.set('components.sprite.autoPlayClip', null);
                    }

                    entity.history.enabled = history;
                });
            };

            const undo = () => {
                entities.forEach((e, i) => {
                    const entity = e.latest();
                    if (!entity || !entity.has('components.sprite') || !prev[e.get('resource_id')]) return;

                    const record = prev[e.get('resource_id')];
                    if (!record) return;

                    const history = entity.history.enabled;
                    entity.history.enabled = false;
                    entity.set(`components.sprite.clips.${clipKeys[i]}`, record.clip);
                    if (record.autoPlayClip === record.clip.name) {
                        entity.set('components.sprite.autoPlayClip', record.autoPlayClip);
                    }
                    entity.history.enabled = history;
                });
            };

            editor.call('history:add', {
                name: 'delete entities.components.sprite.clips',
                undo: undo,
                redo: redo
            });

            redo();
        }

        link(entities) {
            this.unlink();

            this._entities = entities;

            this._inspector.link(entities);

            const fieldName = this._inspector.getField(this._getPathTo('name'));

            // if the name already exists show error
            fieldName.onValidate = (value) => {
                if (!value) {
                    return false;
                }

                const groupedClips = getClipsGroupedByName(entities);
                if (groupedClips[value]) {
                    return false;
                }

                return true;
            };
        }

        unlink() {
            this._entities = null;
            this._inspector.unlink();
        }

        destroy() {
            if (this._destroyed) return;

            if (this._templateOverridesInspector) {
                this._templateOverridesInspector.unregisterElementForPath(`components.sprite.clips.${this._clipKeys[0]}`);
            }

            super.destroy();
        }
    }

    return {
        SpriteComponentInspector: SpriteComponentInspector
    };
})());
