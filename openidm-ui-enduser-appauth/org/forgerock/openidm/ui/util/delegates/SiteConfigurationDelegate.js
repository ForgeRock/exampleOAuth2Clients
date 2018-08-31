"use strict";

/*
 * Copyright 2011-2018 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "org/forgerock/openidm/ui/util/delegates/AMDelegate", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/openidm/ui/common/delegates/ConfigDelegate", "org/forgerock/openidm/ui/util/delegates/ConsentDelegate", "org/forgerock/commons/ui/common/components/Navigation", "org/forgerock/openidm/ui/common/delegates/SiteConfigurationDelegate", "UserProfileView", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/EventManager"], function ($, _, AMDelegate, Configuration, ConfigDelegate, ConsentDelegate, Navigation, SiteConfigurationDelegate, UserProfileView, Constants, EventManager) {

    var obj = Object.create(SiteConfigurationDelegate),
        amDataEndpoints,
        cachedUserComponent = null;

    obj.adminCheck = false;

    obj.getConfiguration = function (successCallback, errorCallback) {
        return SiteConfigurationDelegate.getConfiguration().then(function (configuration) {
            if (configuration.amDataEndpoints) {
                amDataEndpoints = configuration.amDataEndpoints;
            }
            return obj.checkForDifferences().then(function () {
                if (successCallback) {
                    successCallback(configuration);
                }
                return configuration;
            });
        }, errorCallback);
    };

    obj.getProfileTabs = function () {
        var _this = this;

        var promise = $.Deferred();
        /*
            If a user reloads the page while in progressive profile mode we are still in
            the weird not quite authorized state. We need to check for that and make sure
            the user is taken back to the ProgressiveProfileView.
        */
        if (_.has(Configuration.loggedUser, "authorization.requiredProfileProcesses")) {
            EventManager.sendEvent(Constants.EVENT_START_PROGRESSIVE_PROFILING, {
                requiredProfileProcesses: Configuration.loggedUser.authorization.requiredProfileProcesses
            });

            promise.resolve([]);
        } else {
            ConfigDelegate.readEntity("ui/profile").then(function (profile) {
                $.when(ConsentDelegate.getConsentMappings(), _this.getDataFromOpenAM()).then(function (consentMappings, openamData) {

                    if (consentMappings.length === 0) {
                        _.remove(profile.tabs, function (tab) {
                            return tab.name === "privacyAndConsent";
                        });
                    }

                    if (_.isNull(openamData.resourceSet)) {
                        _.remove(profile.tabs, function (tab) {
                            return tab.name === "sharing";
                        });
                    } else {
                        //add the resources set list to the current user
                        Configuration.loggedUser.attributes.resourceSet = openamData.resourceSet;
                    }

                    if (_.isNull(openamData.auditHistory)) {
                        _.remove(profile.tabs, function (tab) {
                            return tab.name === "auditHistory";
                        });
                    } else {
                        //add the activity list to the current user
                        Configuration.loggedUser.attributes.auditHistory = openamData.auditHistory;
                    }

                    if (!openamData.trustedDevices.length) {
                        _.remove(profile.tabs, function (tab) {
                            return tab.name === "trustedDevice";
                        });
                    } else {
                        //add the trustedDevices list to the current user
                        Configuration.loggedUser.attributes.trustedDevices = openamData.trustedDevices;
                    }

                    if (!openamData.oauthApplications.length) {
                        _.remove(profile.tabs, function (tab) {
                            return tab.name === "oauthApplication";
                        });
                    } else {
                        //add the oauthApplications list to the current user
                        Configuration.loggedUser.attributes.oauthApplications = openamData.oauthApplications;
                    }

                    promise.resolve(profile.tabs);
                });
            }, function () {
                promise.resolve([{
                    "name": "personalInfoTab",
                    "view": "org/forgerock/openidm/ui/user/profile/personalInfo/PersonalInfoTab"
                }, {
                    "name": "signInAndSecurity",
                    "view": "org/forgerock/openidm/ui/user/profile/signInAndSecurity/SignInAndSecurityTab"
                }, {
                    "name": "preference",
                    "view": "org/forgerock/openidm/ui/user/profile/PreferencesTab"
                }, {
                    "name": "privacyAndConsent",
                    "view": "org/forgerock/openidm/ui/user/profile/PrivacyAndConsent"
                }]);
            });
        }

        return promise;
    };

    obj.checkForDifferences = function (route) {
        var adminIndex;

        if (Configuration.loggedUser && _.contains(Configuration.loggedUser.uiroles, "ui-admin") && !obj.adminCheck) {
            Navigation.configuration.userBar.unshift({
                "id": "admin_link",
                "href": "/admin",
                "i18nKey": "openidm.admin.label"
            });
            /*
                If this is the openidm-admin user remove "My Account" links from the nav bar.
            */
            if (Configuration.loggedUser.baseEntity === "repo/internal/user/openidm-admin" && _.has(Navigation.configuration.links.user.urls, "profile")) {
                /*
                    Save the profile link setting from AppConfiguration to be used in the else if below.
                    This is needed when an admin user and a manaaged user login to the same browser without
                    refreshing the screen first.
                */
                obj.originalNavConfiguration = _.cloneDeep(Navigation.configuration);
                delete Navigation.configuration.links.user.urls.profile;
                delete Navigation.configuration.username;
            }

            obj.adminCheck = true;
        } else if (Configuration.loggedUser && !_.contains(Configuration.loggedUser.uiroles, "ui-admin")) {
            adminIndex = _.findIndex(Navigation.configuration.userBar, { 'href': '/admin' });

            if (adminIndex !== -1) {
                Navigation.configuration.userBar.splice(adminIndex, 1);

                //if originalNavConfiguration property has been set reset nav to it's original state.
                if (_.has(obj, "originalNavConfiguration")) {
                    Navigation.configuration = _.cloneDeep(obj.originalNavConfiguration);
                    delete obj.originalNavConfiguration;
                }
            }

            obj.adminCheck = false;
        }

        Navigation.reload();

        // every time the logged-in user component changes, reregister appropriate profile tabs
        if (route && route.refreshProfileTabs || Configuration.loggedUser && Configuration.loggedUser.component !== cachedUserComponent) {
            cachedUserComponent = Configuration.loggedUser.component;
            UserProfileView.resetTabs();
            // repo/internal/user records don't support "fancy" tabs like kba and social providers
            if (Configuration.loggedUser.component !== "repo/internal/user") {
                //ConfigDelegate.readEntity("ui/profile")
                return obj.getProfileTabs().then(function (tabList) {
                    var promise = $.Deferred(),
                        requireList = [];

                    if (tabList.length) {
                        _.each(tabList, function (tab) {
                            requireList.push(tab.view);
                        });

                        require(requireList, function () {
                            _.each(_.toArray(arguments), UserProfileView.registerTab, UserProfileView);
                            promise.resolve();
                        });
                    } else {
                        promise.resolve();
                    }

                    return promise;
                });
            } else {
                var promise = $.Deferred(),
                    requireList = [];

                return obj.getProfileTabs().then(function (tabList) {
                    tabList = _.filter(tabList, function (tab) {
                        return _.includes(["personalInfoTab", "signInAndSecurity"], tab.name);
                    });

                    if (tabList.length) {
                        _.each(tabList, function (tab) {
                            requireList.push(tab.view);
                        });

                        require(requireList, function () {
                            _.each(_.toArray(arguments), UserProfileView.registerTab, UserProfileView);
                            promise.resolve();
                        });
                    } else {
                        promise.resolve();
                    }

                    return promise;
                });
            }
        }

        return $.Deferred().resolve();
    };

    obj.getDataFromOpenAM = function () {
        if (amDataEndpoints) {
            AMDelegate.setDataPoints(amDataEndpoints, Configuration.loggedUser.authenticationId);

            return $.when(AMDelegate.getTrustedDevices(), AMDelegate.getOAuthApplications(), AMDelegate.getAuditHistory(), AMDelegate.getResourceSet()).then(function (trustedDevices, oauthApplications, auditHistory, resourceSet) {
                return {
                    trustedDevices: trustedDevices[0].result,
                    oauthApplications: oauthApplications[0].result,
                    resourceSet: resourceSet ? resourceSet.result : null,
                    auditHistory: auditHistory ? auditHistory.result : null
                };
            });
        } else {
            return $.Deferred().resolve({
                trustedDevices: [],
                oauthApplications: [],
                resourceSet: null,
                auditHistory: null
            });
        }
    };

    return obj;
});
