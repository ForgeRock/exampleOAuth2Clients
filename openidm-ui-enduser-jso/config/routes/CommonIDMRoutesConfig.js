"use strict";

/*
 * Copyright 2014-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define([], function () {

    var obj = {
        "mandatoryPasswordChangeDialog": {
            base: "landingPage",
            dialog: "org/forgerock/openidm/ui/common/MandatoryPasswordChangeDialog",
            url: "change_password/",
            role: "ui-admin"
        },
        "authenticationUnavailable": {
            view: "org/forgerock/openidm/ui/common/login/AuthenticationUnavailable",
            url: "authenticationUnavailable/"
        },
        "openerHandler": {
            view: "org/forgerock/openidm/ui/common/login/OpenerHandler",
            url: /^openerHandler\/(.*)$/,
            pattern: "openerHandler/?"
        },
        "adminEditSystemObjectView": {
            view: "org/forgerock/openidm/ui/common/resource/EditResourceView",
            role: "ui-admin",
            url: /^resource\/(system)\/(.+)\/(.+)\/edit\/(.+)\/(.+)$/,
            pattern: "resource/?/?/?/edit/?/?",
            forceUpdate: true
        },
        "adminNewSystemObjectView": {
            view: "org/forgerock/openidm/ui/common/resource/EditResourceView",
            role: "ui-admin",
            url: /^resource\/(system)\/(.+)\/(.+)\/add\/$/,
            pattern: "resource/?/?/?/add/"
        },
        "adminListManagedObjectView": {
            view: "org/forgerock/openidm/ui/common/resource/ListResourceView",
            role: "ui-admin",
            url: /^resource\/(managed)\/(.+)\/list\/$/,
            pattern: "resource/?/?/list/"
        },
        "adminEditManagedObjectView": {
            view: "org/forgerock/openidm/ui/common/resource/EditResourceView",
            role: "ui-admin",
            url: /^resource\/(managed)\/(.+)\/edit\/(.+)$/,
            pattern: "resource/?/?/edit/?"
        },
        "adminNewManagedObjectView": {
            view: "org/forgerock/openidm/ui/common/resource/EditResourceView",
            role: "ui-admin",
            url: /^resource\/(managed)\/(.+)\/add\/$/,
            pattern: "resource/?/?/add/"
        },
        "adminEditRoleEntitlementView": {
            view: "org/forgerock/openidm/ui/common/resource/EditResourceView",
            role: "ui-admin",
            url: /^resource\/(managed)\/(role)\/edit\/(.+)\/(.+)$/,
            pattern: "resource/?/?/edit/?/?"
        }
    };

    return obj;
});
