"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/*
 * Copyright 2014-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/openidm/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/EventManager"], function ($, _, constants, eventManager) {
    var ignorePassword = false,
        obj = [{
        startEvent: constants.EVENT_POLICY_FAILURE,
        description: "Failure to save record due to policy validation",
        dependencies: ["org/forgerock/openidm/ui/common/util/PolicyValidatorsManager"],
        processDescription: function processDescription(event, PolicyValidatorsManager) {
            var response = event.error.responseObj,
                failedProperties,
                errors = "Unknown";

            if ((typeof response === "undefined" ? "undefined" : _typeof(response)) === "object" && response !== null && _typeof(response.detail) === "object" && (response.message === "Failed policy validation" || response.message === "Policy validation failed")) {

                errors = PolicyValidatorsManager.failedPolicyRequirementObjectsToStrings(response.detail.failedPolicyRequirements).join(" ");
            }

            eventManager.sendEvent(constants.EVENT_DISPLAY_MESSAGE_REQUEST, { key: "resourceValidationError", validationErrors: errors });
        }
    }, {
        startEvent: constants.EVENT_NOTIFICATION_DELETE_FAILED,
        description: "Error in deleting notification",
        dependencies: [],
        processDescription: function processDescription(event) {
            eventManager.sendEvent(constants.EVENT_DISPLAY_MESSAGE_REQUEST, "errorDeletingNotification");
        }
    }, {
        startEvent: constants.EVENT_GET_NOTIFICATION_FOR_USER_ERROR,
        description: "Error in getting notifications",
        dependencies: [],
        processDescription: function processDescription(event) {
            eventManager.sendEvent(constants.EVENT_DISPLAY_MESSAGE_REQUEST, "errorFetchingNotifications");
        }
    }];

    return obj;
});
