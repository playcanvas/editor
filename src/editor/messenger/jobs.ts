import { Defer } from '@/common/defer';

const { rest } = editor.api.globals;

type JobStart = {
    promisify: () => Promise<{ id: number }>;
};

type DiffJob = Awaited<ReturnType<ReturnType<typeof rest.diff.diffCreate>['promisify']>>;
type Checkpoint = Awaited<ReturnType<ReturnType<typeof rest.checkpoints.checkpointGet>['promisify']>>;

const waitForJob = <T extends object>(request: JobStart, message: string) => {
    const defer = new Defer<{ id: number }>();
    const promise = new Promise<T>((resolve, reject) => {
        const jobUpdate = editor.on('messenger:job.update', ({ job: jobData }: { job: { id: number } }) => {
            defer.promise.then((job) => {
                if (jobData.id !== job.id) {
                    return;
                }
                jobUpdate.unbind();

                rest.jobs.jobGet({ jobId: job.id }).promisify().then((completedJob) => {
                    if (completedJob.status === 'error') {
                        reject(new Error(completedJob.messages?.[0] ?? message));
                        return;
                    }
                    resolve(completedJob.data as T);
                }).catch(reject);
            }).catch(reject);
        });

        request.promisify().then(defer.resolve).catch((err) => {
            jobUpdate.unbind();
            reject(err);
        });
    });
    return promise;
};

export const checkpointCreate = (args: Parameters<typeof rest.checkpoints.checkpointCreate>[0]) => {
    return waitForJob<Checkpoint>(rest.checkpoints.checkpointCreate(args), 'Checkpoint create failed');
};

export const diffCreate = (args: Parameters<typeof rest.diff.diffCreate>[0]) => {
    return waitForJob<DiffJob['data']>(rest.diff.diffCreate(args), 'Checkpoint diff failed').then((data) => {
        return rest.diff.diffGet({ id: data.merge_id }).promisify();
    });
};
