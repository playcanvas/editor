import { jobRejectionMessage } from '@/editor/realtime/realtime-error';

// pipeline jobs whose ShareDB write is rejected by schema validation report the verdict
// on `job.update` but otherwise fail silently; surface it so the reverted change is visible
editor.on('messenger:job.update', (data: { job?: { error?: unknown } }) => {
    const message = jobRejectionMessage(data);
    if (!message) {
        return;
    }

    console.error('pipeline job rejected and reverted:', data.job?.error);
    editor.call('status:error', message);
});
