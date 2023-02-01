editor.once('load', function () {
    'use strict';

    // Split description into lines of up to 'maxPerLine' characters,
    // only breaking up tokens of length > 'maxPerToken'
    class SplitNodeDescription {
        constructor(orig, maxPerLine, maxPerToken) {
            this.orig = orig;

            this.maxPerLine = maxPerLine;

            this.maxPerToken = maxPerToken;

            this.curTokens = [];

            this.curLength = 0;

            this.lines = [];
        }

        run() {
            this.tokens = this.orig.split(' ');

            this.tokens.forEach(this.handleToken, this);

            this.transition();

            return this.lines;
        }

        handleToken(s) {
            const afterAdd = this.curLength + this.spaceBefore() + s.length;

            if (afterAdd > this.maxPerLine) {
                this.splitIfNeeded(s);
            } else {
                this.addToCur(s);
            }
        }

        splitIfNeeded(s) {
            if (s.length > this.maxPerToken) {
                this.splitTransition(s);

            } else {
                this.transition();

                this.addToCur(s);
            }
        }

        transition() {
            if (this.curLength) {
                const s = this.curTokens.join(' ');

                this.lines.push(s);

                this.curTokens = [];

                this.curLength = 0;
            }
        }

        splitTransition(s) {
            const n = this.maxPerLine - this.curLength - this.spaceBefore();

            const s1 = s.substring(0, n);

            const s2 = s.substring(n);

            this.addToCur(s1);

            this.transition();

            this.handleToken(s2);
        }

        addToCur(s) {
            if (s) {
                this.curTokens.push(s);

                this.curLength += s.length + this.spaceBefore();
            }
        }

        spaceBefore() {
            return this.curLength ? 1 : 0;
        }
    }

    editor.method('vcgraph:splitNodeDescription', function (orig, maxPerLine, maxPerToken) {
        return new SplitNodeDescription(orig, maxPerLine, maxPerToken).run();
    });
});
