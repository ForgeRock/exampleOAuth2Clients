"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["lodash", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/AbstractDelegate", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/main/EventManager"], function (_, Constants, AbstractDelegate, configuration, eventManager) {

    var obj = new AbstractDelegate(Constants.host + Constants.context + "/policy");

    obj.jsonPointerToPath = function (pointer) {
        return pointer.split('/').filter(function (p) {
            return p;
        }).join('.');
    };

    obj.validateProperty = function (baseEntity, args, callback) {
        /*
         * We are calling the validateObject action here instead of validateProperty
         * because we need to pass in entire object context in order to support policies
         * which may depend upon other properties.  From the response, we look to see if the
         * particular property we are attempting to validate was included in the list of those
         * with errors.
         */
        return obj.serviceCall({
            suppressSpinner: true,
            url: "/" + baseEntity + "?_action=validateObject",
            data: JSON.stringify(args.fullObject),
            type: "POST"
        }).then(function (data) {
            var properyFailures = _(data.failedPolicyRequirements).filter(function (failedReq) {
                var jsonPathName = obj.jsonPointerToPath(failedReq.property);
                return jsonPathName === args.property;
            }).map(function (failedReq) {
                return failedReq.policyRequirements;
            }).flatten().value();

            if (!properyFailures.length) {
                return { "result": true };
            } else {
                return {
                    "result": false,
                    "failedPolicyRequirements": properyFailures
                };
            }
        }).done(function (result) {
            if (callback) {
                callback(result);
            }
        });
    };

    return obj;
});
