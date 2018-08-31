"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["underscore", "placeholder", "org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/commons/ui/common/util/ModuleLoader", "org/forgerock/commons/ui/common/main/ValidatorsManager", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/util/CookieHelper"], function (_, placeholder, AbstractView, ModuleLoader, validatorsManager, eventManager, constants, cookieHelper) {
    var LoginView = AbstractView.extend({
        template: "templates/common/LoginTemplate.html",
        baseTemplate: "templates/common/LoginBaseTemplate.html",

        events: {
            "click input[type=submit]": "formSubmit",
            "onValidate": "onValidate"
        },

        partials: ["partials/providers/_providerButton.html"],

        formSubmit: function formSubmit(event) {
            event.preventDefault();
            if (this.$el.find("[name=loginRemember]:checked").length !== 0) {
                var expire = new Date();
                expire.setDate(expire.getDate() + 365 * 20);
                cookieHelper.setCookie("login", this.$el.find("input[name=login]").val(), expire);
            } else {
                cookieHelper.deleteCookie("login");
            }

            eventManager.sendEvent(constants.EVENT_LOGIN_REQUEST, {
                userName: this.$el.find("input[name=login]").val(),
                password: this.$el.find("input[name=password]").val()
            });
        },

        render: function render(args, callback) {
            this.parentRender(function () {
                validatorsManager.bindValidators(this.$el);

                this.$el.find("input").placeholder();

                var login = cookieHelper.getCookie("login");
                if (login) {
                    this.$el.find("input[name=login]").val(login).prop('autofocus', false);
                    this.$el.find("[name=loginRemember]").prop("checked", true);
                    validatorsManager.validateAllFields(this.$el);
                    this.$el.find("[name=password]").focus();
                } else {
                    this.$el.find("input[name=login]").focus();
                }

                if (callback) {
                    callback();
                }
            });
        }
    });

    return new LoginView();
});
