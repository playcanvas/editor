import { glbJson, isJson, json } from './model';

// port of pipeline/jobs/animation-meta generateMetaJson / generateMetaGlb

export type AnimationMeta = {
    name: string;
    duration: number;
};

const fromGlb = (json: any): AnimationMeta => {
    if (!Object.hasOwn(json, 'animations') || !json.animations.length) {
        throw new Error('no animations found');
    }

    // first take only, spanning every scalar sampler input
    const animation = json.animations[0];
    let valid = false;
    let min = 0;
    let max = 0;
    for (const sampler of animation.samplers) {
        const acc = json.accessors[sampler.input];
        if (acc && acc.type === 'SCALAR' && acc.min && acc.min.length === 1 && acc.max && acc.max.length === 1) {
            min = valid ? Math.min(min, acc.min[0]) : acc.min[0];
            max = valid ? Math.max(max, acc.max[0]) : acc.max[0];
            valid = true;
        }
    }
    return { name: animation.name, duration: max - min };
};

/**
 * The meta pipeline.animation.meta would write. Throws where the job would fail.
 *
 * @param bytes - a json or glb animation file
 * @param name - file name; the server reads a .json file as json and anything else as a GLB
 */
export const animationMeta = (bytes: Uint8Array, name = ''): AnimationMeta => {
    if (!isJson(name)) {
        return fromGlb(glbJson(bytes));
    }
    const { animation } = json(bytes);
    return { name: animation.name, duration: animation.duration };
};
