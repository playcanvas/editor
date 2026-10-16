import { Label } from '@playcanvas/pcui';
import type { LabelArgs } from '@playcanvas/pcui';

/**
 * A boxed message in the warning or danger tone, e.g. what a delete also affects.
 */
export const callout = ({ tone, class: cls, ...args }: LabelArgs & { tone: 'warn' | 'danger' }) =>
    new Label({ ...args, class: ['pm-callout', tone, ...[cls ?? []].flat()] });
