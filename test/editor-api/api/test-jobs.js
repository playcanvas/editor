describe('api.Jobs tests', function () {
    it('adds job', function () {
        const jobs = new api.Jobs();
        const fn = () => {};
        const id = jobs.start(fn);

        expect(jobs._jobsInProgress[id]).to.equal(fn);
    });

    it('removes job', function () {
        const jobs = new api.Jobs();
        let called = false;
        const fn = () => { called = true; };
        const id = jobs.start(fn);
        const result = jobs.finish(id);
        result();

        expect(jobs._jobsInProgress[id]).to.equal(undefined);
        expect(called).to.equal(true);
    });

    it('finish missing job returns undefined', function () {
        const jobs = new api.Jobs();
        const result = jobs.finish('missing');
        expect(result).to.equal(undefined);
    });
});
