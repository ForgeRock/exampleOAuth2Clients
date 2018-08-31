"use strict";

/*
 * Copyright 2017-2018 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "form2js", "handlebars", "org/forgerock/commons/ui/user/anonymousProcess/AnonymousProcessView", "org/forgerock/openidm/ui/common/delegates/SchemaDelegate", "org/forgerock/openidm/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/main/Router", "org/forgerock/openidm/ui/common/UserModel", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/user/anonymousProcess/KBAView", "org/forgerock/openidm/ui/util/delegates/SiteConfigurationDelegate"], function ($, _, form2js, Handlebars, AnonymousProcessView, SchemaDelegate, Constants, EventManager, Router, UserModel, Configuration, KBAView, SiteConfigurationDelegate) {

    var ProgressiveProfileView = AnonymousProcessView.extend({
        processType: "profile",
        i18nBase: "common.user.progressiveProfile",
        events: _.extend({
            "focus .float-label input": "addFloatLabelStyles",
            "blur .float-label": "removeFloatLabelStyles",
            "click #skipThis": "skipStageOrSubmitFalseForSingleBoolean"
        }, AnonymousProcessView.prototype.events),
        model: {},
        statusFailureReason: {
            "Custom Questions cannot be duplicates": "noDuplicateKbaQuestions"
        },
        render: function render(args) {
            var _this = this;

            //hide the contents of the page to avoid a "flicker" with default stage values
            $("#wrapper").hide();

            this.processType = args[0];

            AnonymousProcessView.prototype.resetDelegate = function (args, params) {
                _this.setDelegate(_this.processType, params.token);
            };

            AnonymousProcessView.prototype.render.call(this, args);
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
        renderProcessState: function renderProcessState(response) {
            if (_.has(response, "status") && !response.status.success) {
                var message = this.statusFailureReason[response.status.reason] || "profileFailureMessage";

                EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, message);
            }
            if (response.tag === "end") {
                new UserModel().getProfile().then(function (userModel) {
                    if (_.has(userModel, "authorization.requiredProfileProcesses") && userModel.authorization.requiredProfileProcesses.length > 0) {
                        //initiate progressive profile flow again because for some reason we still have openidm-authenticated role
                        EventManager.sendEvent(Constants.EVENT_START_PROGRESSIVE_PROFILING, {
                            requiredProfileProcesses: userModel.authorization.requiredProfileProcesses
                        });
                    } else {
                        Configuration.setProperty('loggedUser', userModel);
                        /*
                            When we finish progressive profiling we need to make sure we refresh
                            the user's profile tabs. This is needed if the user tries to reload
                            the ProgressiveProfileView before the process is complete.
                        */
                        SiteConfigurationDelegate.checkForDifferences({ refreshProfileTabs: true }).then(function () {
                            EventManager.sendEvent(Constants.EVENT_CHANGE_VIEW, {
                                route: Router.configuration.routes.dashboard
                            });
                        });
                    }
                });
            } else if (_.isEmpty(response.requirements)) {
                this.skipStageOrSubmitFalseForSingleBoolean();
            } else {
                return this.renderForm(response);
            }
        },
        renderForm: function renderForm(response) {
            var attributesToCollect = response.requirements.attributes;

            response.requirements.hasRequiredAttribute = _.filter(attributesToCollect, { isRequired: true }).length ? true : false;

            if (_.has(response, "requirements.error") && response.requirements.error.message === "Failed policy validation") {
                EventManager.sendEvent(Constants.EVENT_POLICY_FAILURE, {
                    error: {
                        responseObj: response.requirements.error
                    }
                });
            }

            //replace the default header text with the form displayName
            this.$el.find(".page-header h1").text(response.requirements.uiConfig.displayName);
            //hide the "Return to login" link
            this.$el.find("#anonymousProcessReturn").hide();
            //now show everything
            $("#wrapper").show();

            //check to see if we are only dealing with one boolean type attribute
            if (attributesToCollect && attributesToCollect.length === 1 && attributesToCollect[0].schema.type === "boolean") {
                this.model.isSingleBooleanForm = true;
                this.model.singleBooleanPropertyName = attributesToCollect[0].name;
                //set this flag to tell the template to handle single booleans
                response.requirements.isSingleBooleanForm = true;
            }

            return AnonymousProcessView.prototype.renderProcessState.call(this, response).then(function () {
                if (_.has(response, "requirements.properties.kba") && response.tag === "initial") {
                    KBAView.render(response);
                }
            });
        },
        skipStageOrSubmitFalseForSingleBoolean: function skipStageOrSubmitFalseForSingleBoolean(e) {
            var requirements = {};

            if (e) {
                e.preventDefault();
            }

            if (this.model.isSingleBooleanForm) {
                requirements[this.model.singleBooleanPropertyName] = false;
            }

            //submit an empty object to skip the stage
            this.delegate.submit(requirements).then(_.bind(this.renderProcessState, this), _.bind(this.renderProcessState, this));
        },
        getFormContent: function getFormContent() {
            var formContent = AnonymousProcessView.prototype.getFormContent.call(this);

            if (this.stateData && _.has(this.stateData, "requirements.properties.kba")) {
                return { "kba": KBAView.getQuestions() };
            } else {
                return formContent;
            }
        }
    });

    return new ProgressiveProfileView();
});
