"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["org/forgerock/commons/ui/common/main/AbstractView"], function (AbstractView) {
    var NotFoundView = AbstractView.extend({
        template: "templates/common/404.html",
        baseTemplate: "templates/common/LoginBaseTemplate.html"
    });

    return new NotFoundView();
});
