import { zipSync } from 'fflate';
import type { Zippable } from 'fflate';

// already-compressed formats gain nothing from deflate
const STORED = /\.(png|jpe?g|webp|avif|gif|dds|basis|ktx2?|zip)$/i;

export type ZipFile = { path: string; data: Uint8Array };

export const zipFiles = (files: ZipFile[]) => {
    const tree: Zippable = {};
    for (const f of files) {
        tree[f.path] = [f.data, { level: STORED.test(f.path) ? 0 : 6 }];
    }
    return zipSync(tree);
};
