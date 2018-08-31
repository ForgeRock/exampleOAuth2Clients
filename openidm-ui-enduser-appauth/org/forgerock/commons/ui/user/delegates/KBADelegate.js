"use strict";

/*
 * Copyright 2015-2018 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "org/forgerock/commons/ui/common/main/AbstractDelegate", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/util/Constants"], function ($, _, AbstractDelegate, Configuration, Constants) {
    var KBADelegate = new AbstractDelegate(Constants.context + "/" + Constants.SELF_SERVICE_CONTEXT);

    KBADelegate.getInfo = function () {
        return this.serviceCall({ "url": "kba" });
    };

    KBADelegate.saveInfo = function (user) {
        var errorHandlers = {
            "error": {
                status: "400"
            }
        };

        return this.serviceCall({
            "type": "PATCH",
            "url": "user/" + Configuration.loggedUser.id,
            "data": JSON.stringify(_(user).map(function (value, key) {
                return {
                    "operation": "replace",
                    "field": "/" + key,
                    // replace the whole value, rather than just the parts that have changed,
                    // since there is no consistent way to target items in a set across the stack
                    "value": value
                };
            })),
            errorsHandlers: errorHandlers
        }).then(function (updatedUser) {
            return Configuration.loggedUser.save(updatedUser, { "silent": true });
        });
    };

    return KBADelegate;
});
