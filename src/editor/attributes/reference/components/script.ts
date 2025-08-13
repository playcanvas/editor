import type { AttributeReference } from '../reference.type.ts';

export const fields: AttributeReference[]  = [{
    name: 'script:component',
    title: 'pc.ScriptComponent',
    subTitle: '{pc.Component}',
    description: 'The ScriptComponent allows you to extend the functionality of an Entity by attaching your own javascript files to be executed with access to the Entity. For more details on scripting see Scripting.',
    url: 'https://api.playcanvas.com/engine/classes/ScriptComponent.html'
}, {
    name: 'script:scripts',
    title: 'scripts',
    subTitle: '{Object[]}',
    description: 'Add scripts by clicking on the button or drag scripts on the script component.',
    url: 'https://api.playcanvas.com/engine/classes/ScriptComponent.html#scripts'
}];
