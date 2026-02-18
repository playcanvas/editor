/* eslint-disable no-unused-vars */
type Promisifiable<T> = { promisify(): Promise<T> };

type Globals = typeof import('@playcanvas/editor-api').globals;
type OriginalRest = import('@playcanvas/editor-api').Rest;

interface DiffJobData {
    merge_id: string;
    project_id: number;
    src_branch_id: string;
    dst_branch_id: string;
}

interface DiffJob {
    id: number;
    status: 'complete' | 'running' | 'error';
    messages?: string[];
    data: DiffJobData;
}

interface DiffResult {
    numConflicts: number;
    isDiff: boolean;
}

interface CheckpointListResponse {
    result: { id: string }[];
}

interface EditorRest extends Omit<OriginalRest, 'diff' | 'jobs' | 'branches'> {
    diff: Omit<OriginalRest['diff'], 'diffCreate'> & {
        diffCreate(args: OriginalRest['diff']['DiffCreateArgs']): Promisifiable<DiffJob>;
        diffGet(args: { id: string }): Promisifiable<DiffResult>;
    };
    jobs: Omit<OriginalRest['jobs'], 'jobGet'> & {
        jobGet(args: { jobId: number }): Promisifiable<DiffJob>;
    };
    branches: Omit<OriginalRest['branches'], 'branchCheckpoints'> & {
        branchCheckpoints(args: OriginalRest['branches']['BranchCheckpointArgs']): Promisifiable<CheckpointListResponse>;
    };
}

interface Window {
    config: import('@playcanvas/editor-api').EditorConfig;

    editor: {
        call(method: string, ...args: unknown[]): unknown;
        on(event: string, callback: (...args: never[]) => void): { unbind(): void };
        api: {
            globals: Omit<Globals, 'rest'> & { rest: EditorRest };
        };
    };
}
