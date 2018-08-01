"use strict";

/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/util/URIUtils"], function (AbstractView, Configuration, URIUtils) {
    var UnauthorizedView = AbstractView.extend({
        template: "templates/common/UnauthorizedTemplate.html",
        baseTemplate: "templates/common/LoginBaseTemplate.html",
        events: {
            "click #goBack": function clickGoBack() {
                window.history.go(-1);
            },
            "click #logout": function clickLogout() {
                Configuration.gotoFragment = "#" + URIUtils.getCurrentFragment();
            }
        }
    });

    return new UnauthorizedView();
});
