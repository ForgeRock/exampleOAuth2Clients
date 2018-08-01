"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["org/forgerock/commons/ui/common/util/Constants"], function (Constants) {
    return {
        "badRequest": {
            status: "400",
            message: "badRequestError"
        },
        "unauthenticated": {
            status: "401",
            event: Constants.EVENT_UNAUTHENTICATED
        },
        "forbidden": {
            status: "403",
            event: Constants.EVENT_UNAUTHORIZED,
            message: "forbiddenError"
        },
        "notFound": {
            status: "404",
            message: "notFoundError"
        },
        "conflict": {
            status: "409",
            message: "conflictError"
        },
        "serverError": {
            status: "503",
            event: Constants.EVENT_SERVICE_UNAVAILABLE
        },
        "internalServerError": {
            status: "500",
            message: "internalError"
        },
        "incorrectRevision": {
            status: "412",
            message: "incorrectRevisionError"
        }
    };
});
