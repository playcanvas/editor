export type Branch = {
    /**
     * The ID of the branch
     */
    id: string;

    /**
     * The ID of the project
     */
    projectId: number;

    /**
     * The ID of the user who created the branch
     */
    userId: number;

    /**
     * The name of the branch
     */
    name: string;

    /**
     * The date the branch was created
     */
    createdAt: string;

    /**
     * Whether the branch is closed
     */
    closed: boolean;

    /**
     * Whether the branch is permanent
     */
    permanent: boolean;

    /**
     * The ID of the latest checkpoint
     */
    latestCheckpointId: string;
};

export type Checkpoint = {
    /**
     * The ID of the checkpoint
     */
    id: string;

    /**
     * The ID of the branch
     */
    branchId: string;

    /**
     * The ID of the project
     */
    projectId: number;

    /**
     * The ID of the user who created the checkpoint
     */
    userId: number;

    /**
     * The size of the checkpoint in bytes
     */
    size: number;

    /**
     * The version format of the checkpoint
     */
    version: string;

    /**
     * The date the checkpoint was created
     */
    createdAt: string;

    /**
     * The description of the checkpoint
     */
    description: string;
};

export type Conflict = {
    /**
     * The ID of the conflict
     */
    id: string;

    /**
     * The ID of the merge
     */
    mergeId: string;

    /**
     * The ID of the item
     */
    itemId: string;

    /**
     * The type of the item
     */
    itemType: string;

    /**
     * The name of the item
     */
    itemName: string;

    /**
     * The type of the asset
     */
    assetType: string;

    /**
     * The path of the item
     */
    path: string;

    /**
     * The base value of the item
     */
    baseValue: string;

    /**
     * The source value of the item
     */
    srcValue: string;

    /**
     * The destination value of the item
     */
    dstValue: string;

    /**
     * Whether to use the source value
     */
    useSrc: boolean;

    /**
     * Whether to use the destination value
     */
    useDst: boolean;

    /**
     * Whether to use the merged file
     */
    useMergedFile: boolean;

    /**
     * The path of the merged file
     */
    mergedFilePath: string;

    /**
     * The type of the base value
     */
    baseType: string;

    /**
     * The type of the source value
     */
    srcType: string;

    /**
     * The type of the destination value
     */
    dstType: string;

    /**
     * The immutable backup of the base value
     */
    baseImmutableBackup: string;

    /**
     * The immutable backup of the source value
     */
    srcImmutableBackup: string;

    /**
     * The immutable backup of the destination value
     */
    dstImmutableBackup: string;

    /**
     * The filename of the base value
     */
    baseFilename: string;

    /**
     * The filename of the source value
     */
    srcFilename: string;

    /**
     * The filename of the destination value
     */
    dstFilename: string;

    /**
     * Whether the base value is missing
     */
    missingInBase?: boolean;

    /**
     * Whether the source value is missing
     */
    missingInSrc?: boolean;

    /**
     * Whether the destination value is missing
     */
    missingInDst?: boolean;

    /**
     * Whether the source value is too big
     */
    srcTooBig?: boolean;

    /**
     * Whether the destination value is too big
     */
    dstTooBig?: boolean;

    /**
     * Whether the base value is too big
     */
    baseTooBig?: boolean;

    /**
     * Whether the merge is textual
     */
    isTextualMerge?: boolean;
};

type ConflictGroupedFields =
    | 'itemId'
    | 'itemType'
    | 'itemName'
    | 'assetType'
    | 'baseImmutableBackup'
    | 'srcImmutableBackup'
    | 'dstImmutableBackup'
    | 'baseFilename'
    | 'srcFilename'
    | 'dstFilename';

export type Merge = {
    /**
     * The ID of the merge
     */
    id: string;

    /**
     * The ID of the source branch
     */
    sourceBranchId: string;

    /**
     * The ID of the source checkpoint
     */
    sourceCheckpointId: string;

    /**
     * The ID of the destination branch
     */
    destinationBranchId: string;

    /**
     * The ID of the destination checkpoint
     */
    destinationCheckpointId: string;

    /**
     * The ID of the project
     */
    projectId: number;

    /**
     * The ID of the user who created the merge
     */
    userId: number;

    /**
     * The date the merge was created
     */
    createdAt: string;

    /**
     * The number of conflicts in the merge
     */
    numConflicts: number;

    /**
     * Whether the merge is a diff
     */
    isDiff: boolean;

    /**
     * The expiration time of the merge
     */
    expirationTime?: string;

    /**
     * The progress status of the merge
     */
    mergeProgressStatus?: string;

    /**
     * Whether to close the source branch after merging
     */
    sourceBranchClose?: boolean;

    /**
     * The conflicts of the merge
     */
    conflicts?: (Pick<Conflict, ConflictGroupedFields> & {
        /**
         * The conflict data without the grouped fields
         */
        data: Omit<Conflict, ConflictGroupedFields>[];
    })[];

    /**
     * Source checkpoint
     */
    srcCheckpoint?: {
        /**
         * The assets of the source checkpoint
         */
        assets: Record<string, string>;

        /**
         * The scenes of the source checkpoint
         */
        scenes: Record<string, Record<string, string>>;

        /**
         * The settings of the source checkpoint
         */
        settings: Record<string, any>;
    };

    /**
     * Destination checkpoint
     */
    dstCheckpoint?: {
        /**
         * The assets of the destination checkpoint
         */
        assets: Record<string, string>;

        /**
         * The scenes of the destination checkpoint
         */
        scenes: Record<string, Record<string, string>>;

        /**
         * The settings of the destination checkpoint
         */
        settings: Record<string, any>;
    };
};

type DiffHiddenFields =
    | 'useSrc'
    | 'useDst'
    | 'useMergedFile'
    | 'baseType'
    | 'baseImmutableBackup'
    | 'baseFilename'
    | 'missingInBase'
    | 'baseTooBig';

export type Diff = Omit<Merge, 'conflicts'> & {
    /**
     * The grouped conflicts of the diff
     */
    conflicts?: (Pick<Conflict, ConflictGroupedFields> & {
        /**
         * The conflict data without the grouped fields
         */
        data: Omit<Conflict, ConflictGroupedFields & DiffHiddenFields>[];
    })[];
};

export type User = {
    /**
     * The ID of the user
     */
    id: string;

    /**
     * The email of the user
     */
    email: string;

    /**
     * The full name of the user
     */
    fullName: string;

    /**
     * The username of the user
     */
    username: string;
};

export type Job<T extends object> = {
    /**
     * The unique identifier for the job.
     */
    id: number;

    /**
     * The scope of the job.
     */
    scope: {
        /**
         * The ID of the scope.
         */
        id: number;

        /**
         * The type of the scope.
         */
        type: string;
    };

    /**
     * The time when the job was created.
     */
    created_at: string;

    /**
     * The time when the job was last modified.
     */
    modified_at: string;

    /**
     * The status of the job.
     */
    status: 'complete' | 'running' | 'error';

    /**
     * The job data.
     */
    data: T;
};
