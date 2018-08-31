"use strict";

/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "org/forgerock/commons/ui/user/profile/AbstractUserProfileTab"], function ($, _, AbstractUserProfileTab) {
    var PreferencesView = AbstractUserProfileTab.extend({
        template: "templates/profile/PreferencesTab.html",
        events: _.extend({
            "change .checkbox input": "formSubmit"
        }, AbstractUserProfileTab.prototype.events),

        /**
         Expected by all dynamic user profile tabs - returns a map of details necessary to render the nav tab
         */
        getTabDetail: function getTabDetail() {
            return {
                "panelId": "preferencesTab",
                "label": $.t("common.user.profileMenu.preferences")
            };
        }
    });

    return new PreferencesView();
});
