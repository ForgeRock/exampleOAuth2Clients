"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["underscore", "org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/commons/ui/common/main/ValidatorsManager", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/openidm/ui/common/workflow/WorkflowDelegate", "org/forgerock/commons/ui/common/main/Configuration"], function (_, AbstractView, validatorsManager, eventManager, constants, workflowManager, conf) {
    var AbstractProcessForm = AbstractView.extend({
        template: "templates/common/EmptyTemplate.html",
        element: "#processContent",

        events: {
            "onValidate": "onValidate"
        },

        postRender: function postRender(callback) {
            if (callback) {
                callback();
            }
        },

        prepareData: function prepareData(callback) {
            callback();
        },

        render: function render(processDefinition, category, args, callback) {
            this.setElement(this.element);
            this.$el.unbind();
            this.delegateEvents();
            this.processDefinition = processDefinition;
            this.category = category;
            this.args = args;

            this.prepareData(_.bind(function () {
                this.parentRender(function () {
                    this.postRender(callback);
                    this.reloadData();
                });
            }, this));
        },

        reloadData: function reloadData() {}

    });

    return AbstractProcessForm;
});
