"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["org/forgerock/commons/ui/user/anonymousProcess/AnonymousProcessView"], function (AnonymousProcessView) {

    var PasswordResetView = AnonymousProcessView.extend({
        processType: "reset",
        i18nBase: "common.user.passwordReset"
    });

    return new PasswordResetView();
});
