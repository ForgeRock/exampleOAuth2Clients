"use strict";

/*
 * Copyright 2018 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "org/forgerock/openidm/ui/common/util/BootstrapDialogUtils", "handlebars", "org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/openidm/ui/util/delegates/AMDelegate", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/EventManager"], function ($, _, BootstrapDialogUtils, Handlebars, AbstractView, AMDelegate, Configuration, constants, eventManager) {
    var ShareDialog = AbstractView.extend({
        model: {},
        events: {
            "click #shareResource": "openShareDialog",
            "click #unshareResource": "openUnshareConfirmDialog",
            "click .rowUnshare": "changeSharePermissions"
        },

        render: function render(args, callback) {
            var _this = this;

            var _id = args.id,
                user = args.resource.resourceOwnerId,
                currentResource = args.resource,
                permissions,
                shareText;

            permissions = currentResource.scopes;
            shareText = currentResource.shareText || $.t("templates.user.shareDialog.notShared");

            AMDelegate.getResourceSet().then(function (resourceSet) {
                _this.model.resourceSet = _.filter(resourceSet.result, function (resource) {
                    return resource.resourceOwnerId === user;
                });

                BootstrapDialogUtils.createModal({
                    title: $.t("templates.user.shareDialog.title"),
                    message: '<div id="sharingDialogContainer"></div>',
                    onshown: function onshown(dialogRef) {
                        var shareSelect, permissionsSelect, formattedPermissions, checkButtonState;

                        checkButtonState = function checkButtonState() {
                            var shares = _this.model.shareWithSelect.getValue(),
                                scopes = _this.model.permissionsSelect.getValue();

                            return shares.length && scopes.length;
                        };

                        dialogRef.$modal.find("#sharingDialogContainer").append($(Handlebars.compile("{{> profile/_shareDialog}}")({
                            "permissions": permissions,
                            "shareText": shareText
                        })));

                        formattedPermissions = _.map(permissions, function (perm) {
                            return { "permission": perm };
                        });

                        shareSelect = $(".share-with-select").selectize({
                            persist: false,
                            maxItems: null,
                            placeholder: $.t("templates.user.shareDialog.placeHolder"),
                            create: function create(input) {
                                return {
                                    value: input,
                                    text: input
                                };
                            }
                        });

                        permissionsSelect = $(".share-permissions-select").selectize({
                            persist: true,
                            hideSelected: true,
                            maxItems: null,
                            create: false,
                            labelField: "permission",
                            options: formattedPermissions
                        });

                        shareSelect.on('change', function (e) {
                            e.preventDefault();

                            if (checkButtonState()) {
                                $(".shareResource").removeClass('disabled');
                            }
                        });

                        permissionsSelect.on('change', function (e) {
                            e.preventDefault();

                            if (checkButtonState()) {
                                $(".shareResource").removeClass('disabled');
                            }
                        });

                        _this.model.shareWithSelect = shareSelect[0].selectize;
                        _this.model.permissionsSelect = permissionsSelect[0].selectize;
                    },
                    buttons: ["cancel", {
                        label: $.t("templates.user.shareDialog.shareButton"),
                        cssClass: "btn-primary shareResource disabled",
                        action: function action(dialogRef) {
                            var payload = { permissions: [] },
                                shareWiths = _this.model.shareWithSelect.getValue(),
                                scopes = _this.model.permissionsSelect.getValue(),
                                previousShares = _.filter(_this.model.resourceSet, function (resource) {
                                return resource._id === _id;
                            });

                            if (shareWiths && scopes) {
                                _this.$el.find(".shareResource").removeAttr("disabled");

                                payload.permissions = _.map(shareWiths, function (elem) {
                                    return {
                                        "subject": elem,
                                        "scopes": scopes
                                    };
                                });
                            }

                            payload.policyId = _id;

                            if (!previousShares[0].policy) {
                                AMDelegate.shareResource(_id, payload).then(function () {
                                    eventManager.sendEvent(constants.EVENT_DISPLAY_MESSAGE_REQUEST, "resourceShared");

                                    if (callback) {
                                        callback({ "id": _id });
                                    }
                                }, function () {
                                    eventManager.sendEvent(constants.EVENT_DISPLAY_MESSAGE_REQUEST, "resourceSharedFail");
                                });
                            } else {
                                payload.permissions = payload.permissions.concat(previousShares[0].policy.permissions);

                                AMDelegate.unshareResource(_id).then(function () {
                                    AMDelegate.shareResource(_id, payload);
                                }).then(function () {
                                    eventManager.sendEvent(constants.EVENT_DISPLAY_MESSAGE_REQUEST, "resourceShared");

                                    if (callback) {
                                        callback({ "id": _id });
                                    }
                                }, function () {
                                    eventManager.sendEvent(constants.EVENT_DISPLAY_MESSAGE_REQUEST, "resourceSharedFail");
                                });
                            }

                            dialogRef.close();
                        }
                    }]
                }).open();
            });
        }
    });

    return new ShareDialog();
});
