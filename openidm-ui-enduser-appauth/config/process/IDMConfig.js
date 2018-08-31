"use strict";

/*
 * Copyright 2011-2018 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["underscore", "org/forgerock/openidm/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/EventManager"], function (_, Constants, EventManager) {
    var obj = [{
        startEvent: Constants.EVENT_HANDLE_DEFAULT_ROUTE,
        description: "",
        override: true,
        dependencies: ["org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/main/Router"],
        processDescription: function processDescription(event, Configuration, Router) {
            if (Configuration.loggedUser) {
                EventManager.sendEvent(Constants.EVENT_CHANGE_VIEW, { route: Router.configuration.routes.landingPage });
            } else {
                EventManager.sendEvent(Constants.EVENT_CHANGE_VIEW, { route: Router.configuration.routes.login });
            }
        }
    }, {
        startEvent: Constants.EVENT_CHANGE_BASE_VIEW,
        description: "",
        override: true,
        dependencies: ["org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/components/Navigation", "org/forgerock/commons/ui/common/components/LoginHeader", "Footer"],
        processDescription: function processDescription(event, Configuration, Navigation, LoginHeader, Footer) {
            LoginHeader.render();

            /*
                openidm has the concept of progressive profiling which puts the loggedUser into
                a semi / not so logged in state. In this case we do not need to load Navigation
                because it tries and fails to get the user's notifications which triggers unwanted
                error messages.
            */
            if (!_.has(Configuration, "loggedUser.authorization.requiredProfileProcesses")) {
                Navigation.init();
            }

            Footer.render();
        }
    }, {
        startEvent: Constants.EVENT_OAUTH_REGISTER,
        description: "Attempt to claim or register a user from an oauth provider",
        dependencies: ["org/forgerock/commons/ui/user/delegates/AnonymousProcessDelegate", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/main/Router", "org/forgerock/commons/ui/common/util/URIUtils"],
        processDescription: function processDescription(event, AnonymousProcessDelegate, Configuration, Router, URIUtils) {
            var delegate = new AnonymousProcessDelegate("selfservice/socialUserClaim"),
                params = {
                clientToken: localStorage.getItem("dataStoreToken")
            },
                fragmentQueryString = "";

            if (event.args && event.args[0]) {
                fragmentQueryString = "&" + event.args[0];
                params = URIUtils.parseQueryString(event.args[0]);
            }
            /*
             First social provider login fail we attempt to locate an account to claim
             */
            delegate.submit(params).then(function (claimResult) {
                if (_.has(claimResult, "additions.successUrl")) {
                    Configuration.globalData.auth.validatedGoto = encodeURIComponent(claimResult.additions.successUrl);
                }

                /*
                 If successful account located
                */
                if (_.get(claimResult, "additions.claimedProfile")) {
                    if (_.get(claimResult, "additions.oauthLogin")) {
                        EventManager.sendEvent(Constants.EVENT_LOGIN_REQUEST, {
                            oauthLogin: true,
                            attemptRegister: false,
                            suppressMessage: false,
                            failureCallback: function failureCallback() {
                                EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, "socialAuthenticationFailed");

                                if (event.errorCallback) {
                                    event.errorCallback();
                                } else {
                                    EventManager.sendEvent(Constants.EVENT_CHANGE_VIEW, {
                                        route: Router.configuration.routes.login,
                                        args: ["&preventAutoLogin=true"]
                                    });
                                }
                            }
                        });
                    } else if (_.has(claimResult, "additions.successUrl")) {
                        window.location.href = _.get(claimResult, "additions.successUrl");
                    } else {
                        // unusual, but possible to claim a social account without being able to auto-login
                        EventManager.sendEvent(Constants.EVENT_CHANGE_VIEW, {
                            route: Router.configuration.routes.login,
                            args: ["&preventAutoLogin=true"]
                        });
                    }
                } else if (claimResult.tag === "verifyProfile") {
                    if (event.verifiedProfileCallback) {
                        event.verifiedProfileCallback(delegate);
                    } else {
                        EventManager.sendEvent(Constants.EVENT_CHANGE_VIEW, {
                            route: Router.configuration.routes.socialUserClaim,
                            args: ["initialize", encodeURIComponent(JSON.stringify(claimResult))]
                        });
                    }
                } else if (Configuration.globalData.selfRegistration) {
                    /*
                     If account claim fails to find an account pass through to registration
                     */
                    EventManager.sendEvent(Constants.EVENT_CHANGE_VIEW, {
                        route: Router.configuration.routes.selfRegistration,
                        args: ["/", "&oauthRegister=true" + fragmentQueryString]
                    });
                } else {
                    EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, "socialAuthenticationFailed");

                    EventManager.sendEvent(Constants.EVENT_CHANGE_VIEW, {
                        route: Router.configuration.routes.login,
                        args: ["&preventAutoLogin=true"]
                    });
                }
            }, function () {
                /*
                 Hard fail when multiple accounts or some unknown critical failure
                 */
                EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, "socialAuthenticationFailed");

                if (event.errorCallback) {
                    event.errorCallback();
                } else {
                    EventManager.sendEvent(Constants.EVENT_CHANGE_VIEW, {
                        route: Router.configuration.routes.login,
                        args: ["&preventAutoLogin=true"]
                    });
                }
            });
        }
    }, {
        startEvent: Constants.EVENT_START_PROGRESSIVE_PROFILING,
        description: "",
        dependencies: ["org/forgerock/commons/ui/common/main/Router"],
        processDescription: function processDescription(event, Router) {
            /*
                We are currently in anonymousMode and the NO_SESSION header is set to true
                which blocks the updated jwt from being persisted in the browser by the
                SET_COOKIE header from any server responses. The following event call removes
                all the anonymous headers from subsequent requests.
            */
            EventManager.sendEvent(Constants.EVENT_AUTHENTICATION_DATA_CHANGED, {
                anonymousMode: false
            });

            //initiate progressive profile flow
            EventManager.sendEvent(Constants.EVENT_CHANGE_VIEW, {
                route: Router.configuration.routes.progressiveProfile,
                args: [_.first(event.requiredProfileProcesses)]
            });
        }
    }];

    return obj;
});
