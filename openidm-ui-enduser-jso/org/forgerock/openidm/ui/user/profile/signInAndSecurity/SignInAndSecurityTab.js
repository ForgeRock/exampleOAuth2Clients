"use strict";

/*
 * Copyright 2017-2018 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "bootstrap", "moment", "org/forgerock/commons/ui/user/profile/AbstractUserProfileTab", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/openidm/ui/common/delegates/ResourceDelegate", "org/forgerock/commons/ui/common/main/ServiceInvoker", "org/forgerock/openidm/ui/common/delegates/SiteConfigurationDelegate", "org/forgerock/openidm/ui/common/delegates/SocialDelegate"], function ($, _, bootstrap, moment, AbstractUserProfileTab, Configuration, ResourceDelegate, ServiceInvoker, SiteConfigurationDelegate, SocialDelegate) {
    var SignInAndSecurityView = AbstractUserProfileTab.extend({
        template: "templates/profile/signInAndSecurity/SignInAndSecurityTab.html",
        model: {},
        events: _.extend({
            "click .checkbox input": "formSubmit"
        }, AbstractUserProfileTab.prototype.events),
        data: {
            showSocial: false,
            showKBA: false,
            socialProviders: [],
            providersActive: true
        },
        partials: ["partials/providers/_providerBadge.html"],
        /**
         Expected by all dynamic user profile tabs - returns a map of details necessary to render the nav tab
         */
        getTabDetail: function getTabDetail() {
            return {
                "panelId": "signInAndSecurityTab",
                "label": $.t("common.user.profileMenu.signIn")
            };
        },

        render: function render(args, callback) {
            var _this = this;

            this.data.user = Configuration.loggedUser.toJSON();
            this.data.socialProviders = [];

            if (args.user._meta != null && args.user._meta.lastChanged && args.user._meta.lastChanged.date) {
                this.data.lastChanged = moment.utc(args.user._meta.lastChanged.date).format("LLL");
            } else {
                this.data.lastChanged = null;
            }

            $.when(SocialDelegate.providerList(), SiteConfigurationDelegate.getConfiguration(), this.getUserIdps()).then(function (socialProviders, configuration, user) {
                var userIdps = user ? user.idps : [];

                _.each(socialProviders.providers, function (provider) {
                    if (userIdps && _.find(userIdps, function (idp) {
                        return idp._ref.indexOf("managed/" + provider.provider) === 0;
                    })) {
                        _this.data.socialProviders.push(provider);
                    }
                });

                if (socialProviders.providers.length > 0) {
                    _this.data.showSocial = true;
                } else {
                    _this.data.showSocial = false;
                }

                _this.data.showKBA = configuration.kbaEnabled;

                //One final check for openidm-admin
                if (Configuration.loggedUser.component === "repo/internal/user") {
                    _this.data.showKBA = false;
                    _this.data.showSocial = false;
                }

                _this.parentRender(function () {
                    if (callback) {
                        callback();
                    }
                });
            });
        },
        getUserIdps: function getUserIdps() {
            var promise = $.Deferred();

            ServiceInvoker.restCall({
                url: ResourceDelegate.getServiceUrl(["managed", "user"]) + "/" + this.data.user._id + "?_fields=idps",
                errorsHandlers: {
                    "noUserIdpsFound": { status: 404 }
                }
            }).always(function (result) {
                promise.resolve(result);
            });

            return promise;
        }
    });

    return new SignInAndSecurityView();
});
