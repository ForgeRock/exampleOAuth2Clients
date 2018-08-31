"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/main/Configuration"], function (AbstractView, constants, eventManager, conf) {
    var AuthenticationUnavailableView = AbstractView.extend({
        template: "templates/admin/login/AuthenticationUnavailableTemplate.html",
        baseTemplate: "templates/common/LoginBaseTemplate.html",

        events: {
            "click #loginLink": "login"
        },
        render: function render(args, callback) {
            this.parentRender(function () {
                if (callback) {
                    callback();
                }
            });
        },
        login: function login(e) {
            e.preventDefault();

            conf.globalData.authenticationUnavailable = false;
            eventManager.sendEvent(constants.ROUTE_REQUEST, { routeName: "login", args: [] });
            location.reload();
        }
    });

    return new AuthenticationUnavailableView();
});
