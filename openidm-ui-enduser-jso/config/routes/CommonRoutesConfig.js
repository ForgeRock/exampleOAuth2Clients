"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["org/forgerock/commons/ui/common/util/Constants"], function (constants) {

    var obj = {
        "404": { //this route must be the first route
            view: "org/forgerock/commons/ui/common/NotFoundView",
            url: /^([\w\W]*)$/,
            pattern: "?"
        },
        "default": {
            event: constants.EVENT_HANDLE_DEFAULT_ROUTE,
            url: /^$/,
            pattern: ""
        },
        "enableCookies": {
            view: "org/forgerock/commons/ui/common/EnableCookiesView",
            url: "enableCookies/"
        },
        //definitions for the following views here are generic
        //the actual path to each view is defined in config/AppConfiguration.js
        //view files are loaded when the GenericRouteInterfaceMap module is initialized
        "login": {
            view: "LoginView",
            url: /^login([^\&]+)?(&.+)?/,
            pattern: "login??",
            defaults: ["/", ""],
            argumentNames: ["realm", "additionalParameters"]
        },
        "logout": {
            event: constants.EVENT_LOGOUT,
            url: /^logout\/(.*)/
        },
        "loginDialog": {
            dialog: "LoginDialog",
            url: "loginDialog/"
        }
    };

    return obj;
});
