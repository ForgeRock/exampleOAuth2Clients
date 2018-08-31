"use strict";

/*
 * Copyright 2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "org/forgerock/commons/ui/common/main/AbstractDelegate"], function ($, AbstractDelegate) {

    var obj = Object.create(AbstractDelegate.prototype);

    obj.setDataPoints = function (dataPoints, userId) {
        this.dataPoints = dataPoints;
        this.userId = userId;
        this.serviceUrl = this.dataPoints.baseUrl + this.userId;
    };

    obj.serviceCall = function (params) {
        params.headers = params.headers || {};
        // unset these default headers in the requests which are issued to AM
        params.headers["X-OpenIDM-DataStoreToken"] = "";
        params.headers["X-OpenIDM-OAuth-Login"] = "";
        return AbstractDelegate.prototype.serviceCall.call(this, params);
    };

    obj.getAuditHistory = function () {
        var promise = $.Deferred();

        this.serviceCall({
            url: this.dataPoints["auditHistory"] + '?_sortKeys=-eventTime&_queryFilter=true',
            errorsHandlers: {
                "noUMA": { status: 501 }
            }
        }).then(function (resp) {
            return promise.resolve(resp);
        }, function () {
            return promise.resolve(null);
        });

        return promise;
    };

    obj.getPendingRequests = function () {
        var promise = $.Deferred();

        this.serviceCall({
            url: "/uma/pendingrequests?_sortKeys=-when&_queryFilter=true",
            errorsHandlers: {
                "noUMA": { status: 501 }
            }
        }).then(function (resp) {
            return promise.resolve(resp);
        }, function () {
            return promise.resolve(null);
        });

        return promise;
    };

    obj.AdministrateResourceRequests = function (requestID, allow, scopes) {
        var promise = $.Deferred(),
            payload = scopes || {};

        this.serviceCall({
            type: "POST",
            url: "/uma/pendingrequests/" + requestID + "?_action=" + (allow ? "approve" : "deny"),
            errorsHandlers: {
                "noUMA": { status: 501 }
            },
            data: JSON.stringify(payload)
        }).then(function (resp) {
            return promise.resolve(resp);
        }, function () {
            return promise.resolve(null);
        });

        return promise;
    };

    obj.getResourceSet = function (filter) {
        var promise = $.Deferred(),
            query = '?_queryId=*';

        if (filter) {
            query = '?_sortKeys=-eventTime&_queryFilter=name+co+"' + filter + '"';
        }

        this.serviceCall({
            url: this.dataPoints["resourceSet"] + query,
            errorsHandlers: {
                "noUMA": { status: 501 }
            }
        }).then(function (resp) {
            return promise.resolve(resp);
        }, function () {
            return promise.resolve(null);
        });

        return promise;
    };

    obj.AdministrateResourceRequests = function (requestID, allow, scopes) {
        var promise = $.Deferred(),
            payload = scopes || {};

        this.serviceCall({
            type: "POST",
            url: "/uma/pendingrequests/" + requestID + "?_action=" + (allow ? "approve" : "deny"),
            errorsHandlers: {
                "noUMA": { status: 501 }
            },
            data: JSON.stringify(payload)
        }).then(function (resp) {
            return promise.resolve(resp);
        }, function () {
            return promise.resolve(null);
        });

        return promise;
    };

    obj.shareResource = function (id, objectParams) {
        return this.serviceCall({
            url: "/uma/policies/" + id,
            type: "PUT",
            data: JSON.stringify(objectParams)
        });
    };

    obj.unshareResource = function (id) {
        return this.serviceCall({
            url: "/uma/policies/" + id,
            type: "DELETE"
        });
    };

    obj.getTrustedDevices = function () {
        return this.serviceCall({
            url: this.dataPoints["trustedDevices"] + '?_queryId=*'
        });
    };

    obj.deleteTrustedDevice = function (deviceId) {
        return this.serviceCall({
            url: this.dataPoints["trustedDevices"] + deviceId,
            type: "DELETE"
        });
    };

    obj.getOAuthApplications = function () {
        return this.serviceCall({
            url: this.dataPoints["oauthApplications"] + '?_queryId=*'
        });
    };

    obj.deleteOAuthApplication = function (applicationId) {
        return this.serviceCall({
            url: this.dataPoints["oauthApplications"] + applicationId,
            type: "DELETE"
        });
    };

    return obj;
});
