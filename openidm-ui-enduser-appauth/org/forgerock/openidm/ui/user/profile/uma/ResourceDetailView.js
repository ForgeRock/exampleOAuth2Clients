"use strict";

/*
 * Copyright 2018 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "org/forgerock/openidm/ui/util/delegates/AMDelegate", "org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/main/Router", "org/forgerock/openidm/ui/user/profile/uma/ShareDialogView", "org/forgerock/openidm/ui/util/UmaUtils"], function ($, _, AMDelegate, AbstractView, Configuration, Router, ShareDialogView, UmaUtils) {
    var ResourceDetailView = AbstractView.extend({
        partials: ["partials/profile/_shareDialog.html"],
        template: "templates/profile/uma/ResourceDetailView.html",
        events: {
            "click #shareResource": "openShareDialog",
            "click #unshareResource": "openUnshareConfirmDialog",
            "click .rowUnshare": "changeSharePermissions"
        },

        /**
         * load template and bind validators
         */
        render: function render(args, callback) {
            var _this = this;

            this.data = {};
            this.data.user = Configuration.loggedUser.authenticationId;

            AMDelegate.getResourceSet().then(function (resourceSet) {
                _this.data.resource = _.find(resourceSet.result, function (resource) {
                    return resource.resourceOwnerId === _this.data.user && resource._id === args[0];
                });

                _this.data.noResources = _.has(_this.data.resource, "policy.permissions") === false;

                _this.parentRender(function () {
                    _this.$el.find('[data-toggle="tooltip"]').tooltip();

                    if (callback) {
                        callback();
                    }
                });
            });
        },

        openShareDialog: function openShareDialog(e) {
            var _this2 = this;

            var _id = this.data.resource._id,
                resourceSet = this.data.resource,
                args = {
                "id": _id,
                "resource": resourceSet
            };

            e.preventDefault();

            ShareDialogView.render(args, function () {
                _this2.render([_id]);
            });
        },

        openUnshareConfirmDialog: function openUnshareConfirmDialog(e) {
            var _this3 = this;

            var id = this.data.resource._id;

            e.preventDefault();

            UmaUtils.renderConfirmDialog({ "id": id }, function () {
                _this3.render([id]);
            });
        },

        changeSharePermissions: function changeSharePermissions(e) {
            var _this4 = this;

            var payload = this.data.resource.policy,
                id = this.data.resource._id,
                $target = $(e.target),
                rowSubject = $target.closest("[data-subject-name]").attr("data-subject-name");

            e.preventDefault();

            payload.policyId = id;
            payload.permissions = _.without(payload.permissions, _.findWhere(payload.permissions, {
                "subject": rowSubject
            }));

            UmaUtils.renderConfirmDialog({
                "id": id,
                "subject": rowSubject
            }, function () {
                AMDelegate.shareResource(id, payload).then(function () {
                    $("div").find("[data-subject-name='" + rowSubject + "']").remove();

                    _this4.render([id]);
                });
            });
        }
    });

    return new ResourceDetailView();
});
