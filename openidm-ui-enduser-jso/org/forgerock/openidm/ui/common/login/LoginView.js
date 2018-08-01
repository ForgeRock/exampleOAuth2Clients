"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "handlebars", "org/forgerock/openidm/ui/common/delegates/SocialDelegate", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/openidm/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/LoginView", "org/forgerock/commons/ui/common/util/OAuth", "org/forgerock/openidm/ui/common/util/oAuthUtils", "org/forgerock/commons/ui/common/main/Router"], function ($, _, Handlebars, SocialDelegate, Configuration, Constants, EventManager, commonLoginView, OAuth, oAuthUtils, Router) {

    var LoginView = function LoginView() {},
        obj;

    LoginView.prototype = commonLoginView;

    obj = new LoginView();

    _.extend(obj.events, {
        "click [data-oauth=button]": "oauthHandler"
    });

    obj.redirectToIDP = function (provider) {
        // TODO: share oauthHandler logic between registration and login
        SocialDelegate.getAuthRedirect(provider, OAuth.getRedirectURI("#" + Router.getLink(Router.currentRoute, ["/", "&oauthReturn=true" + "&provider=" + provider + "&gotoURL=" + encodeURIComponent(Configuration.gotoURL || "#")]))).then(function (authRedirect) {
            window.location.href = authRedirect;
        });
    };

    obj.oauthHandler = function (e) {
        e.preventDefault();
        this.redirectToIDP($(e.target).parents("[data-oauth=button]").attr("value"));
    };
    // TODO: share providerPartialFromType between registration and login
    Handlebars.registerHelper("providerPartialFromType", function (type) {
        return "providers/_" + type;
    });

    obj.render = function (args, callback) {

        var params = Router.convertCurrentUrlToJSON().params;

        if (!_.isEmpty(params) && _.has(params, "oauthReturn")) {

            if (_.has(params, "gotoURL")) {
                Configuration.gotoURL = params.gotoURL;
            }
            EventManager.sendEvent(Constants.EVENT_LOGIN_REQUEST, {
                oauthLogin: true,
                attemptRegister: true,
                provider: _.get(params, "provider"),
                failureCallback: function failureCallback(reason) {
                    EventManager.sendEvent(Constants.EVENT_CHANGE_VIEW, {
                        route: Router.configuration.routes.login,
                        args: ["&preventAutoLogin=true"]
                    });
                }
            });
        } else {

            SocialDelegate.loginProviders().then(_.bind(function (response) {
                _.each(response.providers, function (provider) {
                    provider.name = provider.provider;
                    provider.action = $.t("templates.socialIdentities.signIn");
                });

                this.data.providers = response.providers;
                this.data.hideProviderText = this.data.providers.length > 3;

                if (this.data.providers.length === 1 && !_.has(params, "preventAutoLogin") && this.data.providers[0].name === "OPENAM") {
                    this.redirectToIDP(this.data.providers[0].name);
                } else {
                    commonLoginView.render.call(this, args, _.bind(function () {

                        oAuthUtils.initSocialCarousel($(".fr-login-social-providers"), this.data.providers.length);

                        if (callback) {
                            callback();
                        }
                    }, this));
                }
            }, this));
        }
    };

    return obj;
});
