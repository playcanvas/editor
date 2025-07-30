export type AttributeReference = {
    /** The name of the reference. */
    name?: string;
    /** The title of the reference. */
    title?: string;
    /** The subtitle of the reference. */
    subTitle?: string;
    /** The WebGL2 version of the reference. */
    webgl2?: boolean;
    /** The description of the reference. */
    description?: string;
    /** The URL of the reference. */
    url?: string;
    /** The code of the reference. */
    code?: string;
};

export type LegacyAttributeReference = {
    /** The name of the reference. */
    name: string;
    /** The title of the reference. */
    title: string;
    /** The subtitle of the reference. */
    subTitle?: string;
    /** The description of the reference. */
    description?: string;
    /** The URL of the reference. */
    url?: string;
};
