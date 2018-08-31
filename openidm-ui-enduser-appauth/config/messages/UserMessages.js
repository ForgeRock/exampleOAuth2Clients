"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define([], function () {

    var obj = {
        "usernameNotFound": {
            msg: "config.messages.UserMessages.usernameNotFound",
            type: "error"
        },
        "noEmailProvided": {
            msg: "config.messages.UserMessages.noEmailProvided",
            type: "error"
        },
        "emailNotSent": {
            msg: "config.messages.UserMessages.emailNotSent",
            type: "error"
        },
        "unableToRegister": {
            msg: "config.messages.UserMessages.unableToRegister",
            type: "error"
        },
        "invalidOldPassword": {
            msg: "config.messages.UserMessages.invalidOldPassword",
            type: "error"
        },
        "changedPassword": {
            msg: "config.messages.UserMessages.changedPassword",
            type: "info"
        },
        "userProfileIncorrectPassword": {
            msg: "config.messages.UserMessages.userProfileIncorrectPassword",
            type: "error"
        },
        "profileUpdateSuccessful": {
            msg: "config.messages.UserMessages.profileUpdateSuccessful",
            type: "info"
        },
        "userNameUpdated": {
            msg: "config.messages.UserMessages.userNameUpdated",
            type: "info"
        },
        "afterRegistration": {
            msg: "config.messages.UserMessages.afterRegistration",
            type: "info"
        },
        "userAlreadyExists": {
            msg: "config.messages.UserMessages.userAlreadyExists",
            type: "error"
        },
        "errorDeletingNotification": {
            msg: "config.messages.UserMessages.errorDeletingNotification",
            type: "error"
        },
        "errorFetchingNotifications": {
            msg: "config.messages.UserMessages.errorFetchingNotifications",
            type: "error"
        },
        "identityNoSpace": {
            msg: "config.messages.UserMessages.identityNoSpace",
            type: "error"
        },
        "selfRegistrationDisabled": {
            msg: "config.messages.UserMessages.selfRegistrationDisabled",
            type: "error"
        }
    };

    return obj;
});
