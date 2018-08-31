"use strict";

/*
 * Copyright 2017-2018 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/openidm/ui/common/UserModel", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/main/AbstractConfigurationAware", "org/forgerock/commons/ui/common/main/ServiceInvoker", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/openidm/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/Router", "org/forgerock/openidm/ui/common/login/InternalLoginHelper"], function ($, _, UserModel, EventManager, AbstractConfigurationAware, serviceInvoker, conf, Constants, Router, InternalLoginHelper) {

    var obj = _.clone(InternalLoginHelper);

    obj.login = function (params, successCallback, errorCallback) {
        var authSuccess = function authSuccess(userModel) {
            /*
                If there is an authorization property on userModel we know this is not actually a UserModel.
                It is sessionDetails from info/login which has returned an authenticated but unauthorized user.
                Here is where we kick off the progressive profiling flow.
            */
            if (_.has(userModel, "authorization.requiredProfileProcesses") && userModel.authorization.requiredProfileProcesses.length > 0) {
                EventManager.sendEvent(Constants.EVENT_START_PROGRESSIVE_PROFILING, {
                    requiredProfileProcesses: userModel.authorization.requiredProfileProcesses
                });
            } else {
                successCallback(userModel);
            }
        };

        if (_.has(params, "userName") && _.has(params, "password")) {

            return new UserModel().login(params.userName, params.password).then(authSuccess, function (xhr) {
                var reason = xhr.responseJSON.reason;
                if (reason === "Unauthorized") {
                    reason = "authenticationFailed";
                }
                if (errorCallback) {
                    errorCallback(reason);
                }
            });
        } else if (_.has(params, "jwt")) {
            return new UserModel().autoLogin(params.jwt).then(authSuccess, function (xhr) {
                var reason = xhr.responseJSON.reason;

                if (reason === "Unauthorized") {
                    reason = "authenticationFailed";
                }

                if (errorCallback) {
                    errorCallback(reason);
                }
            });
        } else if (_.has(params, "oauthLogin")) {
            return new UserModel().oauthLogin(params.provider).then(authSuccess, function (xhr) {
                var reason = xhr.responseJSON.reason;

                if (reason === "Unauthorized" && _.get(params, "attemptRegister")) {
                    EventManager.sendEvent(Constants.EVENT_OAUTH_REGISTER, { errorCallback: errorCallback });
                } else {
                    errorCallback(xhr);
                }
            });
        }
    };

    return obj;
});
