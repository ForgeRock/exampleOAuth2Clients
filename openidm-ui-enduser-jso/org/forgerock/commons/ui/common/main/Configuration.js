"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/util/Constants", "config/AppConfiguration"], function (eventManager, constants, appConfiguration) {
    var obj = {};
    obj.appConfiguration = appConfiguration;

    obj.setProperty = function (propertyName, propertyValue) {
        obj[propertyName] = propertyValue;
    };

    obj.removeModuleConfigurationProperty = function (moduleClassName, propertyName, propertyValue) {
        var moduleConf = obj.getModuleConfiguration(moduleClassName);
        moduleConf[propertyName] = propertyValue;
    };

    //NOT in use. NOT tested
    obj.appendToModuleConfigurationPropertyArray = function (moduleClassName, propertyName, propertyValue) {
        var moduleConf = obj.getModuleConfiguration(moduleClassName);
        if (!moduleConf[propertyName]) {
            moduleConf[propertyName] = [propertyValue];
        } else {
            moduleConf[propertyName].push(propertyValue);
        }
    };

    if (obj.appConfiguration.loggerLevel !== 'debug') {
        console.log = function () {};
        console.debug = function () {};
        console.info = function () {};
        console.error = function () {};
        console.warn = function () {};
    }

    obj.sendConfigurationChangeInfo = function () {
        var i;
        for (i = 0; i < obj.appConfiguration.moduleDefinition.length; i++) {
            eventManager.sendEvent(constants.EVENT_CONFIGURATION_CHANGED, obj.appConfiguration.moduleDefinition[i]);
        }
    };

    obj.sendSingleModuleConfigurationChangeInfo = function (moduleClassName) {
        var i;
        for (i = 0; i < obj.appConfiguration.moduleDefinition.length; i++) {
            if (moduleClassName === obj.appConfiguration.moduleDefinition[i].moduleClass) {
                eventManager.sendEvent(constants.EVENT_CONFIGURATION_CHANGED, obj.appConfiguration.moduleDefinition[i]);
                return;
            }
        }
        console.warn("No module name " + moduleClassName + " found to send configuration to");
    };

    obj.getModuleConfiguration = function (moduleClass) {
        var i;
        for (i = 0; i < obj.appConfiguration.moduleDefinition.length; i++) {
            if (obj.appConfiguration.moduleDefinition[i].moduleClass === moduleClass) {
                return obj.appConfiguration.moduleDefinition[i].configuration;
            }
        }
    };

    return obj;
});
