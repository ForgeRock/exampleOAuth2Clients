"use strict";

/*
 * Copyright 2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "form2js", "moment", "org/forgerock/commons/ui/user/profile/AbstractUserProfileTab", "org/forgerock/openidm/ui/util/delegates/ConsentDelegate", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/EventManager"], function ($, _, form2js, moment, AbstractUserProfileTab, ConsentDelegate, Configuration, Constants, EventManager) {
    var PreferencesView = AbstractUserProfileTab.extend({
        template: "templates/profile/PrivacyAndConsentTab.html",
        events: _.extend({
            "change .access-toggle": "saveConsent"
        }, AbstractUserProfileTab.prototype.events),
        model: {},

        getTabDetail: function getTabDetail() {
            return {
                "panelId": "privacyAndConsentTab",
                "label": $.t("common.user.profileMenu.privacyAndConsent")
            };
        },

        render: function render(args, callback) {
            var _this = this;

            ConsentDelegate.getConsentMappings().then(function (consentMappings) {
                _this.data.consentMappings = consentMappings;
                _this.data.consentMappings.map(function (consentMapping) {
                    consentMapping.fields = consentMapping.fields.filter(function (field) {
                        return !_.isEmpty(field.attribute);
                    });
                    return consentMapping;
                });

                _.each(Configuration.loggedUser.attributes.consentedMappings, function (consentedDetails) {
                    var tempConsentMappings = _.find(_this.data.consentMappings, function (tempConsent) {
                        return consentedDetails.mapping === tempConsent.name;
                    });

                    if (tempConsentMappings) {
                        tempConsentMappings.active = true;
                        //Change to consentDate
                        tempConsentMappings.activatedDate = moment(consentedDetails.consentDate).format("MMMM DD, YYYY");
                    }
                });

                if (Configuration.loggedUser.attributes.consentedMappings) {
                    _this.model.consentMappings = _.cloneDeep(Configuration.loggedUser.attributes.consentedMappings);
                } else {
                    _this.model.consentMappings = [];
                }

                _this.parentRender(function () {
                    if (callback) {
                        callback();
                    }
                });
            });
        },

        saveConsent: function saveConsent(event) {
            event.preventDefault();

            var currentPanel = $(event.target).parents(".panel-collapse"),
                currentName = $(currentPanel).attr("data-name"),
                headerPanel = this.$el.find(".fr-hover-panel[data-name=" + currentName + "]"),
                date = moment().toISOString(),
                displayDate = moment(date).format("MMMM DD, YYYY"),
                index = _.findIndex(this.model.consentMappings, function (consent) {
                return consent.mapping === currentName;
            });

            if (index === -1) {
                this.model.consentMappings.push({
                    "mapping": currentName,
                    "consentDate": date
                });

                headerPanel.find(".fr-profile-additional-details").text($.t("templates.consent.onSince") + " " + displayDate);
                currentPanel.find(".fr-toggle-date").text($.t("templates.consent.since") + " " + displayDate);
                currentPanel.find(".fr-toggle-date").show();
            } else {
                this.model.consentMappings.splice(index, 1);
                headerPanel.find(".fr-profile-additional-details").text($.t("templates.consent.off"));
                currentPanel.find(".fr-toggle-date").hide();
            }

            Configuration.loggedUser.save({ "consentedMappings": this.model.consentMappings }, { patch: true }).then(function () {
                EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, "saveConsentMapping");
            });
        }
    });

    return new PreferencesView();
});
