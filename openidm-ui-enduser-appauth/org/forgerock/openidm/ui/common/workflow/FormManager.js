"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["org/forgerock/commons/ui/common/main/AbstractConfigurationAware"], function (AbstractConfigurationAware, eventManager) {
    var obj = new AbstractConfigurationAware();

    obj.getViewForForm = function (name) {
        return obj.configuration.forms[name];
    };

    return obj;
});
