"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["underscore", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/AbstractDelegate"], function (_, Constants, AbstractDelegate) {

    var obj = new AbstractDelegate(Constants.host + Constants.context + "/script");

    obj.evalScript = function (script, additionalGlobals) {
        var scriptDetails = _.cloneDeep(script);

        if (_.isUndefined(scriptDetails.globals) || _.isNull(scriptDetails.globals)) {
            scriptDetails.globals = {};
        }

        if (additionalGlobals) {
            scriptDetails.globals = _.extend(scriptDetails.globals, additionalGlobals);
        }

        return obj.serviceCall({
            url: "?_action=eval",
            type: "POST",
            data: JSON.stringify(scriptDetails),
            errorsHandlers: {
                "error": {
                    status: "500"
                }
            }
        });
    };

    obj.evalLinkQualifierScript = function (script) {
        script.globals = script.globals || {};
        script.globals.returnAll = true;

        return obj.evalScript(script);
    };

    obj.parseQueryFilter = function (filterString) {
        return obj.evalScript({
            "type": "text/javascript",
            "source": "org.forgerock.json.resource.QueryFilters.parse(queryFilter).accept(new org.forgerock.util.query.MapFilterVisitor(), null);",
            "globals": {
                "queryFilter": filterString
            }
        });
    };

    return obj;
});
