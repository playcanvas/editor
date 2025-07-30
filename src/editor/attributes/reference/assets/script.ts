/**
 * @type {AttributeReference[]}
 */
export const fields  = [{
    name: 'asset:script:filename',
    title: 'filename',
    subTitle: '{String}',
    description: 'Filename of a script..'
}, {
    name: 'asset:script:order',
    description: 'Sometimes specific order of loading and executing JS files is required. All preloaded script assets will be loaded in order specified in Project Settings. You can further control when you want a Script Asset to load by changing the Loading Type.'
}, {
    name: 'asset:script:loadingType',
    description: 'This allows you to control when this script will be loaded. The possible values are "Asset" (load as a regular Asset), "Before Engine" (load before the PlayCanvas engine is loaded), "After Engine" (load right after the PlayCanvas engine has loaded)'
}];
