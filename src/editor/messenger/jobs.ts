import { Defer } from '@/common/defer';

const { rest } = editor.api.globals;

export const diffCreate = (args: Parameters<typeof rest.diff.diffCreate>[0]) => {
    const defer = new Defer<Awaited<ReturnType<ReturnType<typeof rest.diff.diffCreate>['promisify']>>>();
    const promise = new Promise((resolve, reject) => {
        const jobUpdate = editor.on('messenger:job.update', async ({ job: jobData }) => {
            const job = await defer.promise;
            if (jobData.id !== job.id) {
                return;
            }
            jobUpdate.unbind();
            // Fetch the completed job and return its data (which now contains the diff result)
            rest.jobs.jobGet({
                jobId: job.id
            }).promisify().then((completedJob) => {
                resolve(completedJob.data);
            }).catch(reject);
        });
    });
    rest.diff.diffCreate(args).promisify().then(defer.resolve).catch(defer.reject);
    return promise;
};
