import { Events } from '@playcanvas/observer';

import { Guid } from './guid';

/**
 * Facilitates tracking of asynchronous jobs.
 *
 * @category Internal
 */
class Jobs extends Events {
    private _jobsInProgress: Record<string, Function> = {};

    /**
     * Adds a new job. The specified function will be returned when the
     * job is finished.
     *
     * @param fn - A function to be stored for this job.
     * @returns Returns a job id
     * @example
     * ```javascript
     * const jobId = editor.jobs.start(() => console.log('job was finished'));
     * editor.jobs.finish(jobId)(); // prints 'job was finished'
     * ```
     */
    start(fn: Function) {
        const jobId = Guid.create().substring(0, 8);
        this._jobsInProgress[jobId] = fn;
        this.emit('start', jobId);
        return jobId;
    }

    /**
     * Notifies that a job has finished. The specified job
     * id is removed and the callback stored when the job was
     * started is returned.
     *
     * @param jobId - The job id
     * @returns The function stored when the job was started
     * @example
     * ```javascript
     * const jobId = editor.jobs.start(() => console.log('job was finished'));
     * editor.jobs.finish(jobId)(); // prints 'job was finished'
     * ```
     */
    finish(jobId: string) {
        const callback = this._jobsInProgress[jobId];
        delete this._jobsInProgress[jobId];
        this.emit('finish', jobId);
        return callback;
    }
}

export { Jobs };
