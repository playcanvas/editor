import { expect } from 'chai';
import { describe, it } from 'mocha';

import { isSchemaRejection, schemaRejectionMessage, jobRejectionMessage } from '../../src/editor/realtime/realtime-error';

describe('realtime schema-rejection errors', () => {
    it('detects invalid:* verdicts on strings and errors', () => {
        expect(isSchemaRejection('invalid:value')).to.equal(true);
        expect(isSchemaRejection(new Error('invalid:delete'))).to.equal(true);
        expect(isSchemaRejection('Exceeded max submit retries')).to.equal(false);
        expect(isSchemaRejection(undefined)).to.equal(false);
        expect(isSchemaRejection(null)).to.equal(false);
    });

    it('builds a user-facing message carrying the reason', () => {
        expect(schemaRejectionMessage('invalid:delete')).to.contain('delete');
        expect(schemaRejectionMessage('invalid:exception: bad path')).to.contain('bad path');
        expect(schemaRejectionMessage('invalid:')).to.contain('invalid change');
    });

    it('classifies a job.update payload, ignoring non-schema failures', () => {
        expect(jobRejectionMessage({ job: { error: 'invalid:delete' } })).to.contain('delete');
        expect(jobRejectionMessage({ job: { error: 'Job failed' } })).to.equal(null);
        expect(jobRejectionMessage({ job: {} })).to.equal(null);
        expect(jobRejectionMessage({})).to.equal(null);
    });
});
