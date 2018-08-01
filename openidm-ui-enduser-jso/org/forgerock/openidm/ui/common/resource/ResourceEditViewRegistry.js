"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["underscore", "org/forgerock/commons/ui/common/main/AbstractConfigurationAware", "org/forgerock/commons/ui/common/util/ModuleLoader"], function (_, AbstractConfigurationAware, ModuleLoader) {
    var obj = new AbstractConfigurationAware();

    obj.updateConfigurationCallback = function (conf) {
        this.configuration = conf;

        _.each(conf, function (val, key) {
            require.config({ "map": { "*": { key: val }
                }
            });
        });
    };

    obj.getEditViewModule = function (resource) {
        if (_.isUndefined(this.configuration["resource-" + resource])) {
            return ModuleLoader.load("org/forgerock/openidm/ui/common/resource/GenericEditResourceView");
        } else {
            return ModuleLoader.load(this.configuration["resource-" + resource]);
        }
    };

    return obj;
});
