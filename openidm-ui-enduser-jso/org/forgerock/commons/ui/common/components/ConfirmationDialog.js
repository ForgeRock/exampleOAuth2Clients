"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "org/forgerock/commons/ui/common/components/Dialog", "org/forgerock/commons/ui/common/components/BootstrapDialogView"], function ($, Dialog, BootstrapDialogView) {
    var ConfirmationDialog = BootstrapDialogView.extend({
        render: function render(title, msg, actionName, okCallback) {
            this.setElement($('<div id="CommonConfirmationDialog"></div>'));
            this.title = title;
            this.message = msg;
            this.actions = [{
                label: $.t("common.form.cancel"),
                action: function action(dialogRef) {
                    dialogRef.close();
                }
            }, {
                label: actionName,
                cssClass: "btn-primary",
                action: function action(dialogRef) {
                    if (okCallback) {
                        okCallback();
                    }
                    dialogRef.close();
                }
            }];

            this.show();
        }
    });

    return new ConfirmationDialog();
});
