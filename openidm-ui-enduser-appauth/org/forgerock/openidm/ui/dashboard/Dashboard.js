"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/openidm/ui/common/workflow/tasks/TasksDashboard", "org/forgerock/openidm/ui/common/dashboard/DashboardWidgetLoader", "org/forgerock/openidm/ui/common/delegates/ConfigDelegate"], function ($, _, AbstractView, eventManager, constants, conf, tasksDashboard, DashboardWidgetLoader, ConfigDelegate) {
    var Dashboard = AbstractView.extend({
        template: "templates/dashboard/DashboardTemplate.html",
        model: {
            loadedWidgets: []
        },
        data: {},
        render: function render(args, callback) {
            var _this = this;

            this.model = {
                loadedWidgets: []
            };

            this.data = {};

            if (conf.loggedUser) {
                var roles = conf.loggedUser.uiroles;

                ConfigDelegate.readEntity("ui/dashboard").then(function (dashboardConfig) {
                    _this.model.dashboard = dashboardConfig.dashboard;

                    _this.parentRender(function () {
                        var templElement;

                        if (!_.isUndefined(_this.model.dashboard.widgets) && _this.model.dashboard.widgets.length > 0) {
                            _.each(_this.model.dashboard.widgets, _.bind(function (widget) {

                                if (widget.type === "workflow") {
                                    this.loadWorkflow(roles, callback);
                                } else {
                                    if (widget.size === "x-small") {
                                        templElement = $('<div class="col-sm-4"></div>');
                                    } else if (widget.size === "small") {
                                        templElement = $('<div class="col-sm-6"></div>');
                                    } else if (widget.size === "medium") {
                                        templElement = $('<div class="col-sm-8"></div>');
                                    } else {
                                        templElement = $('<div class="col-sm-12"></div>');
                                    }

                                    this.$el.find("#dashboardWidgets").append(templElement);

                                    this.model.loadedWidgets = [DashboardWidgetLoader.generateWidget({
                                        "element": templElement,
                                        "widget": widget
                                    })];
                                }
                            }, _this));
                        } else {
                            _this.$el.find(".widget-empty-state").show();
                        }
                    });
                });
            }
        },

        loadWorkflow: function loadWorkflow(roles, callback) {
            if (_.indexOf(roles, 'ui-admin') !== -1) {
                tasksDashboard.data.mode = "openidm-admin";
                tasksDashboard.render([], callback);
            } else {
                tasksDashboard.data.mode = "user";
                tasksDashboard.render([], callback);
            }
        }
    });

    return new Dashboard();
});
