pc.extend(pc.fw, function () {
    /**
     * @name pc.fw.LiveLinkSelectionUpdatedMessage
     * @constructor Create a new LiveLinkSelectionUpdatedMessage
     * @class Inform the runtime application that the currently selected Entities has changed and provide a list of the new Entities.
     * @param {Array} guids An array of GUID strings which forms the currently selected Entities
     * @private
     */
    var LiveLinkSelectionUpdatedMessage = function(guids) {
        this.type = pc.LiveLinkMessageType.SELECTION_UPDATED;
        this.content = {
            guids: guids
        };
    };
    LiveLinkSelectionUpdatedMessage = pc.inherits(LiveLinkSelectionUpdatedMessage, pc.LiveLinkMessage);
    pc.LiveLinkMessage.register("SELECTION_UPDATED");

    return {
        LiveLinkSelectionUpdatedMessage: LiveLinkSelectionUpdatedMessage
    };
}());
