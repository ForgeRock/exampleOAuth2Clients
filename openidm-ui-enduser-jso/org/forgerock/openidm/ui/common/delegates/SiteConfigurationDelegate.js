"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["org/forgerock/openidm/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/AbstractDelegate", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/main/EventManager"], function (Constants, AbstractDelegate, configuration) {

    var obj = new AbstractDelegate(Constants.host + Constants.context + "/info/uiconfig");

    obj.getConfiguration = function (successCallback, errorCallback) {
        var headers = {};
        headers[Constants.HEADER_PARAM_USERNAME] = "anonymous";
        headers[Constants.HEADER_PARAM_PASSWORD] = "anonymous";
        headers[Constants.HEADER_PARAM_NO_SESSION] = "true";

        return obj.serviceCall({
            url: "",
            headers: headers
        }).then(function (data) {
            if (successCallback) {
                successCallback(data.configuration);
            }
            return data.configuration;
        }, errorCallback);
    };
    return obj;
});
