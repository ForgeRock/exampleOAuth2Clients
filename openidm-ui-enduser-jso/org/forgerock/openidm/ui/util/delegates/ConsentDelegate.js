"use strict";

/*
 * Copyright 2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/commons/ui/common/main/AbstractDelegate", "org/forgerock/commons/ui/common/util/Constants"], function ($, _, AbstractDelegate, Constants) {

    var obj = new AbstractDelegate(Constants.host + Constants.context + "/consent");

    obj.getConsentMappings = function () {
        var promise = $.Deferred();

        obj.serviceCall({
            url: "?_action=getConsentMappings",
            type: "POST"
        }).then(function (consent) {
            promise.resolve(consent);
        });

        return promise;
    };

    return obj;
});
