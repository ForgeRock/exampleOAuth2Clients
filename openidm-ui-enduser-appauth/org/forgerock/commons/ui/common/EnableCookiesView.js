"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/commons/ui/common/util/CookieHelper"], function (AbstractView, cookieHelper) {
    var EnableCookiesView = AbstractView.extend({
        template: "templates/common/EnableCookiesTemplate.html",
        baseTemplate: "templates/common/LoginBaseTemplate.html",
        render: function render() {
            if (!cookieHelper.cookiesEnabled()) {
                this.parentRender();
            } else {
                location.href = "#login/";
            }
        }
    });

    return new EnableCookiesView();
});
