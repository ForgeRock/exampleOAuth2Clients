"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/openidm/ui/common/workflow/WorkflowDelegate", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/openidm/ui/common/workflow/processes/StartProcessView", "org/forgerock/commons/ui/common/main/Configuration"], function ($, _, AbstractView, workflowManager, eventManager, constants, startProcessView, conf) {
    var StartProcessDashboardView = AbstractView.extend({

        template: "templates/workflow/processes/StartProcessDashboardTemplate.html",

        events: {
            "click .details-link": "showStartProcessView"
        },

        element: "#processes",

        render: function render(args) {
            var processId;
            if (args && args[0] && args[0] !== '') {
                processId = args[0];
            }
            workflowManager.getAllUniqueProcessDefinitions(_.bind(function (processDefinitions) {
                var i;
                this.data.processDefinitions = processDefinitions;

                this.parentRender(function () {
                    if (processDefinitions.length === 0) {
                        $("#processList").html('<li class="list-group-item"><h5 class="text-center">' + $.t("openidm.ui.admin.tasks.StartProcessDashboardView.noProcesses") + '</h5></li>');
                    } else {
                        $("#processBadge").html(processDefinitions.length);
                        $("#processBadge").show();
                    }

                    if (processId) {
                        this.renderStartProcessView(processId);
                    }
                });
            }, this));
        },

        showStartProcessView: function showStartProcessView(event) {
            event.preventDefault();
            var parent = $(event.target).parents(".process-item"),
                id = parent.find('[name="id"]').val(),
                collapse = parent.find('#processDetails').length;

            this.$el.find("#processDetails").remove();
            this.$el.find(".selected-process").removeClass('selected-process');

            if (collapse) {
                parent.find(".details-link .fa").toggleClass("fa-caret-right", true);
                parent.find(".details-link .fa").toggleClass("fa-caret-down", false);
            } else {
                this.$el.find(".fa-caret-down").toggleClass("fa-caret-right", true);
                this.$el.find(".fa-caret-down").toggleClass("fa-caret-down", false);

                parent.find(".details-link .fa").toggleClass("fa-caret-right", false);
                parent.find(".details-link .fa").toggleClass("fa-caret-down", true);

                $(event.target).parents(".process-item").find('.process-item-holder').addClass('selected-process');
                $(event.target).parents(".process-item").find('.process-item-holder').append('<div id="processDetails" style="margin-top: 10px;"></div>');

                this.renderStartProcessView(id);
            }
        },

        renderStartProcessView: function renderStartProcessView(id) {
            startProcessView.render(id, "", function () {
                $("#processContent [disabled]:hidden").filter(function () {
                    return $(this).siblings(":visible").length === 0;
                }).parent().hide();

                if ($("#processContent").html() === "") {
                    $("#processContent").html($.t("openidm.ui.admin.tasks.StartProcessDashboardView.noDataRequired"));
                }
            });
        }

    });

    return new StartProcessDashboardView();
});
