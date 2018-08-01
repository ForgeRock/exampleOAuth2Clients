"use strict";

/*
 * Copyright 2014-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/commons/ui/common/main/ValidatorsManager", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/Router", "org/forgerock/commons/ui/common/util/ModuleLoader", "org/forgerock/openidm/ui/common/util/BootstrapDialogUtils", "org/forgerock/commons/ui/common/util/UIUtils"], function ($, _, AbstractView, validatorsManager, conf, eventManager, constants, router, ModuleLoader, BootstrapDialogUtils, uiUtils) {
    var MandatoryPasswordChangeDialog = AbstractView.extend({
        contentTemplate: "templates/admin/MandatoryPasswordChangeDialogTemplate.html",
        events: {
            "onValidate": "onValidate",
            "customValidate": "customValidate"
        },
        model: {},

        render: function render(args, callback) {
            var _this2 = this;

            ModuleLoader.load(router.configuration.routes.landingPage.view).then(function (landingView) {
                var _this = _this2,
                    currentDialog = $('<div id="mandatoryPasswordChangeDialog"></div>');

                if (landingView.baseTemplate) {
                    _this2.baseTemplate = landingView.baseTemplate;
                }

                _this2.setElement(currentDialog);

                uiUtils.renderTemplate(_this.contentTemplate, _this.$el, _.extend({}, conf.globalData, _this.data), _.bind(function () {
                    this.model.dialog = BootstrapDialogUtils.createModal({
                        title: $.t("templates.MandatoryChangePassword.title"),
                        message: currentDialog,
                        onshow: _.bind(function (dialogRef) {
                            dialogRef.$modalFooter.find("#submitPasswordChange").prop('disabled', true);
                        }, this),
                        onshown: _.bind(function (dialogRef) {
                            validatorsManager.bindValidators(this.$el, conf.loggedUser.component + "/" + conf.loggedUser.id, _.bind(function () {
                                this.$el.find("[name=password]").focus();

                                if (callback) {
                                    callback();
                                }
                            }, this));
                        }, _this),
                        onhide: _.bind(function () {
                            eventManager.sendEvent(constants.EVENT_DIALOG_CLOSE);
                        }, this),
                        buttons: [{
                            label: $.t("common.form.submit"),
                            id: "submitPasswordChange",
                            cssClass: "btn-primary",
                            action: _.bind(function (dialogRef) {
                                if (validatorsManager.formValidated(this.$el.find("#passwordChange"))) {
                                    conf.loggedUser.save({ "password": this.$el.find("input[name=password]").val() }).then(function () {
                                        delete conf.passwords;
                                        dialogRef.close();
                                        eventManager.sendEvent(constants.EVENT_DISPLAY_MESSAGE_REQUEST, "securityDataChanged");
                                    });
                                }
                            }, this)
                        }]
                    }).open();
                }, _this), "append");
            });
        },

        close: function close() {
            this.model.dialog.close();
        },

        customValidate: function customValidate() {
            if (validatorsManager.formValidated(this.$el.find("#passwordChange")) || validatorsManager.formValidated(this.$el.find("#securityDataChange"))) {
                this.model.dialog.$modalFooter.find("#submitPasswordChange").prop('disabled', false);
            } else {
                this.model.dialog.$modalFooter.find("#submitPasswordChange").prop('disabled', true);
            }
        }
    });

    return new MandatoryPasswordChangeDialog();
});
