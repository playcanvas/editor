import { backend, UNSUPPORTED } from '@/common/backend';
import { Defer } from '@/common/defer';
import type { Rest } from '@/editor-api';

type JobStart<T extends object> = {
    promisify: () => Promise<{ id: number; data: T }>;
};

type DiffJob = Awaited<ReturnType<ReturnType<Rest['diff']['diffCreate']>['promisify']>>;
type Checkpoint = Awaited<ReturnType<ReturnType<Rest['checkpoints']['checkpointGet']>['promisify']>>;

const waitForJob = <T extends object>(jobs: Rest['jobs'], request: JobStart<T>, message: string) => {
    const defer = new Defer<{ id: number; data: T }>();
    const promise = new Promise((resolve, reject) => {
        const jobUpdate = editor.on('messenger:job.update', ({ job: jobData }: { job: { id: number } }) => {
            defer.promise
                .then((job) => {
                    if (jobData.id !== job.id) {
                        return;
                    }
                    jobUpdate.unbind();

                    jobs.jobGet({ jobId: job.id })
                        .promisify()
                        .then((completedJob) => {
                            if (completedJob.status === 'error') {
                                reject(new Error(completedJob.messages?.[0] ?? message));
                                return;
                            }
                            resolve({
                                job,
                                completedJob
                            });
                        })
                        .catch(reject);
                })
                .catch(reject);
        });

        request
            .promisify()
            .then(defer.resolve)
            .catch((err) => {
                jobUpdate.unbind();
                reject(err);
            });
    });
    return promise;
};

export const projectExport = (args: Parameters<Rest['projects']['projectExport']>[0]) => {
    const { projectExport: service, jobs } = backend();
    if (!service || !jobs) {
        return Promise.reject(new Error(UNSUPPORTED));
    }
    const request = service.projectExport(args) as unknown as JobStart<object>;
    return waitForJob(jobs, request, 'Project export failed').then(({ completedJob }) => {
        return (completedJob.data as { url: string }).url;
    });
};

export const checkpointCreate = (args: Parameters<Rest['checkpoints']['checkpointCreate']>[0]) => {
    const { checkpoints, jobs } = backend();
    if (!checkpoints || !jobs) {
        return Promise.reject(new Error(UNSUPPORTED));
    }
    return waitForJob(jobs, checkpoints.checkpointCreate(args), 'Checkpoint create failed').then(({ completedJob }) => {
        return completedJob.data as Checkpoint;
    });
};

export const diffCreate = (args: Parameters<Rest['diff']['diffCreate']>[0]) => {
    const { diffs, jobs } = backend();
    if (!diffs || !jobs) {
        return Promise.reject(new Error(UNSUPPORTED));
    }
    return waitForJob<DiffJob['data']>(jobs, diffs.diffCreate(args), 'Checkpoint diff failed').then(({ job }) => {
        if (!job.data.merge_id) {
            return Promise.reject(new Error('Checkpoint diff missing merge id'));
        }
        return diffs.diffGet({ id: job.data.merge_id }).promisify();
    });
};
