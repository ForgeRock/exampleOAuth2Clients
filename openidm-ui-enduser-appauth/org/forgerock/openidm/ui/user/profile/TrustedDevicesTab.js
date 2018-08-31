"use strict";

/*
 * Copyright 2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "org/forgerock/commons/ui/user/profile/AbstractUserProfileTab", "org/forgerock/openidm/ui/util/delegates/AMDelegate", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/openidm/ui/util/delegates/SiteConfigurationDelegate", "org/forgerock/commons/ui/common/util/UIUtils", "org/forgerock/commons/ui/common/main/ServiceInvoker", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/EventManager"], function ($, _, AbstractUserProfileTab, AMDelegate, Configuration, SiteConfigurationDelegate, UIUtils, ServiceInvoker, Constants, EventManager) {
    var TrustedDevicesTab = AbstractUserProfileTab.extend({
        template: "templates/profile/TrustedDevicesTab.html",
        events: _.extend({
            "click .remove-trusted-device": "removeDevice"
        }, AbstractUserProfileTab.prototype.events),

        /**
         Expected by all dynamic user profile tabs - returns a map of details necessary to render the nav tab
         */
        getTabDetail: function getTabDetail() {
            return {
                "panelId": "trustedDevicesTab",
                "label": $.t("common.user.profileMenu.trustedDevices")
            };
        },

        render: function render(args, callback) {
            this.args = args;
            this.data.trustedDevices = Configuration.loggedUser.attributes.trustedDevices;

            this.parentRender(function () {
                if (callback) {
                    callback();
                }
            });
        },

        removeDevice: function removeDevice(e) {
            var _this = this;

            var deviceId = $(e.target).attr("deviceId"),
                deviceName = $(e.target).attr("deviceName");

            e.preventDefault();

            UIUtils.confirmDialog($.t("templates.trustedDevices.confirmRemoveTrustedDevice", { deviceName: deviceName }), "danger", function () {
                AMDelegate.deleteTrustedDevice(deviceId).then(function () {
                    _.remove(Configuration.loggedUser.attributes.trustedDevices, function (device) {
                        return device.uuid === deviceId;
                    });
                    _this.render(_this.args);
                    EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, "trustedDeviceRemoved");
                });
            });
        }
    });

    return new TrustedDevicesTab();
});
