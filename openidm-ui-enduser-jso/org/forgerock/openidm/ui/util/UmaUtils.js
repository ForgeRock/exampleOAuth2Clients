"use strict";

/*
 * Copyright 2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "handlebars", "org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/openidm/ui/util/delegates/AMDelegate", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/util/UIUtils"], function ($, _, Handlebars, AbstractView, AMDelegate, Configuration, constants, eventManager, UIUtils) {

    var obj = {};

    obj.renderConfirmDialog = function (args, callback) {
        var id = args.id,
            message = $.t("templates.user.unshareDialog.defaultUnshareMessage");

        if (args.subject) {
            message = $.t("templates.user.unshareDialog.subjectUnshareMessage", { "subject": args.subject });
        }

        UIUtils.confirmDialog(message, "danger", function () {
            AMDelegate.unshareResource(id).then(function () {

                eventManager.sendEvent(constants.EVENT_DISPLAY_MESSAGE_REQUEST, "resourceUnshared");

                if (callback) {
                    callback();
                }
            }, function () {
                eventManager.sendEvent(constants.EVENT_DISPLAY_MESSAGE_REQUEST, "resourceUnsharedFail");
            });
        });
    };

    return obj;
});
