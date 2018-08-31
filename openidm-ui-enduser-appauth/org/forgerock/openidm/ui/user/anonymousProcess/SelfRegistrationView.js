"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "form2js", "handlebars", "org/forgerock/openidm/ui/common/util/BootstrapDialogUtils", "org/forgerock/commons/ui/user/anonymousProcess/AnonymousProcessView", "org/forgerock/openidm/ui/common/delegates/SocialDelegate", "org/forgerock/commons/ui/common/util/OAuth", "org/forgerock/commons/ui/common/main/Router", "org/forgerock/commons/ui/user/anonymousProcess/SelfRegistrationView", "org/forgerock/commons/ui/common/main/ValidatorsManager", "org/forgerock/commons/ui/common/util/UIUtils", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/openidm/ui/common/util/Constants", "org/forgerock/openidm/ui/common/util/oAuthUtils", "org/forgerock/commons/ui/user/anonymousProcess/KBAView"], function ($, _, form2js, Handlebars, BootstrapDialogUtils, AnonymousProcessView, SocialDelegate, OAuth, Router, CommonSelfRegistrationView, ValidatorsManager, UIUtils, Configuration, EventManager, Constants, oAuthUtils, KBAView) {

    var SelfRegistrationView = AnonymousProcessView.extend({
        baseEntity: "selfservice/registration",
        partials: ["partials/process/_coreProfileDetails.html", "partials/process/_privacyAndConsentDialog.html", "partials/profile/_multiValueFormFields.html", "partials/profile/_emailEntry.html", "partials/profile/_preferences.html", "partials/providers/_providerButton.html"],
        events: _.extend({
            "click [data-oauth=button]": "oauthHandler",
            "focus .float-label input": "addFloatLabelStyles",
            "blur .float-label": "removeFloatLabelStyles",
            "click #termsAndServiceDisplay": "openTermsAndService",
            "change #recaptchaResponse": "recaptchaSet"
        }, CommonSelfRegistrationView.events),
        model: {
            recaptchaPassed: false,
            stagesActive: {
                "kbaSecurityAnswerDefinitionStage": false,
                "idmUserDetails": false,
                "captcha": false,
                "termsAndConditions": false,
                "consent": false
            },
            allInOneActive: false
        },
        oauthHandler: function oauthHandler(e) {
            e.preventDefault();
            var provider = $(e.target).parents("[data-oauth=button]").attr("value");

            SocialDelegate.getAuthRedirect(provider, OAuth.getRedirectURI("#" + Router.getLink(Router.configuration.routes.login, ["/", "&oauthReturn=true" + "&provider=" + provider + "&gotoURL=" + encodeURIComponent(Configuration.gotoURL || "#")]))).then(function (authRedirect) {
                window.location.href = authRedirect;
            });
        },

        /**
         Intercept the request to the backend to inject the nonce taken from session storage,
         when appropriate
         */
        submitDelegate: function submitDelegate(params, onSubmit) {
            if (params.oauthRegister) {
                params = _.extend({
                    clientToken: localStorage.getItem("dataStoreToken")
                }, params);
            }

            CommonSelfRegistrationView.submitDelegate.call(this, params, onSubmit);
        },

        getFormContent: function getFormContent() {
            var form = $(this.element).find("form")[0],
                tempForm;

            if (form.hasAttribute("data-kba-questions")) {
                return { "kba": KBAView.getQuestions() };
            } else if (this.model.allInOneActive && this.model.stagesActive.kbaSecurityAnswerDefinitionStage) {
                tempForm = form2js(form);

                _.forEach(tempForm, function (value, key) {
                    if (_.startsWith(key, "answer_") || _.startsWith(key, "question_")) {
                        delete tempForm[key];
                    }
                });

                tempForm.kba = KBAView.getQuestions();

                return tempForm;
            } else {
                return form2js(form);
            }
        },

        addFloatLabelStyles: function addFloatLabelStyles(e) {
            if (!$(e.target).attr("readonly")) {
                $(e.target).removeClass("input-lg");
                $(e.target).prev().removeClass("sr-only");
                $(e.target).parent().addClass("float-label-with-focus");
            }
        },

        removeFloatLabelStyles: function removeFloatLabelStyles(e) {
            if (!$(e.target).val()) {
                $(e.target).addClass("input-lg");
                $(e.target).prev().addClass("sr-only");
                $(e.target).parent().removeClass("float-label-with-focus");
            }
        },

        openTermsAndService: function openTermsAndService(e) {
            e.preventDefault();

            BootstrapDialogUtils.createModal({
                title: $.t("common.user.termsAndConditions.title"),
                closeByBackdrop: false,
                message: this.model.termsOfService,
                buttons: ["close"]
            }).open();
        },

        recaptchaSet: function recaptchaSet(e) {
            e.preventDefault();

            this.model.recaptchaPassed = true;

            ValidatorsManager.validateAllFields(this.$el);
        },

        validationSuccessful: function validationSuccessful(event) {
            AnonymousProcessView.prototype.validationSuccessful(event);

            if (this.model.stagesActive.captcha) {
                if (!this.model.recaptchaPassed) {
                    this.$el.find(".recaptcha-wrapper").attr("data-validation-status", "error");
                } else {
                    this.$el.find(".recaptcha-wrapper").attr("data-validation-status", "true");
                }
            }
        },

        attemptCustomTemplate: function attemptCustomTemplate(stateData, baseTemplateUrl, response, processStatePromise) {
            var _this = this;

            var templateUrl = baseTemplateUrl + this.processType + "/" + response.type + "-" + response.tag + ".html";

            //Takes an object and a key and returns the value
            Handlebars.registerHelper("findDynamicValue", function (map, key) {
                var value = "";

                if (!_.isUndefined(map) && !_.isUndefined(key)) {
                    value = map[key];

                    if (_.isUndefined(value)) {
                        value = "";
                    }
                }

                return value;
            });

            //Takes an object and a key and finds if that key exists in the object
            Handlebars.registerHelper("dynamicValueExist", function (map, key, options) {
                var value = false;

                if (!_.isUndefined(map) && !_.isUndefined(key)) {
                    value = !_.isUndefined(map[key]);
                }

                if (value) {
                    return options.fn(this);
                } else {
                    return options.inverse(this);
                }
            });

            //Takes an object and a key and finds if that key doesn't exist in the object
            Handlebars.registerHelper("dynamicValueNotExist", function (map, key, options) {
                var value = true;

                if (!_.isUndefined(map) && !_.isUndefined(key)) {
                    value = _.isUndefined(map[key]);
                }

                if (value) {
                    return options.fn(this);
                } else {
                    return options.inverse(this);
                }
            });

            if (_.has(stateData, "requirements.definitions.providers.items.oneOf")) {
                _.each(stateData.requirements.definitions.providers.items.oneOf, function (provider) {
                    provider.action = $.t("templates.socialIdentities.register");
                    provider.name = provider.provider;
                });
            }

            if (stateData.additions) {
                if (stateData.additions.successUrl) {
                    // to be used following a successful login attempt
                    Configuration.globalData.auth.validatedGoto = encodeURIComponent(stateData.additions.successUrl);
                }

                if (stateData.additions.credentialJwt) {
                    EventManager.sendEvent(Constants.EVENT_LOGIN_REQUEST, {
                        jwt: stateData.additions.credentialJwt
                    });
                } else if (stateData.additions.oauthLogin) {
                    EventManager.sendEvent(Constants.EVENT_LOGIN_REQUEST, {
                        oauthLogin: true,
                        attemptRegister: false,
                        suppressMessage: false,
                        failureCallback: function failureCallback() {
                            EventManager.sendEvent(Constants.EVENT_CHANGE_VIEW, {
                                route: Router.configuration.routes.login,
                                args: ["&preventAutoLogin=true"]
                            });
                        }
                    });
                } else if (stateData.additions.successUrl && stateData.additions.successUrl.length) {
                    // used when there is no local login option specified
                    window.location.href = stateData.additions.successUrl;
                } else {
                    // perform the default behavior in absence of the other conditions
                    CommonSelfRegistrationView.attemptCustomTemplate.call(this, stateData, baseTemplateUrl, response, processStatePromise);
                }
            } else {
                if (stateData.requirements) {
                    stateData.hideProviderText = _.get(stateData.requirements, "definitions.providers.items.oneOf.length") > 3;
                    _.each(stateData.requirements.stages, function (stage) {
                        _this.model.stagesActive[stage] = true;
                    });
                } else {
                    stateData.hideProviderText = false;
                }

                stateData.activeStages = this.model.stagesActive;
                this.model.stateData = stateData;
                UIUtils.compileTemplate(templateUrl, stateData).then(function (renderedTemplate) {
                    if (response.type === "allInOneRegistration") {
                        _this.model.allInOneActive = true;

                        if (_this.model.stagesActive.termsAndConditions) {
                            _this.model.termsOfService = stateData.requirements.terms;
                        }

                        if (_this.model.stagesActive.consent) {
                            _this.model.consent = stateData.requirements.consent;
                        }
                    }
                    processStatePromise.resolve(renderedTemplate);
                }, _.bind(function () {
                    this.loadGenericTemplate(stateData, baseTemplateUrl, response, processStatePromise);
                }, this));
            }
        },
        renderProcessState: function renderProcessState(response) {
            var _this2 = this;

            // handle stage errors by sending a failed status object to
            // AnonymousProcessView#renderProcessState
            if (_.has(response.requirements, "errors") && _.size(response.requirements["errors"]) !== 0) {
                response = {
                    status: {
                        reason: response.requirements.errors,
                        success: false
                    }
                };
            }

            if (_.has(response, "requirements.error") && response.requirements.error.message === "Failed policy validation") {
                EventManager.sendEvent(Constants.EVENT_POLICY_FAILURE, {
                    error: {
                        responseObj: response.requirements.error
                    }
                });
            }
            return AnonymousProcessView.prototype.renderProcessState.call(this, response).then(function () {
                if (response.type === "kbaSecurityAnswerDefinitionStage" && response.tag === "initial" || response.type === "allInOneRegistration" && _this2.model.stagesActive.kbaSecurityAnswerDefinitionStage && response.requirements.properties.kba) {
                    KBAView.render(response.requirements.properties.kba);
                }

                oAuthUtils.initSocialCarousel($(".fr-login-social-providers"), _.get(_this2.model, "stateData.requirements.definitions.providers.items.oneOf.length") || 0);
            });
        },
        formSubmit: function formSubmit(event) {
            var _this3 = this;

            var formContent = this.getFormContent(),
                privacyAndConsentTemplate;

            event.preventDefault();

            if (!this.model.stagesActive.consent) {
                this.delegate.submit(formContent).then(_.bind(this.renderProcessState, this), _.bind(this.renderProcessState, this));
            } else {
                privacyAndConsentTemplate = $(Handlebars.compile("{{> process/_privacyAndConsentDialog}}")({ "consent": this.model.consent }));

                BootstrapDialogUtils.createModal({
                    title: $.t("common.user.consent.notice"),
                    message: privacyAndConsentTemplate,
                    onshow: function onshow(dialogRef) {
                        var consentButton = dialogRef.$modalFooter.find(".btn-primary"),
                            checkbox = dialogRef.$modalContent.find("#privacyAndConsentAccept");

                        consentButton.prop('disabled', true);

                        checkbox.on("change", function () {
                            consentButton.prop('disabled', !checkbox.is(":checked"));
                        });
                    },
                    buttons: ["cancel", {
                        label: $.t("common.user.consent.giveConsent"),
                        cssClass: "btn-primary",
                        action: function action(dialog) {
                            _this3.delegate.submit(formContent).then(_.bind(_this3.renderProcessState, _this3), _.bind(_this3.renderProcessState, _this3));

                            dialog.close();
                        }
                    }]
                }).open();
            }
        }
    });

    SelfRegistrationView.prototype = _.extend(Object.create(CommonSelfRegistrationView), SelfRegistrationView.prototype);

    return new SelfRegistrationView();
});
