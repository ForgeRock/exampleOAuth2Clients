"use strict";

/*
 * Copyright 2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "bootstrap-dialog", "org/forgerock/commons/ui/common/util/Constants"], function ($, _, BootstrapDialog, Constants) {
    var obj = {};
    /**
     * @param args - non-default JSON object for bootstapDialog
     *
     * default config includes:
     *        type: BootstrapDialog.TYPE_DEFAULT,
     *        size: BootstrapDialog.SIZE_WIDE,
     *        closable: true,
     *        closeByBackdrop: false,
     *        closeByKeyboard: false
     * which can be overwritten by passing a new value in the 'args' object
     *
     * The 'button' array accepts both "cancel" and "close" for default implimentations
     */
    obj.createModal = function (args) {
        var dialogDefaults = {
            type: BootstrapDialog.TYPE_DEFAULT,
            size: BootstrapDialog.SIZE_WIDE,
            closable: true,
            closeByBackdrop: false,
            closeByKeyboard: false
        },
            commonButtons = {
            "cancel": {
                label: $.t("common.form.cancel"),
                action: function action(dialogRef) {
                    dialogRef.close();
                }
            },
            "close": {
                label: $.t("common.form.close"),
                action: function action(dialogRef) {
                    dialogRef.close();
                }
            }
        },
            dialogCustomSettings = {};

        if (args) {
            dialogCustomSettings = _.extend(dialogDefaults, args);
        }

        if (args.buttons.length) {
            dialogCustomSettings.buttons = _.map(args.buttons, function (button) {
                if (_.isString(button)) {
                    button = commonButtons[button];
                } else if (_.isUndefined(button.hotkey) && button.label === $.t("common.form.save")) {
                    button.hotkey = Constants.ENTER_KEY;
                }
                return button;
            });
        }

        return new BootstrapDialog(dialogCustomSettings);
    };

    return obj;
});
