"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/openidm/ui/common/workflow/WorkflowDelegate", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/openidm/ui/common/workflow/tasks/TasksMenuView", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/openidm/ui/common/workflow/tasks/TaskDetailsView", "org/forgerock/openidm/ui/common/workflow/processes/StartProcessDashboardView"], function ($, _, AbstractView, workflowManager, eventManager, constants, TasksMenuView, conf, taskDetailsView, startProcessView) {

    var TasksDashboard = AbstractView.extend({
        template: "templates/workflow/tasks/TasksDashboardTemplate.html",
        element: "#dashboardWorkflow",
        noBaseTemplate: true,
        data: {
            shouldDisplayNotifications: true,
            mode: "user"
        },
        render: function render(args, callback) {

            this.myTasks = new TasksMenuView();
            this.candidateTasks = new TasksMenuView();
            this.registerListeners();

            this.parentRender(function () {
                this.candidateTasks.render("all", $("#candidateTasks"));
                this.myTasks.render("assigned", $("#myTasks"));
                startProcessView.render();

                if (callback) {
                    callback();
                }
            });
        },

        getDetailsRow: function getDetailsRow() {
            return '<tr class="input-full"><td colspan="5"><div id="taskDetails"></div></td></tr>';
        },

        showDetails: function showDetails(event) {
            var root, listItem;

            root = event.category === "assigned" ? $("#myTasks") : $("#candidateTasks");
            listItem = root.find("[name=taskId][value=" + event.id + "]").parents(".list-group-item");

            if (listItem.find("#listItem").length === 0) {
                $("#taskDetails").remove();

                listItem.append('<div id="taskDetails"></div>');

                taskDetailsView.render(event.task, event.definition, event.category, function () {
                    if (event.category === "all") {
                        //$("#taskDetails input:enabled, #taskDetails select:enabled").filter(function(){return $(this).val() === "";}).parent().hide();
                        $("#taskDetails input, #taskDetails select").attr("disabled", "true");
                        $("#taskDetails span").hide();
                    }

                    if (root.find("#taskContent").html() === "") {
                        root.find("#taskContent").css("text-align", "left");
                        root.find("#taskContent").html($.t("openidm.ui.admin.tasks.StartProcessDashboardView.noDataRequired"));
                    }
                });
            } else {
                $("#taskDetails").remove();
            }
        },

        registerListeners: function registerListeners() {
            eventManager.unregisterListener("showTaskDetailsRequest");
            eventManager.registerListener("showTaskDetailsRequest", _.bind(this.showDetails, this));

            eventManager.unregisterListener("refreshTasksMenu");
            eventManager.registerListener("refreshTasksMenu", _.bind(function (event) {
                this.refreshMenus();
                startProcessView.render();
            }, this));

            eventManager.unregisterListener("refreshMyTasksMenu");
            eventManager.registerListener("refreshMyTasksMenu", _.bind(function (event) {
                this.refreshMenus();
                startProcessView.render();
            }, this));
        },

        refreshMenus: function refreshMenus() {
            this.myTasks.render("assigned", $("#myTasks"));

            this.candidateTasks.render("all", $("#candidateTasks"));
        }
    });

    return new TasksDashboard();
});
