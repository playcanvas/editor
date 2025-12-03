import { Ajax } from '../ajax';
import { globals as api } from '../globals';
import type { Job } from '../models';

// requests
type JobGetRequest = {
    /**
     * The ID of the job to get
     */
    jobId: number;
};

// responses
type JobGetResponse = Job<object>

/**
 * Gets the job with the given ID
 */
export const jobGet = (args: JobGetRequest) => {
    return Ajax.get<JobGetResponse>({
        url: `${api.apiUrl}/jobs/${args.jobId}`,
        auth: true
    });
};
