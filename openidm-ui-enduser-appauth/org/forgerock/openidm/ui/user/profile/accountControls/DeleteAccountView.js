"use strict";

/*
 * Copyright 2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/openidm/ui/common/delegates/ResourceDelegate", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/EventManager"], function ($, _, AbstractView, Configuration, ResourceDelegate, Constants, EventManager) {
    var DeleteAccountView = AbstractView.extend({
        template: "templates/profile/accountControls/DeleteAccountTemplate.html",
        events: {
            "change .fr-accept-text input": "toggleSave",
            "click .fr-delete": "deleteAccount"
        },

        render: function render(args, callback) {
            this.parentRender(function () {
                if (callback) {
                    callback();
                }
            });
        },

        toggleSave: function toggleSave(event) {
            event.preventDefault();

            this.$el.find(".fr-delete").prop('disabled', !$(event.target).is(":checked"));
        },

        deleteAccount: function deleteAccount(event) {
            event.preventDefault();

            ResourceDelegate.deleteResource(Configuration.loggedUser.url, Configuration.loggedUser.id).then(function () {
                EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, "accountDeleted");

                window.location.href = "#logout/";
            });
        }
    });

    return new DeleteAccountView();
});
