"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "form2js", "org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/commons/ui/common/main/ValidatorsManager", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/openidm/ui/common/workflow/WorkflowDelegate", "org/forgerock/openidm/ui/common/workflow/FormManager", "org/forgerock/openidm/ui/common/workflow/processes/TemplateStartProcessForm", "org/forgerock/openidm/ui/common/util/FormGenerationUtils", "org/forgerock/commons/ui/common/util/DateUtil", "org/forgerock/commons/ui/common/util/ModuleLoader"], function ($, _, form2js, AbstractView, validatorsManager, eventManager, constants, workflowManager, formManager, templateStartProcessForm, formGenerationUtils, dateUtil, ModuleLoader) {
    var StartProcessView = AbstractView.extend({
        template: "templates/workflow/processes/StartProcessTemplate.html",

        element: "#processDetails",

        events: {
            "click input[name=startProcessButton]": "formSubmit",
            "onValidate": "onValidate",
            "click .closeLink": "hideDetails"
        },

        hideDetails: function hideDetails(event) {
            if (event) {
                event.preventDefault();
            }

            //since this view is limited have to go above to set arrows correct
            $("#processes").find(".details-link .fa").toggleClass("fa-caret-right", true);
            $("#processes").find(".details-link .fa").toggleClass("fa-caret-down", false);

            this.$el.empty();
        },

        formSubmit: function formSubmit(event) {
            event.preventDefault();

            if (validatorsManager.formValidated(this.$el)) {
                var params = form2js(this.$el.attr("id"), '.', false),
                    param,
                    typeName,
                    paramValue,
                    date,
                    dateFormat;
                delete params.startProcessButton;
                for (param in params) {
                    if (_.isNull(params[param])) {
                        delete params[param];
                    }
                }

                if (this.definitionFormPropertyMap) {
                    formGenerationUtils.changeParamsToMeetTheirTypes(params, this.definitionFormPropertyMap);
                }

                workflowManager.startProcessById(this.processDefinition._id, params, _.bind(function () {
                    eventManager.sendEvent(constants.EVENT_DISPLAY_MESSAGE_REQUEST, "startedProcess");
                    //eventManager.sendEvent(constants.ROUTE_REQUEST, {routeName: "", trigger: true});
                    eventManager.sendEvent("refreshTasksMenu");
                }, this));
            }
        },

        render: function render(id, category, callback) {
            var formValidateOptions = {
                element: ".workflowFormContainer",
                attribute: "data-validationbaseentity"
            };

            this.parentRender(function () {
                validatorsManager.bindValidators(this.$el);
                workflowManager.getProcessDefinition(id, _.bind(function (definition) {
                    var template = this.getGenerationTemplate(definition),
                        view,
                        passJSLint;
                    this.processDefinition = definition;
                    delete this.definitionFormPropertyMap;

                    if (template === false && definition.formResourceKey) {
                        ModuleLoader.load(formManager.getViewForForm(definition.formResourceKey)).then(function (view) {
                            view.render(definition, {}, {}, callback);
                        });
                    } else if (template !== false) {
                        templateStartProcessForm.render(definition, {}, template, _.bind(formGenerationUtils.validateForm, this, formValidateOptions, validatorsManager, callback));
                        return;
                    } else {
                        this.definitionFormPropertyMap = formGenerationUtils.buildPropertyTypeMap(definition.formProperties);
                        templateStartProcessForm.render({ "formProperties": definition.formProperties.formPropertyHandlers }, {}, formGenerationUtils.generateTemplateFromFormProperties(definition), _.bind(formGenerationUtils.validateForm, this, formValidateOptions, validatorsManager, callback));
                        return;
                    }
                }, this));
            });
        },

        getGenerationTemplate: function getGenerationTemplate(definition) {
            var property, i;
            if (typeof definition.formGenerationTemplate === "string") {
                return definition.formGenerationTemplate;
            }
            for (i = 0; i < definition.formProperties.length; i++) {
                property = definition.formProperties[i];
                if (property._id === "_formGenerationTemplate") {
                    return property.defaultExpression.expressionText;
                }
            }
            return false;
        }

    });

    return new StartProcessView();
});
