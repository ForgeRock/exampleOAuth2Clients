"use strict";

/*
 * Copyright 2012-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["underscore", "jquery", "org/forgerock/commons/ui/common/main/AbstractConfigurationAware", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/util/Constants"], function (_, $, AbstractConfigurationAware, eventManager, constants) {
    var obj = new AbstractConfigurationAware();

    obj.handleError = function (error, handlers) {
        var handler;

        if (error.error && !error.status) {
            error.status = error.error;
        }

        if (error.hasOwnProperty('responseText')) {
            try {
                error.responseObj = $.parseJSON(error.responseText);
            } catch (parseErr) {/* Must not be JSON */}
        }

        if (handlers) {
            //find match in handlers
            handler = obj.matchError(error, handlers);
        }

        if (!handler) {
            //find match in default handlers
            handler = obj.matchError(error, obj.configuration.defaultHandlers);
        }

        if (handler) {
            // conditional check needed here until calls to authentication?_action=reauthenticate and
            // OpenAM authentication no longer produce 403 status
            if (error.hasOwnProperty("responseObj") && error.responseObj !== null && !(error.responseObj.code === 403 && error.responseObj.message === "SSO Token cannot be retrieved." || error.responseObj.error === 403 && error.responseObj.message === "Reauthentication failed" || error.responseObj.error === 409 && error.responseObj.message.match(/value to replace not found$/))) {
                if (handler.event) {
                    eventManager.sendEvent(handler.event, { handler: handler, error: error });
                }

                if (handler.message) {
                    eventManager.sendEvent(constants.EVENT_DISPLAY_MESSAGE_REQUEST, handler.message);
                }
            }
        } else {
            console.error(error.status);
            eventManager.sendEvent(constants.EVENT_DISPLAY_MESSAGE_REQUEST, "unknown");
        }
    };

    /**
     * If a generic field for comparison is defined on the handler, that field is then compared to the corresponding
     * field on the error.
     *
     * If there is a status defined on the handler, it is compared to the status of the error.
     *
     * If either of these comparisons is true than that handler is returned.
     *
     * @example
     *  errorsHandlers: {
     *      "timeout": {
     *          "value": 0,
     *          "field": "readyState"
     *      }
     *  }
     *
     * @param error
     * @param handlers
     * @returns {*}
     */
    obj.matchError = function (error, handlers) {
        var handler, handlerName;

        for (handlerName in handlers) {
            handler = handlers[handlerName];

            if (!_.isUndefined(handler.field)) {
                if (error[handler.field] === handler.value) {
                    return handler;
                }
            }

            if (handler.status) {
                if (parseInt(error.status, 0) === parseInt(handler.status, 0)) {
                    return handler;
                }
            }

            //TODO add support for openidm errors
        }
    };

    return obj;
});
