import { Defer } from '@/common/defer';

const { rest } = editor.api.globals;

export const diffCreate = (args: Parameters<typeof rest.diff.diffCreate>[0]) => {
    const defer = new Defer<Awaited<ReturnType<ReturnType<typeof rest.diff.diffCreate>['promisify']>>>();
    const promise = new Promise((resolve, reject) => {
        const diffComplete = editor.on('messenger:diff.diffComplete', async ({ merge_id }) => {
            const job = await defer.promise;
            if (merge_id !== job.data.merge_id) {
                return;
            }
            diffComplete.unbind();
            rest.merge.mergeGet({
                mergeId: merge_id
            }).promisify().then(resolve).catch(reject);
        });
    });
    rest.diff.diffCreate(args).promisify().then(defer.resolve).catch(defer.reject);
    return promise;
};
