"use strict";

/*
 * Copyright 2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/AbstractDelegate"], function (Constants, AbstractDelegate) {

    var obj = new AbstractDelegate(Constants.host + Constants.context + "/schema/");

    obj.getSchema = function (location) {
        return obj.serviceCall({
            url: location,
            type: "GET",
            errorsHandlers: {
                "noSchemaFound": { status: 404 }
            } });
    };
    return obj;
});
