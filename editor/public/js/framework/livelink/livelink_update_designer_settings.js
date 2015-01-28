pc.extend(pc.fw, function () {
    /**
     * @name pc.fw.LiveLinkUpdateDesignerSettings
     * @constructor Create a new LiveLinkUpdateDesignerSettings from individual attributes
     * @param {Object} settings Contains all the designer settings
     * @private
     */
    var LiveLinkUpdateDesignerSettings = function(settings) {
        this.type = pc.LiveLinkMessageType.UPDATE_DESIGNER_SETTINGS;
        this.content = {
            settings: settings
        };
    };

    LiveLinkUpdateDesignerSettings = pc.inherits(LiveLinkUpdateDesignerSettings, pc.LiveLinkMessage);
    pc.LiveLinkMessage.register("UPDATE_DESIGNER_SETTINGS");

    return {
        LiveLinkUpdateDesignerSettings: LiveLinkUpdateDesignerSettings
    };
}());
