"use strict";

/*
 * Copyright 2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/commons/ui/common/main/ValidatorsManager", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/util/Constants"], function ($, _, AbstractView, ValidatorsManager, Configuration, EventManager, Constants) {
    var EditPasswordPageView = AbstractView.extend({
        template: "templates/profile/signInAndSecurity/EditPasswordPageView.html",
        events: {
            "click .btn-showhide-password": "showHidePassword",
            "click .btn-save": "save",
            "keyup .new-value": "toggleSaveButton"
        },

        /**
         * load template and bind validators
         */
        render: function render() {
            var _this = this;

            var protectedAttributes = Configuration.loggedUser.getProtectedAttributes();
            if (_.includes(protectedAttributes, "password")) {
                this.data = { changeProtected: true };
            }

            this.parentRender(function () {
                ValidatorsManager.bindValidators(_this.$el.find("form"), Configuration.loggedUser.baseEntity, function () {
                    _this.$el.find(".btn-save").prop("disabled", true);
                });
            });
        },

        /**
         * handler for new eye click functionality
         * @param  {object} event -- triggering dom event
         */
        showHidePassword: function showHidePassword(event) {
            var button = $(event.currentTarget),
                icon = button.find("i"),
                input = $("input[name='" + button.data("name") + "']");

            if (icon.hasClass("fa-eye")) {
                icon.removeClass("fa-eye").addClass("fa-eye-slash");
                input.attr("type", "text");
            } else {
                icon.removeClass("fa-eye-slash").addClass("fa-eye");
                input.attr("type", "password");
            }
        },

        /**
         * grab form data and submit to the server if valid
         * @param  {object} event -- triggering dom event
         */
        save: function save() {
            var form = this.$el.find("form"),
                formData = form.serializeArray().reduce(function (result, field) {
                return _.set(result, field.name, field.value);
            }, {});
            if (ValidatorsManager.formValidated(form)) {
                var password = formData.password,
                    currentPassword = formData.currentPassword;

                if (this.data.changeProtected) {
                    Configuration.loggedUser.setCurrentPassword(currentPassword);
                }
                this.submit({ password: password });
            }
        },

        /**
         * Generic save method  - patch the user model with the local data and persist it.
         */
        submit: function submit(formData) {
            var _this2 = this;

            Configuration.loggedUser.save(formData, { patch: true }).then(
            // success handler
            function () {
                _this2.render();
                EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, "profileUpdateSuccessful");
            },
            // error handler
            // a message will be shown in the event of a wrong password given for
            // protected field.
            function () {
                _this2.render();
            });
        },

        /**
         * handler for enabling/disabling the save button based on validation state
         * @param  {object} event -- triggering dom event
         */
        toggleSaveButton: function toggleSaveButton() {
            var saveButton = this.$el.find(".btn-save");
            if (ValidatorsManager.formValidated(this.$el.find("form"))) {
                saveButton.prop("disabled", false);
            } else {
                saveButton.prop("disabled", true);
            }
        }

    });

    return new EditPasswordPageView();
});
