"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/commons/ui/common/components/BootstrapDialog", "org/forgerock/commons/ui/common/util/UIUtils", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/main/SessionManager", "org/forgerock/commons/ui/common/main/ViewManager", "org/forgerock/commons/ui/common/main/AbstractView"], function ($, _, BootstrapDialog, UIUtils, Configuration, Constants, EventManager, SessionManager, ViewManager, AbstractView) {
    var LoginDialog = AbstractView.extend({
        template: "templates/common/LoginDialog.html",
        element: "#dialogs",

        render: function render(options) {
            var dialogBody = $('<div id="loginDialog"></div>'),
                authenticatedCallback = options.authenticatedCallback;

            this.$el.find('#dialogs').append(dialogBody);
            // attaching BootstrapDialog via '#dialogs' so that it is encapsulated withing the qunit-fixture for testing
            this.setElement(dialogBody);
            BootstrapDialog.show({
                closable: false,
                title: $.t("common.form.sessionExpired"),
                type: BootstrapDialog.TYPE_DEFAULT,
                message: dialogBody,
                onshown: _.bind(function () {
                    UIUtils.renderTemplate(this.template, this.$el, _.extend({}, Configuration.globalData, this.data), _.noop, "replace");
                }, this),
                buttons: [{
                    id: "loginDialogSubmitButton",
                    label: $.t("common.user.login"),
                    cssClass: "btn-primary",
                    hotkey: 13,
                    action: function action(dialog) {
                        var userName, password;

                        userName = dialog.$modalBody.find("input[name=login]").val();
                        password = dialog.$modalBody.find("input[name=password]").val();

                        SessionManager.login({ "userName": userName, "password": password }, function (user) {
                            Configuration.setProperty('loggedUser', user);
                            EventManager.sendEvent(Constants.EVENT_AUTHENTICATION_DATA_CHANGED, {
                                anonymousMode: false
                            });
                            EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, "loggedIn");
                            dialog.close();

                            if (authenticatedCallback) {
                                authenticatedCallback();
                            }
                        }, function () {
                            EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, "authenticationFailed");
                        });
                    }
                }]
            });
        }
    });
    return new LoginDialog();
});
