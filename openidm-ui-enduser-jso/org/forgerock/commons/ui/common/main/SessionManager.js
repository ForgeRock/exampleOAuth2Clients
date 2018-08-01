"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/commons/ui/common/util/CookieHelper", "org/forgerock/commons/ui/common/main/AbstractConfigurationAware", "org/forgerock/commons/ui/common/util/ModuleLoader"], function ($, _, cookieHelper, AbstractConfigurationAware, ModuleLoader) {
    var obj = new AbstractConfigurationAware();

    obj.login = function (params, successCallback, errorCallback) {
        // resets the session cookie to discard old session that may still exist
        cookieHelper.deleteCookie("session-jwt", "/", "");
        return ModuleLoader.load(obj.configuration.loginHelperClass).then(function (helper) {
            return ModuleLoader.promiseWrapper(_.bind(_.curry(helper.login)(params), helper), {
                success: successCallback,
                error: errorCallback
            });
        });
    };

    obj.logout = function (successCallback, errorCallback) {
        return ModuleLoader.load(obj.configuration.loginHelperClass).then(function (helper) {
            return ModuleLoader.promiseWrapper(_.bind(helper.logout, helper), {
                success: successCallback,
                error: errorCallback
            });
        });
    };

    obj.getLoggedUser = function (successCallback, errorCallback) {
        return ModuleLoader.load(obj.configuration.loginHelperClass).then(function (helper) {
            return ModuleLoader.promiseWrapper(_.bind(helper.getLoggedUser, helper), {
                success: successCallback,
                error: errorCallback
            });
        });
    };

    return obj;
});
