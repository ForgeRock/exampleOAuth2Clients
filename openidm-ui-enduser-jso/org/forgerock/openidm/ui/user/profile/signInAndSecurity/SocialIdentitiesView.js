"use strict";

/*
 * Copyright 2015-2018 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["bootstrap", "jquery", "lodash", "org/forgerock/openidm/ui/common/util/BootstrapDialogUtils", "org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/util/OAuth", "org/forgerock/commons/ui/common/main/Router", "org/forgerock/openidm/ui/common/delegates/SocialDelegate", "org/forgerock/commons/ui/common/util/UIUtils", "org/forgerock/commons/ui/common/main/ServiceInvoker", "org/forgerock/openidm/ui/common/delegates/ResourceDelegate"], function (bootstrap, $, _, BootstrapDialogUtils, AbstractView, Configuration, Constants, EventManager, OAuth, Router, SocialDelegate, UIUtils, ServiceInvoker, ResourceDelegate) {
    var SocialIdentitiesView = AbstractView.extend({
        template: "templates/profile/signInAndSecurity/SocialIdentitiesTemplate.html",
        events: {
            "click .social-toggle": "toggleAction",
            "click .closeErrorMsg": "closeErrorMsg"
        },
        partials: ["partials/providers/_providerCircle.html"],

        /**
         Expected by all dynamic user profile tabs - returns a map of details necessary to render the nav tab
         */
        getTabDetail: function getTabDetail() {
            return {
                "panelId": "socialIdentities",
                "label": $.t("templates.socialIdentities.socialIdentities")
            };
        },

        model: {},

        render: function render(args, callback) {
            var _this = this;

            var params = Router.convertCurrentUrlToJSON().params;

            this.data.user = Configuration.loggedUser.toJSON();
            $.when(SocialDelegate.providerList(), ServiceInvoker.restCall({ url: ResourceDelegate.getServiceUrl(["managed", "user"]) + "/" + this.data.user._id + "?_fields=idps" })).then(function (response, user) {
                var userIdps = user[0].idps;

                _this.data.providers = response.providers;

                _.each(_this.data.providers, function (provider, index) {
                    _this.activateProviders(provider, index, userIdps);

                    provider.displayName = _.capitalize(provider.provider);
                });

                _this.parentRender(function () {
                    _this.$el.find("#idpUnbindError").hide();

                    if (!_.isEmpty(params) && _.has(params, "oauthReturn") && _.has(params, "provider")) {
                        _this.oauthReturn(params);
                    }

                    if (callback) {
                        callback();
                    }
                });
            });
        },

        activateProviders: function activateProviders(provider, index, userIdps) {
            if (userIdps && _.find(userIdps, function (idp) {
                return idp._ref.indexOf("managed/" + provider.provider) === 0;
            })) {
                this.data.providers[index].active = true;
            }
        },

        getProviderName: function getProviderName(panel) {
            return $(panel).data("name");
        },
        getProviderObj: function getProviderObj(providerName) {
            return _.filter(this.data.providers, function (obj) {
                return obj.provider === providerName;
            })[0];
        },


        toggleAction: function toggleAction(event) {
            var _this2 = this;

            event.preventDefault();

            var panel = $(event.target).parents(".panel-collapse");

            if (!panel.find("[type=checkbox]").prop("checked")) {
                this.getOptions(panel).then(function (options) {
                    _this2.oauthRedirect(options);
                });
            } else {
                this.disconnectDialog(panel);
            }
        },

        oauthReturn: function oauthReturn(params) {
            var _this3 = this;

            var panel = this.$el.find(".panel-collapse[data-name=\"" + params.provider + "\"]"),
                id = panel.attr("id");

            panel.collapse("show");

            Configuration.loggedUser.bindProvider(params.provider).then(function () {
                panel.find("[type=checkbox]").prop("checked", true);

                _this3.$el.find(".fr-hover-panel[data-target=\"#" + id + "\"]").find(".col-sm-4").toggleClass("disabled", false);
                _this3.$el.find(".fr-hover-panel[data-target=\"#" + id + "\"]").find(".fr-profile-additional-details").text($.t("templates.socialIdentities.accessingInfo"));

                EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, "saveSocialProvider");
            });
        },

        getOptions: function getOptions(panel) {
            var options = {};

            options.windowName = this.getProviderName(panel);
            return this.getUrl(options.windowName).then(function (path) {
                options.path = path;
                return options;
            });
        },

        oauthRedirect: function oauthRedirect(options) {
            window.open(options.path, "_self");
        },

        disconnectDialog: function disconnectDialog(panel) {

            BootstrapDialogUtils.createModal({
                title: $.t("templates.socialIdentities.confirmTitle") + _.capitalize(this.getProviderName(panel)) + "?",
                message: $.t("templates.socialIdentities.confirmMessage") + _.capitalize(this.getProviderName(panel)) + ".",
                buttons: [{
                    label: $.t("common.form.cancel"),
                    id: "disconnectCancel",
                    action: function action(dialogRef) {
                        dialogRef.close();

                        $(panel).prop('checked', true);
                    }
                }, {
                    label: $.t('common.form.confirm'),
                    id: "disconnectConfirm",
                    cssClass: "btn-danger",
                    action: _.bind(function (dialogRef) {
                        dialogRef.close();

                        this.unbindProvider(panel);
                    }, this)
                }]
            }).open();
        },

        unbindProvider: function unbindProvider(panel) {
            var _this4 = this;

            var providerName = this.getProviderName(panel),
                id = panel.attr("id");

            Configuration.loggedUser.unbindProvider(providerName).then(function () {
                panel.find("[type=checkbox]").prop("checked", false);

                _this4.$el.find(".fr-hover-panel[data-target=\"#" + id + "\"]").find(".col-sm-4").toggleClass("disabled", true);
                _this4.$el.find(".fr-hover-panel[data-target=\"#" + id + "\"]").find(".fr-profile-additional-details").text($.t("templates.socialIdentities.notLinked"));

                EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, "removeSocialProvider");
            }, function (err) {
                _this4.data.unbindText = $.t(err.responseJSON.message, { provider: _.startCase(providerName) });
                UIUtils.renderTemplate(_this4.template, _this4.$el, _this4.data, $.noop(), "replace");
                _this4.$el.find("#idpUnbindError").show();
                delete _this4.data.unbindText;
            });
        },

        getUrl: function getUrl(provider) {
            return SocialDelegate.getAuthRedirect(provider, OAuth.getRedirectURI("#" + Router.getLink(Router.currentRoute, ["&provider=" + provider + "&oauthReturn=true"])));
        },

        getCurrentRoute: function getCurrentRoute() {
            return Router.currentRoute;
        },


        closeErrorMsg: function closeErrorMsg(event) {
            if (event) {
                event.preventDefault();
            }
            this.$el.find("#idpUnbindError").hide();
        }

    });

    return new SocialIdentitiesView();
});
