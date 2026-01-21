import type { AttributeReference } from '../reference.type';

export const fields: AttributeReference[]  = [{
    name: 'layoutgroup:component',
    title: 'pc.LayoutGroupComponent',
    subTitle: '{pc.Component}',
    description: 'The Layout Group Component enables an Entity to position and scale child Element Components according to configurable layout rules.',
    url: 'https://api.playcanvas.com/engine/classes/LayoutGroupComponent.html'
}, {
    name: 'layoutgroup:orientation',
    title: 'orientation',
    subTitle: '{pc.ORIENTATION_*}',
    description: `Whether the layout should run horizontally or vertically.
<ul>
<li><b>Horizontal</b> (<code>pc.ORIENTATION_HORIZONTAL</code>): Child elements are arranged horizontally (left to right).</li>
<li><b>Vertical</b> (<code>pc.ORIENTATION_VERTICAL</code>): Child elements are arranged vertically (top to bottom).</li>
</ul>`,
    url: 'https://api.playcanvas.com/engine/classes/LayoutGroupComponent.html#orientation'
}, {
    name: 'layoutgroup:reverseX',
    title: 'reverseX',
    subTitle: '{Boolean}',
    description: 'Reverses the order of elements on the X axis.',
    url: 'https://api.playcanvas.com/engine/classes/LayoutGroupComponent.html#reversex'
}, {
    name: 'layoutgroup:reverseY',
    title: 'reverseY',
    subTitle: '{Boolean}',
    description: 'Reverses the order of elements on the Y axis.',
    url: 'https://api.playcanvas.com/engine/classes/LayoutGroupComponent.html#reversey'
}, {
    name: 'layoutgroup:alignment',
    title: 'alignment',
    subTitle: '{pc.Vec2}',
    description: 'Specifies the horizontal and vertical alignment of child elements. Values range from 0 to 1 where [0,0] is the bottom left and [1,1] is the top right.',
    url: 'https://api.playcanvas.com/engine/classes/LayoutGroupComponent.html#alignment'
}, {
    name: 'layoutgroup:padding',
    title: 'padding',
    subTitle: '{pc.Vec4}',
    description: 'Padding to be applied inside the container before positioning any children. Specified as left, bottom, right and top values.',
    url: 'https://api.playcanvas.com/engine/classes/LayoutGroupComponent.html#padding'
}, {
    name: 'layoutgroup:spacing',
    title: 'spacing',
    subTitle: '{pc.Vec2}',
    description: 'Spacing to be applied between each child element.',
    url: 'https://api.playcanvas.com/engine/classes/LayoutGroupComponent.html#spacing'
}, {
    name: 'layoutgroup:widthFitting',
    title: 'widthFitting',
    subTitle: '{pc.FITTING_*}',
    description: `Fitting logic to be applied when positioning and scaling child elements horizontally.
<ul>
<li><b>None</b> (<code>pc.FITTING_NONE</code>): Child widths are not modified.</li>
<li><b>Stretch</b> (<code>pc.FITTING_STRETCH</code>): Children are stretched to fill available space.</li>
<li><b>Shrink</b> (<code>pc.FITTING_SHRINK</code>): Children are shrunk to fit within the container.</li>
<li><b>Both</b> (<code>pc.FITTING_BOTH</code>): Children are both stretched and shrunk as needed.</li>
</ul>`,
    url: 'https://api.playcanvas.com/engine/classes/LayoutGroupComponent.html#widthfitting'
}, {
    name: 'layoutgroup:heightFitting',
    title: 'heightFitting',
    subTitle: '{pc.FITTING_*}',
    description: `Fitting logic to be applied when positioning and scaling child elements vertically.
<ul>
<li><b>None</b> (<code>pc.FITTING_NONE</code>): Child heights are not modified.</li>
<li><b>Stretch</b> (<code>pc.FITTING_STRETCH</code>): Children are stretched to fill available space.</li>
<li><b>Shrink</b> (<code>pc.FITTING_SHRINK</code>): Children are shrunk to fit within the container.</li>
<li><b>Both</b> (<code>pc.FITTING_BOTH</code>): Children are both stretched and shrunk as needed.</li>
</ul>`,
    url: 'https://api.playcanvas.com/engine/classes/LayoutGroupComponent.html#heightfitting'
}, {
    name: 'layoutgroup:wrap',
    title: 'wrap',
    subTitle: '{Boolean}',
    description: 'Whether or not to wrap children onto a new row/column when the size of the container is exceeded.',
    url: 'https://api.playcanvas.com/engine/classes/LayoutGroupComponent.html#wrap'
}];
