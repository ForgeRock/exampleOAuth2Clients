"use strict";

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/*
 * Copyright 2016-2018 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/main/ValidatorsManager"], function ($, _, AbstractView, Configuration, ValidatorsManager) {
    var PersonalInfoItemView = AbstractView.extend({
        template: "templates/profile/personalInfo/PersonalInfoField.html",
        events: {
            "click .btn-cancel": "cancelChanges",
            "click .btn-save": "saveChanges",
            "keyup input": "inputHandler",
            "hide.bs.collapse .panel-collapse": "collapseHideHandler",
            "show.bs.collapse .panel-collapse": "collapseShowHandler",
            "shown.bs.collapse .panel-collapse": "collapseShownHandler"
        },
        /**
         * Set initial model and data values for the field view
         * @param {jQuery} args.element -- dom element to render into on `parentRender`
         * @param {string} args.justification -- reason for collecting field data
         * @param {boolean} args.readonly -- sets the input uneditable
         * @param {string} args.schemaName -- managed user schema property name
         * @param {function} args.submit -- send to server handler
         * @param {string} args.title
         * @param {string} args.value -- the initial value for the field
         */
        initialize: function initialize(args, options) {
            var element = args.element,
                justification = args.justification,
                readonly = args.readonly,
                schemaName = args.schemaName,
                submit = args.submit,
                title = args.title,
                value = args.value;

            this.element = element;
            this.data = {
                justification: justification,
                placeholder: $.t("templates.personalInfo.addValueFor") + " " + title.toLowerCase(),
                readonly: readonly,
                schemaName: schemaName,
                title: title,
                value: value
            };
            this.model = { schemaName: schemaName, value: value };
            this.submit = submit;
            AbstractView.prototype.initialize.call(this, args, options);
        },

        /**
         * render element and bind validators
         */
        render: function render(callback) {
            var _this = this;

            this.parentRender(function () {
                ValidatorsManager.bindValidators(_this.$el.find("form"), Configuration.loggedUser.baseEntity);
                if (callback) {
                    callback();
                }
            });
        },

        /**
         * Load a new value into the field and then collapse the panel, triggering reset.
         * Called after save to sync data with the value from the server.
         * @param {string} value -- the new value for the field
         */
        updateValue: function updateValue(value) {
            this.model.value = value;
            this.$el.find("#" + this.model.schemaName + "Collapse").collapse("hide");
        },

        /**
         * change the value represented in the dom back to the value of the model
         * and reset the validation.
         */
        resetValue: function resetValue() {
            var value = this.model.value;

            this.data.value = value;
            this.$el.find(".value span.view-closed").text(value);
            this.$el.find("input").val(value);
            ValidatorsManager.clearValidators(this.$el.find("form"));
        },

        /**
         * helper method for determining if the collapse panel is expanded
         * Used by tab view to close in active fields
         */
        isOpen: function isOpen() {
            return this.$el.find("#" + this.model.schemaName + "Collapse").hasClass("in");
        },

        /**
         * function for handling user input. Trigger on keyup event, pressing the ENTER
         * or ESC keys will trigger save or cancel. Any other key presses will edit the data.
         */
        inputHandler: function inputHandler(event) {
            event.preventDefault();
            // ENTER key
            if (event.keyCode === 13) {
                this.saveChanges(event);
                // ESC key
            } else if (event.keyCode === 27) {
                this.cancelChanges(event);
            } else {
                this.data.value = _.trim(event.target.value);
            }
        },

        /**
         * close the pane, triggering a call to `reset`
         */
        cancelChanges: function cancelChanges() {
            this.$el.find("#" + this.model.schemaName + "Collapse").collapse("hide");
        },

        /**
         * submit changes to the server, or call cancel if there are no changes
         */
        saveChanges: function saveChanges(event) {
            event.preventDefault();

            if (ValidatorsManager.formValidated(this.$el.find("form")) && !_.isEqual(this.model.value, _.trim(this.data.value))) {
                this.submit(_defineProperty({}, this.model.schemaName, _.trim(this.data.value)));
            } else {
                this.cancelChanges(event);
            }
        },

        /**
         * trigger a reset when the collapse panel closes and show the preview text
         */
        collapseHideHandler: function collapseHideHandler() {
            this.resetValue();
            this.$el.find(".value").removeClass("hidden");
        },

        /**
         * hide the preview text when the collapse panel opens
         */
        collapseShowHandler: function collapseShowHandler() {
            this.$el.find(".value").addClass("hidden");
        },

        /**
         * after the collapse panel is fully open, set the focus on the input
         */
        collapseShownHandler: function collapseShownHandler() {
            if (!this.data.readonly) {
                _.first(this.$el.find("#" + this.model.schemaName + "Collapse").find("input")).select();
            }
        }
    });

    return PersonalInfoItemView;
});
