"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["underscore", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/ServiceInvoker"], function (_, Constants, serviceInvoker) {

    var obj = {},
        taskManagementUrl,
        processManagementUrl,
        taskDefinitionUrl,
        processDefinitionUrl,
        endpointUrl,
        processDefinitionsEndpointUrl;

    taskManagementUrl = Constants.host + Constants.context + "/workflow/taskinstance";
    processManagementUrl = Constants.host + Constants.context + "/workflow/processinstance";
    processDefinitionUrl = Constants.host + Constants.context + "/workflow/processdefinition";
    endpointUrl = Constants.host + Constants.context + "/endpoint/gettasksview";
    processDefinitionsEndpointUrl = Constants.host + Constants.context + "/endpoint/getprocessesforuser";

    obj.startProccess = function (proccessNameKey, params, successCallback, errorCallback) {
        console.debug("start proccess");
        params._key = proccessNameKey;
        this.serviceCall({ url: processManagementUrl + "/?_action=create", type: "POST", success: successCallback, error: errorCallback, data: JSON.stringify(params) });
    };

    obj.startProcessById = function (processDefinitionId, params, successCallback, errorCallback) {
        console.debug("start proccess");
        params._processDefinitionId = processDefinitionId;
        this.serviceCall({ url: processManagementUrl + "/?_action=create", type: "POST", success: successCallback, error: errorCallback, data: JSON.stringify(params) });
    };

    obj.completeTask = function (id, params, successCallback, errorCallback) {
        this.serviceCall({ url: taskManagementUrl + "/" + id + "?_action=complete", type: "POST", success: successCallback, error: errorCallback, data: JSON.stringify(params) });
    };

    obj.getProcessDefinition = function (id, successCallback, errorCallback) {
        this.serviceCall({ url: processDefinitionUrl + "/" + id, type: "GET", success: successCallback, error: errorCallback });
    };

    obj.getAllProcessDefinitions = function (successCallback, errorCallback) {
        obj.serviceCall({
            url: processDefinitionsEndpointUrl,
            type: "GET",
            success: function success(data) {
                if (successCallback) {
                    successCallback(data.processes);
                }
            },
            error: errorCallback
        });
    };

    obj.getAllUniqueProcessDefinitions = function (successCallback, errorCallback) {
        obj.getAllProcessDefinitions(function (processDefinitions) {

            var result = {},
                ret = [],
                i,
                processDefinition,
                splittedProcessDefinition,
                processName,
                currentProcessVersion,
                newProcesVersion,
                r;
            for (i = 0; i < processDefinitions.length; i++) {
                processDefinition = processDefinitions[i];
                splittedProcessDefinition = processDefinition._id.split(':');
                processName = splittedProcessDefinition[0];
                if (result[processName]) {
                    currentProcessVersion = result[processName]._id.split(':')[1];
                    newProcesVersion = splittedProcessDefinition[1];
                    if (parseInt(newProcesVersion, 10) > parseInt(currentProcessVersion, 10)) {
                        result[processName] = processDefinition;
                    }
                } else {
                    result[processName] = processDefinition;
                }
            }
            for (r in result) {
                ret.push(result[r]);
            }
            successCallback(ret.sort(function (a, b) {
                return a.name > b.name ? 1 : -1;
            }));
        }, errorCallback);
    };

    obj.serviceCall = function (callParams) {
        serviceInvoker.restCall(callParams);
    };

    obj.assignTaskToUser = function (taskId, userName, successCallback, errorCallback) {
        var callParams, params;
        console.debug("assign user to task");
        params = { assignee: userName };
        callParams = { url: taskManagementUrl + "/" + taskId, type: "PUT", success: successCallback, error: errorCallback, data: JSON.stringify(params) };
        callParams.headers = [];
        callParams.headers["If-Match"] = '"*"';
        this.serviceCall(callParams);
    };

    obj.getAllTaskUsingEndpoint = function (userId, successCallback, errorCallback) {
        obj.serviceCall({
            url: endpointUrl + "?_queryId=gettasksview&userId=" + userId,
            type: "GET",
            success: function success(data) {
                if (_.isEmpty(data.result[0])) {
                    errorCallback();
                } else if (successCallback) {
                    successCallback(data.result[0]);
                }
            },
            error: errorCallback
        });
    };

    obj.getMyTaskUsingEndpoint = function (userId, successCallback, errorCallback) {
        obj.serviceCall({
            url: endpointUrl + "?_queryId=gettasksview&userId=" + userId + "&viewType=assignee",
            type: "GET",
            success: function success(data) {
                if (_.isEmpty(data.result[0])) {
                    errorCallback();
                } else if (successCallback) {
                    successCallback(data.result[0]);
                }
            },
            error: errorCallback
        });
    };

    return obj;
});
