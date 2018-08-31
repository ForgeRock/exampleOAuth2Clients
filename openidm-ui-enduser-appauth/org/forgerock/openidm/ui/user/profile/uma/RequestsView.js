"use strict";

/*
 * Copyright 2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "org/forgerock/openidm/ui/common/util/BootstrapDialogUtils", "handlebars", "selectize", "moment", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/openidm/ui/util/delegates/AMDelegate", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/util/UIUtils", "org/forgerock/commons/ui/user/profile/AbstractUserProfileTab", "org/forgerock/openidm/ui/common/util/HandlebarHelperUtils"], function ($, _, BootstrapDialogUtils, Handlebars, selectize, Moment, Constants, AMDelegate, Configuration, UIUtils, AbstractUserProfileTab) {
    var RequestsView = AbstractUserProfileTab.extend({
        template: "templates/profile/uma/RequestsView.html",
        events: _.extend({
            "click .fr-administrate-requests": "AdministrateResourceRequests",
            "click .fr-resource-request-group": "ResourceRequestDetails"
        }, AbstractUserProfileTab.prototype.events),
        partials: ["partials/profile/_editRequestDialog.html", "partials/form/_tagSelectize.html"],

        render: function render(args, callback) {
            var _this2 = this;

            AMDelegate.getPendingRequests().then(function (requests) {
                _this2.data.requests = requests.result;

                _.each(_this2.data.requests, function (request) {
                    request.when = Moment(request.when).fromNow();
                });

                _this2.parentRender(function () {
                    if (callback) {
                        callback();
                    }
                });
            });
        },

        AdministrateResourceRequests: function AdministrateResourceRequests(e) {
            var _this3 = this;

            e.preventDefault();
            e.stopPropagation();
            var btn = $(e.currentTarget),
                allow = btn.attr("data-allow") === "true",
                requestID = btn.closest(".fr-resource-request-group").attr("data-request-id");

            AMDelegate.AdministrateResourceRequests(requestID, allow).then(function () {
                _this3.render();
            });
        },

        ResourceRequestDetails: function ResourceRequestDetails(e) {
            e.preventDefault();

            var requestID = $(e.currentTarget).attr("data-request-id"),
                request = _.find(this.data.requests, { "_id": requestID }),
                _this = this;

            this.dialog = BootstrapDialogUtils.createModal({
                title: $.t("templates.sharing.editRequest"),
                message: $(Handlebars.compile("{{> profile/_editRequestDialog}}")(request)),
                onshow: function onshow(dialogRef) {
                    dialogRef.$modalBody.find(".array-selection").selectize({
                        delimiter: ",",
                        persist: false,
                        create: false,
                        onChange: function onChange(value) {
                            dialogRef.$modalFooter.find(".btn-primary").toggleClass("disabled", _.isNull(value));
                        }
                    });
                },
                onshown: function onshown(dialogRef) {
                    dialogRef.$modalBody.find(".array-selection")[0].selectize.focus();
                },
                buttons: [{
                    label: $.t("templates.sharing.deny"),
                    action: function action(dialogRef) {
                        AMDelegate.AdministrateResourceRequests(requestID, false).then(function () {
                            dialogRef.close();
                            _this.render();
                        });
                    }
                }, {
                    label: $.t("templates.sharing.allow"),
                    cssClass: "btn-primary",
                    hotkey: Constants.ENTER_KEY,
                    action: function action(dialogRef) {
                        if (!dialogRef.$modalFooter.find(".btn-primary").hasClass("disabled")) {
                            var payload = {
                                "scopes": dialogRef.$modalBody.find(".array-selection").val()
                            };

                            AMDelegate.AdministrateResourceRequests(requestID, true, payload).then(function () {
                                dialogRef.close();
                                _this.render();
                            });
                        }
                    }
                }]
            }).open();
        }
    });

    return new RequestsView();
});
