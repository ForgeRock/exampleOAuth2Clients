"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/openidm/ui/common/workflow/processes/AbstractProcessForm", "UserDelegate", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/main/ValidatorsManager"], function ($, _, AbstractProcessForm, userDelegate, conf, validatorsManager) {
    var SendNotificationProcess = AbstractProcessForm.extend({

        template: "templates/workflow/processes/customview/SendNotificationTemplate.html",

        prepareData: function prepareData(callback) {
            var nTypes, notificationType;
            _.extend(this.data, this.processDefinition);
            this.data.loggedUser = conf.loggedUser.toJSON();

            nTypes = {};
            for (notificationType in conf.globalData.notificationTypes) {
                nTypes[notificationType] = $.t(conf.globalData.notificationTypes[notificationType].name);
            }
            this.data.notificationTypes = nTypes;
            this.data.defaultNotificationType = conf.globalData.notificationTypes.defaultType;

            _.bind(function () {

                userDelegate.getAllUsers(_.bind(function (users) {

                    var resultMap = {},
                        userPointer,
                        user;
                    for (userPointer in users) {
                        user = users[userPointer];
                        resultMap[user._id] = user.givenName + " " + user.familyName;
                    }
                    this.data.users = resultMap;
                    callback();
                }, this));
            }, this)();
        },

        postRender: function postRender() {
            validatorsManager.bindValidators(this.$el);
            validatorsManager.validateAllFields(this.$el);
        }

    });

    return new SendNotificationProcess();
});
