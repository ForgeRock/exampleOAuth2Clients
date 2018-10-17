"use strict";

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/*
 * Copyright 2015-2018 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/commons/ui/common/main/AbstractModel", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/EventManager"], function ($, _, AbstractModel, Configuration, Constants, EventManager) {
    var context, UserModel, sessionStorageTarget, ServiceInvokerTarget;

    try {
        if (opener && opener.require) {
            context = opener;
        } else {
            context = window;
        }
    } catch (e) {
        context = window;
    }

    sessionStorageTarget = context.sessionStorage;
    ServiceInvokerTarget = context.require("org/forgerock/commons/ui/common/main/ServiceInvoker");

    UserModel = AbstractModel.extend({
        protectedAttributeList: [],
        sync: function sync(method, model, options) {
            var headers = {};
            if (options.silent === true) {
                return this;
            }

            if (method === "update" || method === "patch") {
                if (this.currentPassword !== undefined) {
                    headers[Constants.HEADER_PARAM_REAUTH] = this.currentPassword;
                    _.extend(options, { "headers": headers });
                }
                options.errorsHandlers = options.errorsHandlers || {
                    "forbidden": {
                        status: "403"
                    }
                };

                if (this.component === "repo/internal/user" && method === "patch") {
                    // patch not yet supported on repo endpoints
                    method = "update";
                }
            }
            return AbstractModel.prototype.sync.call(this, method, model, options).fail(_.bind(function (xhr) {
                var previous = this.previousAttributes();
                this.clear();
                this.set(previous);
                if (_.isObject(xhr.responseJSON) && _.has(xhr.responseJSON, "code") && xhr.responseJSON.code === 403) {
                    if (xhr.responseJSON.message.indexOf("Reauthentication failed ") === 0) {
                        EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, "reauthFailed");
                    } else {
                        EventManager.sendEvent(Constants.EVENT_POLICY_FAILURE, {
                            error: {
                                responseObj: xhr.responseJSON
                            }
                        });
                    }
                }
            }, this)).always(_.bind(function () {
                if (this.has("password")) {
                    // usually password won't be included in the response, but it will for openidm-admin
                    this.unset("password");
                }

                delete this.currentPassword;
            }, this));
        },
        getUIRoles: function getUIRoles(roles) {
            var getRoleFromRef = function getRoleFromRef(role) {
                if (_.isObject(role) && _.has(role, "_ref")) {
                    role = role._ref.split("/").pop();
                }

                return role;
            };

            return _.chain(roles).filter(function (r) {
                return _.has(Configuration.globalData.roles, getRoleFromRef(r));
            }).map(function (r) {
                if (Configuration.globalData.roles[getRoleFromRef(r)] === "ui-user") {
                    return ["ui-user", "ui-self-service-user"];
                } else {
                    return Configuration.globalData.roles[getRoleFromRef(r)];
                }
            }).flatten().value();
        },
        parse: function parse(response) {
            if (_.has(response, "password")) {
                // usually password won't be included in the response, but it will for openidm-admin
                delete response.password;
            }
            return response;
        },
        invalidateSession: function invalidateSession() {
            var promise = new $.Deferred();
            ServiceInvokerTarget.configuration.defaultHeaders = this.setAuthTokenHeaders(ServiceInvokerTarget.configuration.defaultHeaders || {}, null);
            ServiceInvokerTarget.restCall({
                "url": Constants.host + Constants.context + "/authentication?_action=logout",
                "type": "POST",
                "headers": {
                    "X-OpenIDM-NoSession": "false"
                },
                "errorsHandlers": {
                    "unauthorized": {
                        status: "401"
                    }
                }
            }).always(function () {
                return promise.resolve();
            });
            return promise;
        },
        login: function login(username, password) {
            var _this = this;

            var headers = {};
            headers[Constants.HEADER_PARAM_USERNAME] = username;
            headers[Constants.HEADER_PARAM_PASSWORD] = password;
            headers[Constants.HEADER_PARAM_NO_SESSION] = false;

            return this.invalidateSession().then(function () {
                return _this.getProfile(headers);
            });
        },
        oauthLogin: function oauthLogin(provider) {
            var _this2 = this;

            var headers = {};

            if (!localStorage.getItem("dataStoreToken")) {
                return $.Deferred().reject({
                    responseJSON: {
                        reason: "noDataStoreToken"
                    }
                });
            }

            headers[Constants.HEADER_PARAM_USERNAME] = "";
            headers[Constants.HEADER_PARAM_PASSWORD] = "";
            headers[Constants.HEADER_PARAM_NO_SESSION] = false;

            return this.invalidateSession().then(function () {
                // when using OPENAM, the saved dataStoreToken must be included in every REST call
                // so that OpenAM session validation can occur when the short-lived OpenIDM session expires
                if (provider === "OPENAM") {
                    sessionStorageTarget.setItem("resubmitDataStoreToken", "true");
                    sessionStorageTarget.setItem("amToken", localStorage.getItem("dataStoreToken"));
                } else {
                    // when using a provider other than OpenAM, submit this token once, as part of getProfile
                    headers["X-OpenIDM-OAuth-Login"] = true;
                    headers["X-OpenIDM-DataStoreToken"] = localStorage.getItem("dataStoreToken");
                }
                return _this2.getProfile(headers);
            });
        },
        autoLogin: function autoLogin(jwt) {
            var _this3 = this;

            var headers = {};

            headers[Constants.HEADER_PARAM_USERNAME] = "";
            headers[Constants.HEADER_PARAM_PASSWORD] = "";
            headers[Constants.HEADER_PARAM_NO_SESSION] = false;

            headers[Constants.HEADER_PARAM_IDMJWT] = jwt;

            return this.invalidateSession().then(function () {
                return _this3.getProfile(headers);
            });
        },
        /**
         * Updates a header map to include DataStoreToken values from a separate map
         * Will remove them if the separate map is null.
         * @param {object} currentHeaders the headers that exist present
         * @param {object} authDetails may contain dataStoreToken; if present, will be set in returned header map
         * @returns {object} possibly modified copy of currentHeaders
         */
        setAuthTokenHeaders: function setAuthTokenHeaders(currentHeaders, authDetails) {
            var updatedHeaders = _.cloneDeep(currentHeaders);
            if (authDetails) {
                var _$extend;

                updatedHeaders = _.extend(updatedHeaders, (_$extend = {}, _defineProperty(_$extend, "X-OpenIDM-OAuth-Login", true), _defineProperty(_$extend, "X-OpenIDM-DataStoreToken", authDetails), _$extend));
            } else {
                delete updatedHeaders["X-OpenIDM-OAuth-Login"];
                delete updatedHeaders["X-OpenIDM-DataStoreToken"];
            }
            return updatedHeaders;
        },
        logout: function logout() {
            return window.logout();
        },
        getProfile: function getProfile(headers) {
            var _this5 = this;

            this.setAdditionalParameters({ _fields: "*,_meta/lastChanged" });

            ServiceInvokerTarget.configuration.defaultHeaders = this.setAuthTokenHeaders(ServiceInvokerTarget.configuration.defaultHeaders || {}, sessionStorageTarget.getItem("resubmitDataStoreToken") === "true" ? sessionStorageTarget.getItem("amToken") : null);

            return ServiceInvokerTarget.restCall({
                "url": Constants.host + Constants.context + "/authentication?_action=login",
                "type": "POST",
                "headers": headers || {},
                "errorsHandlers": {
                    "forbidden": {
                        status: "403"
                    },
                    "unauthorized": {
                        status: "401"
                    }
                }
            }).fail(function () {
                _this5.invalidateSession();
            }).then(_.bind(function (sessionDetails) {
                this.id = sessionDetails.authorization.id;
                this.url = Constants.host + Constants.context + "/" + sessionDetails.authorization.component;
                this.component = sessionDetails.authorization.component;
                this.protectedAttributeList = sessionDetails.authorization.protectedAttributeList || [];
                this.logoutUrl = sessionDetails.authorization.logoutUrl;
                this.baseEntity = this.component + "/" + this.id;
                this.uiroles = this.getUIRoles(sessionDetails.authorization.roles);
                this.provider = sessionDetails.authorization.provider;
                this.authenticationId = sessionDetails.authenticationId;
                this.roles = sessionDetails.authorization.roles;

                if (sessionDetails.authorization.provider) {
                    this.provider = sessionDetails.authorization.provider;
                } else {
                    this.provider = null;
                }

                if (_.indexOf(["OAUTH_CLIENT"], sessionDetails.authorization.moduleId) === -1) {
                    this.userNamePasswordLogin = true;
                } else {
                    this.userNamePasswordLogin = false;
                }

                /*
                    Check here to see if the user has the "openidm-authenticated" role which indicates
                    the user has met a condition defined in selfservice-profile.json for progressive profiling.
                */
                if (_.contains(sessionDetails.authorization.roles, "openidm-authenticated")) {
                    /*
                        Add authorization to the userModel for use later in making
                        decisions about kicking off progressive profiling.
                    */
                    this.authorization = sessionDetails.authorization;
                    return $.Deferred().resolve(this);
                } else {
                    return this.fetch().then(_.bind(function () {
                        return this;
                    }, this));
                }
            }, this));
        },
        getProtectedAttributes: function getProtectedAttributes() {
            return this.protectedAttributeList;
        },
        setCurrentPassword: function setCurrentPassword(currentPassword) {
            this.currentPassword = currentPassword;
        },

        bindProvider: function bindProvider(provider) {
            var _this6 = this;

            var token = JSON.stringify(localStorage.getItem("dataStoreToken")) || null;

            return ServiceInvokerTarget.restCall({
                "type": "POST",
                "errorsHandlers": {
                    "badRequest": {
                        status: "412"
                    }
                },
                "data": token,
                "url": this.url + "/" + this.id + "?_action=bind&provider=" + provider
            }).then(function (resp) {
                _this6.set(resp);
                return resp;
            }, function (error) {
                if (error.responseJSON.code === 412) {
                    EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, "accountAlreadyBound");
                }
            });
        },

        unbindProvider: function unbindProvider(provider) {
            var _this7 = this;

            return ServiceInvokerTarget.restCall({
                "type": "POST",
                "errorsHandlers": {
                    "badRequest": {
                        status: "400"
                    }
                },
                "url": this.url + "/" + this.id + "?_action=unbind&" + $.param({
                    "provider": provider
                })
            }).then(function (resp) {
                _this7.set(resp);
                return resp;
            });
        }
    });

    return UserModel;
});
