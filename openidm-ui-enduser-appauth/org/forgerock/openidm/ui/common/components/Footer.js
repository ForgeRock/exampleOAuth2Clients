"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "org/forgerock/commons/ui/common/components/Footer", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/openidm/ui/common/delegates/InfoDelegate"], function ($, _, Footer, Configuration, InfoDelegate) {
    function isAdmin() {
        return Configuration.loggedUser && _.has(Configuration.loggedUser, "roles") && _.indexOf(Configuration.loggedUser.uiroles, "ui-admin") > -1;
    }

    var Component = Footer.extend({
        getVersion: function getVersion() {
            return InfoDelegate.getVersion().then(function (data) {
                return data.productVersion + " (" + $.t("openidm.admin.revision") + ": " + data.productRevision + ")";
            });
        },
        showVersion: function showVersion() {
            return isAdmin();
        }
    });

    return new Component();
});
