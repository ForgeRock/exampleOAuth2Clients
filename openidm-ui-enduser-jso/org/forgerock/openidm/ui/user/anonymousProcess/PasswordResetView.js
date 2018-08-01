"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "form2js", "handlebars", "org/forgerock/commons/ui/user/anonymousProcess/AnonymousProcessView", "org/forgerock/openidm/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/user/anonymousProcess/PasswordResetView"], function ($, _, form2js, Handlebars, AnonymousProcessView, Constants, EventManager, CommonPasswordResetView) {

    var PasswordResetView = AnonymousProcessView.extend({
        renderProcessState: function renderProcessState(response) {
            if (_.has(response, "requirements.error") && response.requirements.error.message === "Failed policy validation") {
                EventManager.sendEvent(Constants.EVENT_POLICY_FAILURE, {
                    error: {
                        responseObj: response.requirements.error
                    }
                });
            }
            CommonPasswordResetView.renderProcessState.call(this, response);
        },
        attemptCustomTemplate: function attemptCustomTemplate(stateData, baseTemplateUrl, response, processStatePromise) {
            var _this = this;

            var promise = $.Deferred();
            promise.then(function (html) {
                if (response.type === "resetStage" && response.tag === "initial") {
                    _this.baseEntity = "selfservice/reset";
                } else {
                    delete _this.baseEntity;
                }
                processStatePromise.resolve(html);
            });
            CommonPasswordResetView.attemptCustomTemplate.call(this, stateData, baseTemplateUrl, response, promise);
        }
    });

    PasswordResetView.prototype = _.extend(Object.create(CommonPasswordResetView), PasswordResetView.prototype);

    return new PasswordResetView();
});
