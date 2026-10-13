import { Defer } from '@/common/defer';

const { rest } = editor.api.globals;

type JobStart<T extends object> = {
    promisify: () => Promise<{ id: number; data: T }>;
};

type DiffJob = Awaited<ReturnType<ReturnType<typeof rest.diff.diffCreate>['promisify']>>;
type Checkpoint = Awaited<ReturnType<ReturnType<typeof rest.checkpoints.checkpointGet>['promisify']>>;

const waitForJob = <T extends object>(request: JobStart<T>, message: string) => {
    const defer = new Defer<{ id: number; data: T }>();
    const promise = new Promise((resolve, reject) => {
        const jobUpdate = editor.on('messenger:job.update', ({ job: jobData }: { job: { id: number } }) => {
            defer.promise
                .then((job) => {
                    if (jobData.id !== job.id) {
                        return;
                    }
                    jobUpdate.unbind();

                    rest.jobs
                        .jobGet({ jobId: job.id })
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

export const checkpointCreate = (args: Parameters<typeof rest.checkpoints.checkpointCreate>[0]) => {
    return waitForJob(rest.checkpoints.checkpointCreate(args), 'Checkpoint create failed').then(({ completedJob }) => {
        return completedJob.data as Checkpoint;
    });
};

export const diffCreate = (args: Parameters<typeof rest.diff.diffCreate>[0]) => {
    return waitForJob<DiffJob['data']>(rest.diff.diffCreate(args), 'Checkpoint diff failed').then(({ job }) => {
        if (!job.data.merge_id) {
            return Promise.reject(new Error('Checkpoint diff missing merge id'));
        }
        return rest.diff.diffGet({ id: job.data.merge_id }).promisify();
    });
};
