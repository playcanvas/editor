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

            try {
                // Verify the job completed successfully
                const completedJob = await rest.jobs.jobGet({ jobId: job.id }).promisify();
                if (completedJob.status === 'error') {
                    throw new Error(completedJob.messages?.[0] ?? 'Checkpoint diff failed');
                }

                // Fetch the full diff payload from S3 (the job document only
                // stores summary metadata to stay under the MongoDB 16MB limit).
                const diff = await rest.diff.diffGet({ id: job.data.merge_id }).promisify();
                resolve(diff);
            } catch (err) {
                reject(err);
            }
        });
    });
    rest.diff.diffCreate(args).promisify().then(defer.resolve).catch(defer.reject);
    return promise;
};
