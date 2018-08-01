"use strict";

/*
 * Copyright 2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "org/forgerock/commons/ui/user/anonymousProcess/AnonymousProcessView", "org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/openidm/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/main/Router", "org/forgerock/openidm/ui/common/UserModel", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/openidm/ui/common/delegates/SocialDelegate", "org/forgerock/commons/ui/common/util/OAuth", "org/forgerock/openidm/ui/common/util/oAuthUtils"], function ($, _, AnonymousProcessView, AbstractView, Constants, EventManager, Router, UserModel, Configuration, SocialDelegate, OAuth, oAuthUtils) {

    var SocialUserClaimView = AnonymousProcessView.extend({
        processType: "socialUserClaim",
        i18nBase: "common.user.socialUserClaim",
        events: _.extend({
            "click .continueSocialUserClaim": "oauthHandler",
            "click #submitCredentials": "submitPassword",
            "keyup input": "inputHandler"
        }, AnonymousProcessView.prototype.events),
        partials: ["partials/providers/_providerButton.html"],
        model: {},
        render: function render(args) {
            var stage = args[0],
                originalProcessResponse = args[1];

            if (originalProcessResponse && stage && stage === "initialize") {
                this.model.originalProcessResponse = JSON.parse(originalProcessResponse);
            }

            if (stage && stage === "nextStage") {
                var socialUserClaim = JSON.parse(localStorage.getItem("socialUserClaim"));

                this.model.originalProcessResponse = socialUserClaim.originalProcessResponse;
                this.setDelegate(Constants.SELF_SERVICE_CONTEXT + this.processType, this.model.originalProcessResponse.token);
                this.continueSocialUserClaim({ "clientToken": socialUserClaim.dataStoreToken });
                //remove these settings from localStorage
                localStorage.removeItem("socialUserClaim");
            } else if (_.has(this.model, "originalProcessResponse")) {
                this.setDelegate(Constants.SELF_SERVICE_CONTEXT + this.processType, this.model.originalProcessResponse.token);
                this.parentRender();
            } else {
                //some how we have hit the route associated with this view from somewhere other than the registration process
                this.returnToLoginPage();
            }
        },

        parentRender: function parentRender() {
            this.setTranslationBase();
            AbstractView.prototype.parentRender.call(this, _.bind(function () {
                this.renderProcessState(this.model.originalProcessResponse);
            }, this));
        },
        renderProcessState: function renderProcessState(response) {
            var _this = this;

            if (response.tag === "end") {
                if (response.additions && response.additions.successUrl) {
                    // to be used following a successful login attempt
                    Configuration.globalData.auth.validatedGoto = encodeURIComponent(response.additions.successUrl);
                }
                EventManager.sendEvent(Constants.EVENT_LOGIN_REQUEST, {
                    oauthLogin: true,
                    attemptRegister: false,
                    suppressMessage: false,
                    failureCallback: function failureCallback() {
                        EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, "socialAuthenticationFailed");

                        if (event.errorCallback) {
                            event.errorCallback();
                        } else {
                            _this.returnToLoginPage();
                        }
                    }
                });
            } else if (_.has(response, "requirements.error.code") && response.requirements.error.code === 401) {
                EventManager.sendEvent(Constants.EVENT_UNAUTHORIZED);
            } else {
                var providersLength = response.requirements.definitions ? response.requirements.definitions.providers.items.oneOf.length : 0;

                response.requirements.hideProviderText = providersLength > 3;

                return AnonymousProcessView.prototype.renderProcessState.call(this, response).then(function () {
                    oAuthUtils.initSocialCarousel($(".fr-login-social-providers"), providersLength);
                });
            }
        },
        oauthHandler: function oauthHandler(e) {
            var provider = $(e.target).closest(".continueSocialUserClaim").attr("provider");

            e.preventDefault();

            //set the socialUserClaim details in localStorage
            localStorage.setItem("socialUserClaim", JSON.stringify({
                originalProcessResponse: this.model.originalProcessResponse,
                dataStoreToken: localStorage.getItem("dataStoreToken")
            }));

            SocialDelegate.getAuthRedirect(provider, OAuth.getRedirectURI("#" + Router.getLink(Router.configuration.routes.continueSocialUserClaim, ["nextStage"]))).then(function (authRedirect) {
                window.location.href = authRedirect;
            });
        },
        submitPassword: function submitPassword(e) {
            if (e) {
                e.preventDefault();
            }

            this.continueSocialUserClaim({
                "password": this.$el.find("#input-password").val(),
                "clientToken": localStorage.getItem("dataStoreToken")
            });
        },
        continueSocialUserClaim: function continueSocialUserClaim(requirements) {
            this.delegate.submit(requirements).then(_.bind(this.renderProcessState, this), _.bind(this.renderProcessState, this));
        },
        returnToLoginPage: function returnToLoginPage() {
            EventManager.sendEvent(Constants.EVENT_CHANGE_VIEW, {
                route: Router.configuration.routes.login,
                args: ["&preventAutoLogin=true"]
            });
        },
        inputHandler: function inputHandler(event) {
            event.preventDefault();

            // ENTER key ...basically clicking the "Link Accounts" button when hitting enter when the password field is available
            if (event.keyCode === 13 && this.$el.find("#input-password").length === 1) {
                this.submitPassword();
            }
        }
    });

    return new SocialUserClaimView();
});
