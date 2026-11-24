// generated, do not edit (c8c90f07159fbc9e945f56427f5a2aed1b38ca56)
/**
 * The editor's load-time migrations as pure functions over plain documents, so a backend can
 * upgrade a document before any editor opens it. Each one is idempotent. Fields the editor only
 * drops locally (`unsetLocal`) are kept, as the hosted documents keep them.
 */

// stored documents are arbitrary json; every read here is guarded at runtime
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MigrationDocument = Record<string, any>;

type Doc = MigrationDocument;

// engine constants, inlined so this file has no imports and is copied into the editor as is
const FITMODE_STRETCH = 'stretch';
const LAYERID_WORLD = 0;
const LAYERID_DEPTH = 1;
const LAYERID_SKYBOX = 2;
const LAYERID_IMMEDIATE = 3;
const LAYERID_UI = 4;
const SHADOW_VSM8 = 1;
const SHADOW_VSM16 = 2;
const SHADOWUPDATE_REALTIME = 2;
const LOAD_SCRIPT_AS_ASSET = 0;
const GAMMA_NONE = 0;
const GAMMA_SRGB = 1;
const DEVICETYPE_WEBGL2 = 'webgl2';
const DEVICETYPE_WEBGPU = 'webgpu';

// old documents get the value that keeps their behaviour, which is not always the schema default
const COMPONENT_DEFAULTS: Record<string, Record<string, unknown>> = {
    camera: { frustumCulling: false },
    light: {
        isStatic: false,
        bake: false,
        bakeDir: true,
        affectDynamic: true,
        affectSpecularity: true,
        shape: 0,
        shadowType: 0,
        numCascades: 1,
        cascadeDistribution: 0.5,
        vsmBlurMode: 0,
        vsmBlurSize: 5,
        vsmBias: 0.01 * 0.25,
        penumbraSize: 1,
        penumbraFalloff: 1,
        cookieAsset: null,
        cookieIntensity: 1,
        cookieFalloff: true,
        cookieChannel: 'rgb',
        cookieAngle: 0,
        cookieScale: [1, 1],
        cookieOffset: [0, 0],
        shadowIntensity: 1
    },
    rigidbody: { rollingFriction: 0 },
    model: {
        isStatic: false,
        lightmapped: false,
        castShadowsLightmap: true,
        lightmapSizeMultiplier: 1,
        batchGroupId: null
    },
    element: {
        useInput: false,
        fitMode: FITMODE_STRETCH,
        alignment: [0.5, 0.5],
        wrapLines: false,
        batchGroupId: null,
        mask: false,
        spriteAsset: null,
        spriteFrame: 0,
        pixelsPerUnit: null,
        outlineColor: [0, 0, 0, 1],
        outlineThickness: 0,
        shadowColor: [0, 0, 0, 1],
        shadowOffset: [0, 0],
        autoFitWidth: false,
        autoFitHeight: false,
        maxLines: null,
        minFontSize: 8,
        enableMarkup: false
    },
    scrollview: { useMouseWheel: true, mouseWheelSensitivity: [1, 1] },
    screen: { priority: 0 },
    sprite: { width: 1, height: 1, drawOrder: 0 },
    layoutchild: { excludeFromLayout: false },
    anim: { normalizeWeights: true },
    particlesystem: {
        emitterRadiusInner: 0,
        emitterExtentsInner: [0, 0, 0],
        orientation: 0,
        particleNormal: [0, 1, 0],
        radialSpeedGraph: { type: 1, keys: [0, 0], betweenCurves: false },
        radialSpeedGraph2: { type: 1, keys: [0, 0] },
        localSpace: false,
        screenSpace: false,
        animStartFrame: 0,
        animNumAnimations: 1,
        animIndex: 0,
        randomizeAnimIndex: false
    },
    collision: { linearOffset: [0, 0, 0], angularOffset: [0, 0, 0] }
};

const COMPONENT_LAYERS: Record<string, number[]> = {
    camera: [LAYERID_WORLD, LAYERID_DEPTH, LAYERID_SKYBOX, LAYERID_IMMEDIATE, LAYERID_UI],
    light: [LAYERID_WORLD],
    model: [LAYERID_WORLD],
    element: [LAYERID_UI],
    sprite: [LAYERID_WORLD],
    particlesystem: [LAYERID_WORLD]
};

const LEGACY_LIGHTMAP = ['castShadowsLightMap', 'lightMapped', 'lightMapSizeMultiplier', 'static'];

const MATERIAL_DEFAULTS: Record<string, unknown> = {
    useFog: true,
    useLighting: true,
    useSkybox: true,
    alphaToCoverage: false,
    twoSidedLighting: false,
    opacityFadesSpecular: true,
    alphaFade: 1,
    clearCoat: 0,
    clearCoatMap: null,
    clearCoatMapChannel: 'r',
    clearCoatMapUv: 0,
    clearCoatMapTiling: [1, 1],
    clearCoatMapOffset: [0, 0],
    clearCoatVertexColor: false,
    clearCoatVertexColorChannel: 'r',
    clearCoatGlossMap: null,
    clearCoatGlossMapChannel: 'r',
    clearCoatGlossMapUv: 0,
    clearCoatGlossMapTiling: [1, 1],
    clearCoatGlossMapOffset: [0, 0],
    clearCoatGlossVertexColor: false,
    clearCoatGlossVertexColorChannel: 'r',
    clearCoatBumpiness: 1,
    clearCoatNormalMap: null,
    clearCoatNormalMapUv: 0,
    clearCoatNormalMapTiling: [1, 1],
    clearCoatNormalMapOffset: [0, 0]
};

const LEGACY_TINTS = [
    ['diffuseMapTint', 'diffuseTint'],
    ['specularMapTint', 'specularTint'],
    ['emissiveMapTint', 'emissiveTint'],
    ['metalnessMapTint', 'metalnessTint']
];

const TINTS = ['ambientTint', 'diffuseTint', 'emissiveTint', 'metalnessTint', 'sheenTint', 'sheenGlossTint'];

const TEXTURE_COMPRESS: Record<string, unknown> = {
    normals: false,
    pvr: false,
    pvrBpp: 4,
    etc1: false,
    etc2: false,
    basis: false,
    quality: 128,
    compressionMode: 'etc'
};

const DEFAULT_LAYERS = {
    0: { name: 'World', opaqueSortMode: 2, transparentSortMode: 3 },
    1: { name: 'Depth', opaqueSortMode: 2, transparentSortMode: 3 },
    2: { name: 'Skybox', opaqueSortMode: 0, transparentSortMode: 3 },
    3: { name: 'Immediate', opaqueSortMode: 0, transparentSortMode: 3 },
    4: { name: 'UI', opaqueSortMode: 1, transparentSortMode: 1 }
};

const DEFAULT_LAYER_ORDER: [number, boolean][] = [
    [LAYERID_WORLD, false],
    [LAYERID_DEPTH, false],
    [LAYERID_SKYBOX, false],
    [LAYERID_WORLD, true],
    [LAYERID_IMMEDIATE, false],
    [LAYERID_IMMEDIATE, true],
    [LAYERID_UI, true]
];

const has = (o: Doc, key: string) => Object.prototype.hasOwnProperty.call(o, key);

const fill = (o: Doc, defaults: Record<string, unknown>) => {
    for (const key in defaults) {
        if (!has(o, key)) {
            o[key] = structuredClone(defaults[key]);
        }
    }
};

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Upgrades one scene entity in place.
 *
 * @param e - The entity.
 * @param notes - Collects what changed that a user should hear about.
 */
const entity = (e: Doc, notes: string[]) => {
    if (!has(e, 'tags')) {
        e.tags = [];
    }
    const c: Doc = e.components ?? {};

    for (const name of ['model', 'render']) {
        for (const key of LEGACY_LIGHTMAP) {
            if (c[name] && has(c[name], key)) {
                delete c[name][key];
            }
        }
    }

    for (const name in COMPONENT_DEFAULTS) {
        const comp = c[name];
        if (!comp) {
            continue;
        }
        if (name === 'light') {
            // affectLightMapped is the old spelling; the editor keeps it on the server
            if (has(comp, 'affectLightMapped')) {
                comp.affectLightmapped = comp.affectLightMapped;
            } else if (!has(comp, 'affectLightmapped')) {
                comp.affectLightmapped = false;
            }
            if (comp.shadowUpdateMode === null || isNaN(comp.shadowUpdateMode)) {
                comp.shadowUpdateMode = SHADOWUPDATE_REALTIME;
            }
        }
        if (name === 'element') {
            const color = comp.color;
            let opacity = 1;
            if (Array.isArray(color) && color.length > 3) {
                opacity = color[3];
                comp.color = color.slice(0, 3);
            }
            if (!has(comp, 'opacity')) {
                comp.opacity = opacity;
            }
            for (const key of ['autoWidth', 'autoHeight']) {
                if (!has(comp, key)) {
                    comp[key] = comp.type === 'text';
                }
            }
            if (!has(comp, 'maxFontSize')) {
                comp.maxFontSize = comp.fontSize || 32;
            }
        }
        fill(comp, COMPONENT_DEFAULTS[name]);
        if (COMPONENT_LAYERS[name] && !has(comp, 'layers')) {
            comp.layers = [...COMPONENT_LAYERS[name]];
        }
        if (name === 'light' && comp.shadowType === SHADOW_VSM8) {
            comp.shadowType = SHADOW_VSM16;
            notes.push(`entity ${e.resource_id}: light shadowType SHADOW_VSM8 is deprecated, set to SHADOW_VSM16`);
        }
    }
};

/**
 * Upgrades a material's data in place.
 *
 * @param d - The material data.
 * @param notes - Collects what changed that a user should hear about.
 */
const material = (d: Doc, notes: string[]) => {
    fill(d, MATERIAL_DEFAULTS);

    // the editor keeps useGamma on the server, so this runs on every load, as it does there
    if (has(d, 'useGamma')) {
        d.useTonemap = d.useGamma ?? true;
        notes.push('material useGamma is no longer supported, switched to useTonemap');
    }
    if (!d.cubeMapProjectionBox) {
        d.cubeMapProjectionBox = { center: [0, 0, 0], halfExtents: [0.5, 0.5, 0.5] };
    }
    if (!has(d, 'alphaDither') || d.alphaDither === null) {
        const dithered = (d.opacityDither ?? 'none') !== 'none' || (d.opacityShadowDither ?? 'none') !== 'none';
        d.alphaDither = dithered ? (d.opacity ?? 1) : 1;
    }
    if (!has(d, 'anisotropyIntensity') || !has(d, 'anisotropyRotation')) {
        const anisotropy = d.anisotropy ?? 0;
        d.anisotropyIntensity = Math.abs(anisotropy);
        d.anisotropyRotation = anisotropy >= 0 ? 0 : 90;
    }
    if (!has(d, 'clearCoatGloss')) {
        d.clearCoatGloss = has(d, 'clearCoatGlossiness') ? d.clearCoatGlossiness : 1;
    }
    if (d.shader !== 'blinn') {
        d.shader = 'blinn';
        notes.push('material shader is no longer supported, switched to Physical');
    }
    if (has(d, 'fresnelModel') && d.fresnelModel !== 2) {
        notes.push('material fresnelModel is no longer supported, switched to Schlick');
    }

    for (const [old, cur] of LEGACY_TINTS) {
        if (has(d, old) && !has(d, cur)) {
            d[cur] = d[old];
        }
    }
    for (const tint of TINTS) {
        if (d[tint]) {
            continue;
        }
        d[tint] = true;
        const path = tint.replace(/Tint$/, '');
        const map = tint.replace(/Tint$/, 'Map').replace('ambient', 'ao');

        // with the tint off the color did nothing, so it becomes neutral rather than tinting now
        if (path === 'ambient' || ((path === 'diffuse' || path === 'emissive') && d[map])) {
            if (!same(d[path], [1, 1, 1])) {
                notes.push(`material ${path} set to neutral as ${tint} was false`);
            }
            d[path] = [1, 1, 1];
        }
    }
};

/**
 * Upgrades a texture or texture atlas asset in place.
 *
 * @param a - The asset.
 */
const texture = (a: Doc) => {
    if (a.source) {
        return;
    }
    if (a.meta) {
        if (!has(a.meta, 'compress')) {
            const alpha = a.meta.alpha || `${a.meta.type ?? ''}`.toLowerCase() === 'truecoloralpha';
            a.meta.compress = { alpha, dxt: false, ...TEXTURE_COMPRESS };
        } else {
            fill(a.meta.compress, TEXTURE_COMPRESS);
        }
    }
    if (a.data && !has(a.data, 'mipmaps')) {
        a.data.mipmaps = true;
    }
};

/**
 * Upgrades an asset document.
 *
 * @param doc - The asset.
 * @returns The upgraded copy, and what changed that a user should hear about.
 */
export const migrateAsset = (doc: Doc) => {
    const a = structuredClone(doc);
    const notes: string[] = [];
    if (!has(a, 'i18n')) {
        a.i18n = {};
    }
    switch (a.type) {
        case 'material': {
            if (a.data) {
                material(a.data, notes);
            }
            break;
        }
        case 'texture':
        case 'textureatlas': {
            texture(a);
            break;
        }
        case 'font': {
            // referenced fonts keep intensity in their json descriptor
            const referenced = a.data?.jsonAsset !== null && a.data?.jsonAsset !== undefined;
            if (!a.source && a.data && !referenced && !has(a.data, 'intensity')) {
                a.data.intensity = 0;
            }
            break;
        }
        case 'script': {
            if (a.data && !has(a.data, 'loadingType')) {
                a.data.loadingType = LOAD_SCRIPT_AS_ASSET;
            }
            break;
        }
    }
    return { doc: a, notes };
};

/**
 * Upgrades a scene document: its entities and its settings.
 *
 * @param doc - The scene.
 * @returns The upgraded copy, and what changed that a user should hear about.
 */
export const migrateScene = (doc: Doc) => {
    const s = structuredClone(doc);
    const notes: string[] = [];
    for (const e of Object.values<Doc>(s.entities ?? {})) {
        entity(e, notes);
    }
    const render = s.settings?.render;
    if (render && render.gamma_correction !== GAMMA_NONE && render.gamma_correction !== GAMMA_SRGB) {
        notes.push(`scene render.gamma_correction set from ${render.gamma_correction} to ${GAMMA_SRGB}`);
        render.gamma_correction = GAMMA_SRGB;
    }
    return { doc: s, notes };
};

/**
 * Upgrades a project settings document.
 *
 * @param doc - The project settings.
 * @returns The upgraded copy, and what changed that a user should hear about.
 */
export const migrateProjectSettings = (doc: Doc) => {
    const s = structuredClone(doc);
    const notes: string[] = [];

    if (!has(s, 'engineV2')) {
        s.engineV2 = false;
    }
    if (s.useLegacyScripts) {
        notes.push('the useLegacyScripts project setting has been removed');
    }
    s.useLegacyScripts = false;

    // preferWebGl2 and deviceTypes stay on the server, so these run on every load, as they do there
    if (has(s, 'preferWebGl2')) {
        s.enableWebGl2 = s.preferWebGl2;
    }
    if (!has(s, 'enableGlslTranspilation')) {
        s.enableGlslTranspilation = has(s, 'enableWebGpu')
            ? !!s.enableWebGpu
            : s.deviceTypes?.[0] === DEVICETYPE_WEBGPU;
    }
    if (s.deviceTypes?.length) {
        s.enableWebGpu = s.deviceTypes[0] === DEVICETYPE_WEBGPU;
        s.enableWebGl2 = s.deviceTypes[0] === DEVICETYPE_WEBGL2;
    }

    if (!s.batchGroups) {
        s.batchGroups = {};
    }
    if (!s.layers) {
        s.layers = structuredClone(DEFAULT_LAYERS);
        s.layerOrder = DEFAULT_LAYER_ORDER.map(([layer, transparent]) => ({ layer, transparent, enabled: true }));
    }
    for (const key of ['useKeyboard', 'useMouse', 'useTouch']) {
        if (s[key] === null) {
            s[key] = true;
        }
    }
    if (s.useGamepads === null) {
        s.useGamepads = !!s.vr;
    }
    for (const key of ['i18nAssets', 'externalScripts']) {
        if (!s[key]) {
            s[key] = [];
        }
    }
    if (s.powerPreference === null) {
        s.powerPreference = 'high-performance';
    }
    if (s.maxAssetRetries === null) {
        s.maxAssetRetries = 0;
    }
    if (!s.enableSharedArrayBuffer) {
        s.enableSharedArrayBuffer = false;
    }
    return { doc: s, notes };
};
