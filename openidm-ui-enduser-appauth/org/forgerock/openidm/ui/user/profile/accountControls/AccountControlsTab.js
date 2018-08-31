"use strict";

/*
 * Copyright 2017-2018 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "org/forgerock/commons/ui/user/profile/AbstractUserProfileTab", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/openidm/ui/common/delegates/ResourceDelegate"], function ($, _, AbstractUserProfileTab, Configuration, Constants, ResourceDelegate) {
    var AccountControlsView = AbstractUserProfileTab.extend({
        template: "templates/profile/accountControls/AccountControlsTab.html",
        events: _.extend({
            "click .fr-download-profile": "downloadAccount"
        }, AbstractUserProfileTab.prototype.events),

        getTabDetail: function getTabDetail() {
            return {
                "panelId": "accountControlsTab",
                "label": $.t("common.user.profileMenu.accountControls")
            };
        },

        render: function render(args, callback) {
            this.parentRender(function () {
                if (callback) {
                    callback();
                }
            });
        },

        downloadAccount: function downloadAccount(event) {
            var _this = this;

            event.preventDefault();

            ResourceDelegate.readResource(Constants.context + "/" + Configuration.loggedUser.baseEntity + "?_fields=*,idps/*,_meta/createDate,_meta/lastChanged,_meta/termsAccepted,_meta/loginCount", []).then(function (result) {
                var anchor = $("<a style='display: none;'/>"),
                    data = void 0,
                    url = void 0,
                    name = "userProfile.json";

                if (result._meta) {
                    _.each(result._meta, function (value, key) {
                        if (key.match('_')) {
                            delete result._meta[key];
                        }
                    });
                }

                if (result.idps) {
                    _.each(result.idps, function (idp) {
                        _.each(idp, function (value, key) {
                            if (key.match('_') && _.isNull(key.match('_meta'))) {
                                delete idp[key];
                            }
                        });
                    });
                }

                delete result._rev;
                delete result.kbaInfo;

                data = JSON.stringify(result, null, 4);

                //IE support
                if (navigator.msSaveBlob) {
                    return navigator.msSaveBlob(new Blob([data], { type: "data:application/json" }), name);
                } else {
                    url = window.URL.createObjectURL(new Blob([data], { type: "data:application/json" }));

                    anchor.attr("href", url);
                    anchor.attr("download", name);
                    anchor.attr("id", "downloadLink");

                    _this.$el.append(anchor);

                    anchor[0].click();

                    //fixes firefox html removal bug
                    setTimeout(function () {
                        window.URL.revokeObjectURL(url);
                        anchor.remove();
                    }, 500);
                }
            });
        }
    });

    return new AccountControlsView();
});
