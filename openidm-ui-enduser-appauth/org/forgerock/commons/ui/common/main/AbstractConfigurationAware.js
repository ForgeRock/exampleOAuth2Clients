"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "org/forgerock/commons/ui/common/util/ModuleLoader"], function ($, _, ModuleLoader) {

    var obj = function AbstractConfigurationAware() {};

    obj.prototype.updateConfigurationCallback = function (configuration) {
        this.configuration = configuration;

        /*
            Configuration entries may have a "loader" defined, like so:
            loader: [
                {"messages": "config/messages/CommonMessages"},
                {"messages": "config/messages/UserMessages"}
            ]
            Every key found within each map in the array will be used to populate
            an item of the same name within this.configuration. For example, using the above
            you would expect this.configuration.messages to contain the merged values from
            the objects returned from "config/messages/CommonMessages" and
            "config/messages/UserMessages".
             It should be noted that these configuration items are loaded asynchronously,
            and as such this function returns a promise that is only resolved when they are
            all available.
        */
        return $.when.apply($, _.map(configuration.loader, function (mapToLoad) {
            return $.when.apply($, _.map(_.pairs(mapToLoad), function (loadPair) {
                return ModuleLoader.load(loadPair[1]).then(function (loaded) {
                    return _.extend(configuration[loadPair[0]], loaded);
                });
            }));
        }));
    };

    return obj;
});
