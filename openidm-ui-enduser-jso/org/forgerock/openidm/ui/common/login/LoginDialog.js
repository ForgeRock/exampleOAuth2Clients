"use strict";

/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/commons/ui/common/LoginDialog", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/openidm/ui/common/login/ProviderLoginDialog", "org/forgerock/openidm/ui/common/delegates/SocialDelegate"], function ($, _, AbstractView, CommonsLoginDialog, Configuration, ProviderLoginDialog, SocialDelegate) {

    var LoginDialog = AbstractView.extend({
        render: function render(options) {
            SocialDelegate.loginProviders().then(function (configuredProviders) {
                var userNameFlag = Configuration.loggedUser.userNamePasswordLogin;

                if (userNameFlag || configuredProviders.providers.length === 0) {
                    CommonsLoginDialog.render(options);
                } else {
                    ProviderLoginDialog.render(options, Configuration.loggedUser, configuredProviders);
                }
            });
        }
    });
    return new LoginDialog();
});
