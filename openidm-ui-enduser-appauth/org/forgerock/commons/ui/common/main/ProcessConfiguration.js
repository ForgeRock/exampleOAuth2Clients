"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/main/AbstractConfigurationAware", "org/forgerock/commons/ui/common/util/ModuleLoader"], function ($, _, constants, eventManager, configuration, AbstractConfigurationAware, ModuleLoader) {

    var obj = new AbstractConfigurationAware();
    obj.em = eventManager;

    eventManager.registerListener(constants.EVENT_CONFIGURATION_CHANGED, function (event) {
        obj.callService(event.moduleClass, "updateConfigurationCallback", [event.configuration]);
    });

    eventManager.registerListener(constants.EVENT_DEPENDENCIES_LOADED, function () {
        obj.callService("org/forgerock/commons/ui/common/main/Configuration", "sendConfigurationChangeInfo");
    });

    obj.callRegisterListenerFromConfig = function (config) {
        eventManager.registerListener(config.startEvent, function (event) {
            return obj.getProcessDescriptionFromConfig(config).then(function (func) {
                return func.apply(this, [event]);
            });
        });
    };

    /**
     * Provides a method to obtain a reference to a dependencies loaded version of the #processDescription
     * function for a given configuration.
     * <p/>
     * The returned function will already have it's dependencies loaded and provided,
     * leaving only the event as a required parameter.
     * @param {Object} configuration The configuration to use
     * @returns {Promise<function>} The processDescription function for the given configuration with its
     * dependencies already provided.
     * @example
     * ProcessConfiguration.getProcessDescriptionFromConfig({ ... }).then((func) => {
     *   func(event); // Any dependencies have already been provided
     * })
     */
    obj.getProcessDescriptionFromConfig = function (configuration) {
        var promise = $.Deferred();

        require(configuration.dependencies, function () {
            var partialRightArgs = [configuration.processDescription].concat(_.toArray(arguments)),
                processDescriptionWithDependencies = _.partialRight.apply(null, partialRightArgs);
            promise.resolve(processDescriptionWithDependencies);
        });

        return promise;
    };

    obj.updateConfigurationCallback = function (configuration) {
        AbstractConfigurationAware.prototype.updateConfigurationCallback.call(this, configuration).then(function () {

            $.when.apply($, _.map(obj.configuration.processConfigurationFiles, ModuleLoader.load)).then(function () {

                var // all processes
                processArray = _.flatten(_.toArray(arguments)),

                // processes which override the default of the same name
                overrideArray = _.filter(processArray, function (process) {
                    return !!process.override;
                });

                // remove those processes which have been overridden
                processArray = _.reject(processArray, function (process) {
                    return !process.override && _.find(overrideArray, function (override) {
                        return override.startEvent === process.startEvent && !!override.override;
                    });
                });

                _.map(processArray, obj.callRegisterListenerFromConfig);

                eventManager.sendEvent(constants.EVENT_READ_CONFIGURATION_REQUEST);
            });
        });
    };

    obj.callService = function (serviceId, methodName, params) {
        ModuleLoader.load(serviceId).then(function (service) {
            if (service) {
                service[methodName].apply(service, params || []);
            }
        }, function (exception) {
            if (params) {
                params = JSON.stringify(params);
            }
            console.warn("Unable to invoke serviceId=" + serviceId + " method=" + methodName + " params=" + params + " exception=" + exception);
        });
    };

    return obj;
});
