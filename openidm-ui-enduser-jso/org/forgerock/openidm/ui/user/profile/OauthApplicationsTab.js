"use strict";

/*
 * Copyright 2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "org/forgerock/commons/ui/user/profile/AbstractUserProfileTab", "org/forgerock/openidm/ui/util/delegates/AMDelegate", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/openidm/ui/util/delegates/SiteConfigurationDelegate", "org/forgerock/commons/ui/common/util/UIUtils", "org/forgerock/commons/ui/common/main/ServiceInvoker", "moment", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/EventManager"], function ($, _, AbstractUserProfileTab, AMDelegate, Configuration, SiteConfigurationDelegate, UIUtils, ServiceInvoker, moment, Constants, EventManager) {
    var OauthApplicationsTab = AbstractUserProfileTab.extend({
        template: "templates/profile/OauthApplicationsTab.html",
        events: _.extend({
            "click .remove-oauth-application": "removeApplication"
        }, AbstractUserProfileTab.prototype.events),

        /**
         Expected by all dynamic user profile tabs - returns a map of details necessary to render the nav tab
         */
        getTabDetail: function getTabDetail() {
            return {
                "panelId": "oauthApplicationsTab",
                "label": $.t("common.user.profileMenu.oauthApplications")
            };
        },

        render: function render(args, callback) {
            this.args = args;
            this.data.oauthApplications = Configuration.loggedUser.attributes.oauthApplications;

            //format the expiryDateTimes
            _.map(this.data.oauthApplications, function (app) {
                app.expiryDateTime = app.expiryDateTime ? moment(app.expiryDateTime).format("LLL") : $.t("templates.oauthApplications.neverExpire");
            });

            this.parentRender(function () {
                if (callback) {
                    callback();
                }
            });
        },

        removeApplication: function removeApplication(e) {
            var _this = this;

            var applicationId = $(e.target).attr("applicationId");

            e.preventDefault();

            UIUtils.confirmDialog($.t("templates.oauthApplications.confirmRemoveOauthApplication", { applicationName: applicationId }), "danger", function () {
                AMDelegate.deleteOAuthApplication(applicationId).then(function () {
                    _.remove(Configuration.loggedUser.attributes.oauthApplications, function (application) {
                        return application._id === applicationId;
                    });
                    _this.render(_this.args);
                    EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, "oauthApplicationRemoved");
                });
            });
        }
    });

    return new OauthApplicationsTab();
});
