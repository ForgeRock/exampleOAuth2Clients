"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/AbstractDelegate", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/main/EventManager"], function (Constants, AbstractDelegate, configuration, eventManager) {

    var obj = new AbstractDelegate(Constants.host + Constants.context + "/endpoint/usernotifications");

    obj.getNotificationsForUser = function (successCallback, errorCallback) {
        obj.serviceCall({
            url: "",
            success: function success(data) {
                if (successCallback) {
                    successCallback(data);
                }
            },
            error: errorCallback
        });
    };

    obj.deleteEntity = function (id, successCallback, errorCallback) {
        var callParams = { url: "/" + id, type: "DELETE", success: successCallback, error: errorCallback };
        this.serviceCall(callParams);
    };

    return obj;
});
