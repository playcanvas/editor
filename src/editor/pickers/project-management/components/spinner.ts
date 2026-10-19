import { Element } from '@playcanvas/pcui';
import type { ElementArgs } from '@playcanvas/pcui';

/**
 * The projects page spinner: 12px inline, 16px with `md`; inside a button it centres over the label in white.
 */
export const spinner = ({ size, class: cls, ...args }: ElementArgs & { size?: 'md' } = {}) =>
    new Element({ ...args, class: ['pm-spinner', ...(size ? [size] : []), ...[cls ?? []].flat()] });
