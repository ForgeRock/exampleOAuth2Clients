"use strict";

/*
 * Copyright 2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "org/forgerock/commons/ui/user/profile/UserProfileView", "org/forgerock/openidm/ui/common/delegates/SchemaDelegate", "org/forgerock/commons/ui/common/main/Configuration"], function ($, _, CommonsUserProfileView, SchemaDelegate, Configuration) {

    var UserProfileView = function UserProfileView() {},
        obj;

    UserProfileView.prototype = CommonsUserProfileView;

    obj = new UserProfileView();
    obj.dynamicTabs = [];

    obj.render = function (args, callback) {
        var _this = this;

        UserProfileView.prototype.dynamicTabs = obj.dynamicTabs;

        SchemaDelegate.getSchema(Configuration.loggedUser.component).then(function (results) {
            var properties = results.properties,
                order = results.order,
                displayProperties = [];

            _.each(order, function (value) {
                if (properties[value].userEditable === true && properties[value].type === "string" && _.isUndefined(properties[value].encryption)) {
                    properties[value].schemaName = value;
                    displayProperties.push(properties[value]);
                }
            });

            _this.data.profileDetails = displayProperties;

            UserProfileView.prototype.render(args, function () {
                var tabListCheck = $(".fr-profile-nav li").hasClass("active");

                // since all tabs are now dynamic we need to click the first tab after it's been rendered.
                if (!tabListCheck) {
                    _.first($("li[role='presentation'] a")).click();
                }

                callback();
            });
        }, function () {
            _this.data.profileDetails = [{
                "title": "Username",
                "policies": [{ "policyId": "read-only" }],
                "schemaName": "userName",
                "justification": $.t("templates.personalInfo.internalUserUserNameJustification")
            }];

            UserProfileView.prototype.render(args, function () {
                var tabListCheck = $(".fr-profile-nav li").hasClass("active");

                // since all tabs are now dynamic we need to click the first tab after it's been rendered.
                if (!tabListCheck) {
                    _.first($("li[role='presentation'] a")).click();
                }

                callback();
            });
        });
    };

    /**
     * We need to catch and set the tabs here otherwise they get set to the wrong view since
     * we are overriding the commons profile view
     */
    obj.registerTab = function (tabView) {
        this.dynamicTabs.push(tabView);
    };

    return obj;
});
