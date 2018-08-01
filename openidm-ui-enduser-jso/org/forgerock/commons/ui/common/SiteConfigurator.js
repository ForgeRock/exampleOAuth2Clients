"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/commons/ui/common/main/AbstractConfigurationAware", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/util/ModuleLoader"], function ($, _, AbstractConfigurationAware, constants, eventManager, conf, ModuleLoader) {
    var obj = new AbstractConfigurationAware();

    obj.initialized = false;

    eventManager.registerListener(constants.EVENT_READ_CONFIGURATION_REQUEST, function () {
        if (!conf.globalData) {
            conf.setProperty('globalData', {});
            conf.globalData.auth = {};
        }

        if (!conf.delegateCache) {
            conf.setProperty('delegateCache', {});
        }

        if (obj.configuration && obj.initialized === false) {
            obj.initialized = true;

            if (obj.configuration.remoteConfig === true) {
                ModuleLoader.load(obj.configuration.delegate).then(function (configurationDelegate) {
                    configurationDelegate.getConfiguration(function (config) {
                        obj.processConfiguration(config);
                        eventManager.sendEvent(constants.EVENT_APP_INITIALIZED);
                    }, function () {
                        obj.processConfiguration({});
                        eventManager.sendEvent(constants.EVENT_APP_INITIALIZED);
                    });
                });
            } else {
                obj.processConfiguration(obj.configuration);
                eventManager.sendEvent(constants.EVENT_APP_INITIALIZED);
            }
        }
    });

    obj.processConfiguration = function (config) {
        // whatever settings were found will be saved in globalData
        _.extend(conf.globalData, config);

        if (config.defaultNotificationType) {
            conf.defaultType = config.defaultNotificationType;
        }

        if (config.notificationTypes) {
            conf.notificationTypes = config.notificationTypes;
        }

        if (config.roles) {
            conf.globalData.userRoles = config.roles;
        }

        conf.globalData.auth.cookieName = config.cookieName;
        conf.globalData.auth.cookieDomains = config.domains;
    };

    obj.configurePage = function (route, params) {
        var promise = $.Deferred();

        if (obj.configuration.remoteConfig === true) {
            ModuleLoader.load(obj.configuration.delegate).then(function (configurationDelegate) {
                if (typeof configurationDelegate.checkForDifferences === "function") {
                    configurationDelegate.checkForDifferences(route, params).then(function (config) {
                        if (config) {
                            obj.processConfiguration(config);
                        }
                        promise.resolve();
                    });
                } else {
                    promise.resolve();
                }
            });
        } else {
            promise.resolve();
        }

        return promise;
    };

    return obj;
});
