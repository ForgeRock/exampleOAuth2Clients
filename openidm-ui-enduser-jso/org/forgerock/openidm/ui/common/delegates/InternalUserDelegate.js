"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/AbstractDelegate", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/main/EventManager"], function (Constants, AbstractDelegate, configuration, eventManager) {

    var obj = new AbstractDelegate(Constants.host + Constants.context + "/repo/internal/user");

    obj.patchSelectedUserAttributes = function (id, rev, patchDefinitionObject, successCallback, errorCallback, noChangesCallback) {
        //PATCH for repo is unsupported

        return obj.readEntity(id).then(function (user) {
            var i, v;

            for (i = 0; i < patchDefinitionObject.length; i++) {
                v = patchDefinitionObject[i];

                // replace any leading slashes to translate basic JSON Pointer
                // back into regular JS object property references
                v.field = v.field.replace(/^\//, '');

                user[v.field] = v.value;
            }

            return obj.updateEntity(id, user, successCallback, errorCallback);
        });
    };

    return obj;
});
