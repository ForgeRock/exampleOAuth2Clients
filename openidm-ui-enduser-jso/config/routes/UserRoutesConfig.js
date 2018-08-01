"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define([], function () {
    //definitions for views here are generic
    //the actual path to each view is defined in config/AppConfiguration.js
    //view files are mapped aliases registered within requirejs
    var obj = {
        "profile": {
            view: "UserProfileView",
            role: "ui-self-service-user",
            url: /^profile\/(.*)/,
            pattern: "profile/?",
            defaults: ["details"],
            navGroup: "user"
        },
        "forgotUsername": {
            view: "ForgotUsernameView",
            url: /^forgotUsername(\/[^\&]*)(\&.+)?/,
            pattern: "forgotUsername??",
            argumentNames: ["realm", "additionalParameters"],
            defaults: ["/", ""]
        },
        "passwordReset": {
            view: "PasswordResetView",
            url: /^passwordReset(\/[^\&]*)(\&.+)?/,
            pattern: "passwordReset??",
            argumentNames: ["realm", "additionalParameters"],
            defaults: ["/", ""]
        },
        "selfRegistration": {
            view: "RegisterView",
            url: /^register(\/[^\&]*)(\&.+)?/,
            pattern: "register??",
            argumentNames: ["realm", "additionalParameters"],
            defaults: ["/", ""]
        }
    };

    return obj;
});
