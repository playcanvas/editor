editor.once('load', function () {
    'use strict';

    var TextResolver = function (conflict) {
        Events.call(this);

        this.panelTop = new ui.Panel();
        this.panelTop.class.add('textmerge-top');

        this.labelName = new ui.Label({
            text: conflict.itemName
        });
        this.labelName.class.add('name');
        this.labelName.renderChanges = false;
        this.panelTop.append(this.labelName);

        // find textual merge conflict
        this._textualMergeConflict = null;
        for (var i = 0; i < conflict.data.length; i++) {
            if (conflict.data[i].isTextualMerge) {
                this._textualMergeConflict = conflict.data[i];
                break;
            }
        }

        this.btnMarkResolved = new ui.Button({
            text: 'MARK AS RESOLVED'
        });
        this.btnMarkResolved.class.add('mark-resolved');
        this.btnMarkResolved.on('click', this.uploadResolved.bind(this));
        this.panelTop.append(this.btnMarkResolved);

        this.btnGoBack = new ui.Button({
            text: 'VIEW ASSET CONFLICTS'
        });
        this.btnGoBack.class.add('go-back');
        this.panelTop.append(this.btnGoBack);
        this.btnGoBack.on('click', function () {
            this.emit('close');
        }.bind(this));

        this.iframe = document.createElement('iframe');
        this.iframe.src = '/editor/code/' + config.project.id + '?resolveConflict=' + this._textualMergeConflict.id;
    };

    TextResolver.prototype = Object.create(Events.prototype);

    TextResolver.prototype.appendToParent = function (parent) {
        parent.append(this.panelTop);
        parent.append(this.iframe);
    };

    TextResolver.prototype.destroy = function () {
        this.panelTop.destroy();
        if (this.iframe.parentElement) {
            this.iframe.parentElement.removeChild(this.iframe);
        }

        this.panelTop = null;
        this.iframe = null;
    };

    TextResolver.prototype.getEditorContent = function () {
        return this.iframe.contentWindow.editor.call('editor:codemirror').getValue();
    };

    TextResolver.prototype.uploadResolved = function () {
        this.btnMarkResolved.disabled = true;
        var content = this.getEditorContent();
        var file = new Blob([content]);
        editor.call('conflicts:uploadResolvedFile', this._textualMergeConflict.id, file, function (err) {
            this.btnMarkResolved.disabled = false;
            if (err) {
                console.error(err);
                return;
            }

            this._textualMergeConflict.useMergedFile = true;
            this.emit('resolve', this._textualMergeConflict.id, {
                useMergedFile: true
            });

        }.bind(this));
    };

    window.ui.TextResolver = TextResolver;
});
