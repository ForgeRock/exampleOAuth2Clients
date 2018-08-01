"use strict";

/*
 * Copyright 2014-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/commons/ui/common/main/AbstractDelegate", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/util/OAuth"], function ($, _, AbstractDelegate, Configuration, Constants, OAuth) {

    var obj = new AbstractDelegate(Constants.host + Constants.context + "/identityProviders");

    obj.loginProviders = function () {
        var headers = {},
            promise = $.Deferred();
        headers[Constants.HEADER_PARAM_USERNAME] = "anonymous";
        headers[Constants.HEADER_PARAM_PASSWORD] = "anonymous";
        headers[Constants.HEADER_PARAM_NO_SESSION] = "true";

        return obj.serviceCall({
            url: "",
            serviceUrl: Constants.host + Constants.context + "/authentication",
            type: "get",
            headers: headers
        }).then(function (results) {
            return results;
        });
    };

    obj.providerList = function () {
        var promise = $.Deferred();

        obj.serviceCall({
            url: "",
            type: "get",
            errorsHandlers: {
                "notfound": { status: 404 }
            }
        }).then(function (results) {
            promise.resolve(results);
        }, function () {
            promise.resolve({ providers: [] });
        });
        return promise;
    };

    obj.getAuthRedirect = function (provider, landingPage) {
        var headers = {};
        headers[Constants.HEADER_PARAM_USERNAME] = "anonymous";
        headers[Constants.HEADER_PARAM_PASSWORD] = "anonymous";
        headers[Constants.HEADER_PARAM_NO_SESSION] = "true";

        return obj.serviceCall({
            type: "POST",
            url: "?_action=getAuthRedirect",
            data: JSON.stringify({ provider: provider, landingPage: landingPage }),
            headers: headers
        }).then(function (response) {
            localStorage.setItem("dataStoreToken", response.token);
            return response.redirect;
        });
    };

    obj.availableProviders = function () {
        var headers = {},
            promise = $.Deferred();
        obj.serviceCall({
            url: "?_action=availableProviders",
            type: "post",
            errorsHandlers: {
                "notfound": { status: 404 }
            }
        }).then(function (results) {
            promise.resolve(results);
        }, function () {
            promise.resolve({ providers: [] });
        });
        return promise;
    };

    return obj;
});
