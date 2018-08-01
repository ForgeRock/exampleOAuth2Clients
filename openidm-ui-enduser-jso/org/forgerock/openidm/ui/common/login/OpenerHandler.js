"use strict";

/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "handlebars", "org/forgerock/commons/ui/common/main/Router"], function ($, _, Handlebars, Router) {

    var OpenerLoginView = function OpenerLoginView() {},
        obj;

    obj = new OpenerLoginView();

    obj.render = function (args) {
        var params = Router.convertCurrentUrlToJSON().params,
            moduleName,
            type = args[0];

        if (type.includes("bind/")) {
            type = "bind";
        }

        switch (type) {
            case "loginDialog":
                moduleName = "org/forgerock/openidm/ui/common/login/ProviderLoginDialog";
                break;
            case "bind":
                moduleName = "org/forgerock/openidm/ui/user/profile/SocialIdentitiesTab";
                break;
            default:
                moduleName = null;
                window.location = "#noOpenerFound";
                break;
        }

        if (!_.isNull(moduleName)) {
            opener.require([moduleName], function (module) {
                module.oauthReturn(params);

                window.close();
            });
        }

        return;
    };

    return obj;
});
