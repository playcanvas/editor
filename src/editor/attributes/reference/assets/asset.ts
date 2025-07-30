import { fields as anim } from './anim.ts';
import { fields as animation } from './animation.ts';
import { fields as audio } from './audio.ts';
import { fields as css } from './css.ts';
import { fields as cubemap } from './cubemap.ts';
import { fields as font } from './font.ts';
import { fields as gsplat } from './gsplat.ts';
import { fields as html } from './html.ts';
import { fields as json } from './json.ts';
import { fields as material } from './material.ts';
import { fields as model } from './model.ts';
import { fields as render } from './render.ts';
import { fields as script } from './script.ts';
import { fields as shader } from './shader.ts';
import { fields as sprite } from './sprite.ts';
import { fields as text } from './text.ts';
import { fields as texture } from './texture.ts';

editor.once('load', () => {
    /**
     * @type {AttributeReference[]}
     */
    const fields  = [
        {
            name: 'asset:id',
            title: 'id',
            subTitle: '{Number}',
            description: 'Unique identifier of an Asset.',
            url: 'https://api.playcanvas.com/engine/classes/Asset.html'
        }, {
            name: 'asset:name',
            title: 'name',
            subTitle: '{String}',
            description: 'The name of the asset.',
            url: 'https://api.playcanvas.com/engine/classes/Asset.html#name'
        }, {
            name: 'asset:type',
            title: 'type',
            subTitle: '{String}',
            description: 'The type of the asset. One of: animation, audio, image, json, material, model, text, texture.',
            url: 'https://api.playcanvas.com/engine/classes/Asset.html#type'
        }, {
            name: 'asset:size',
            description: 'Size of an asset. Keeping this value as tiny as possible will lead to faster application loading and less bandwidth required to launch the app.'
        }, {
            name: 'asset:source',
            description: 'Reference to another asset where this asset were imported from.'
        }, {
            name: 'asset:created',
            description: 'Date the asset was created.'
        }, {
            name: 'asset:license',
            description: 'The license type of the asset.'
        }, {
            name: 'asset:author',
            description: 'The author of the asset.'
        }, {
            name: 'asset:tags',
            title: 'tags',
            subTitle: '{pc.Tags}',
            description: 'Interface for tagging assets. Allows to find assets by tags using app.assets.findByTag method.',
            url: 'https://api.playcanvas.com/engine/classes/Asset.html#tags'
        }, {
            name: 'asset:runtime',
            description: 'If this asset is runtime-friendly and can be used within the app.'
        }, {
            name: 'asset:exclude',
            title: 'exclude',
            subTitle: '{Boolean}',
            description: 'Exclude asset from the project. If true, the asset will not be available at runtime and not be included in published builds.'
        }, {
            name: 'asset:preload',
            title: 'preload',
            subTitle: '{Boolean}',
            description: 'If true the asset will be loaded during the preload phase of application set up.',
            url: 'https://api.playcanvas.com/engine/classes/Asset.html#preload'
        }, {
            name: 'asset:bundles',
            description: 'If the asset is included in any Asset Bundles then these are listed here. You can also add the asset to an Asset Bundle by using the dropdown.'
        }, {
            name: 'asset:localization',
            title: 'LOCALIZATION',
            description: 'Here you can define a replacement asset to be used for a particular locale. When the application\'s locale changes then references to this asset will use the replacement asset for the new locale.'
        },
        ...anim,
        ...animation,
        ...audio,
        ...css,
        ...cubemap,
        ...font,
        ...gsplat,
        ...html,
        ...json,
        ...material,
        ...model,
        ...render,
        ...script,
        ...shader,
        ...sprite,
        ...text,
        ...texture
    ];

    for (let i = 0; i < fields.length; i++) {
        editor.call('attributes:reference:add', fields[i]);
    }
});
