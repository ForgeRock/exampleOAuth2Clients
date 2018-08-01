"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/openidm/ui/common/delegates/SystemHealthDelegate", "org/forgerock/openidm/ui/common/dashboard/widgets/MemoryUsageWidget", "org/forgerock/openidm/ui/common/dashboard/widgets/ReconProcessesWidget", "org/forgerock/openidm/ui/common/dashboard/widgets/CPUUsageWidget", "org/forgerock/openidm/ui/common/dashboard/widgets/QuickStartWidget", "org/forgerock/openidm/ui/common/dashboard/widgets/FullHealthWidget", "org/forgerock/openidm/ui/common/dashboard/widgets/NotificationWidget"], function ($, _, AbstractView, eventManager, constants, conf, SystemHealthDelegate, MemoryUsageWidget, ReconProcessesWidget, CPUUsageWidget, QuickStartWidget, FullHealthWidget, NotificationWidget) {
    var dwlInstance = {},
        DashboardWidgetLoader = AbstractView.extend({
        template: "templates/dashboard/DashboardWidgetLoaderTemplate.html",
        noBaseTemplate: true,
        model: {},
        data: {},
        events: {},
        /*
         Available Widgets:
            lifeCycleMemoryHeap - Current heap memory
            lifeCycleMemoryNonHeap - Current none heap memory
            cpuUsage - Shows current CPU usage of the system
            systemHealthFull - Load full widget of health information
            reconUsage - Displays current recons in process. Polls every few seconds with updated information.
            quickStart - Widget displaying quick start cards to help users get start with core functionality
         */
        render: function render(args, callback) {
            this.element = args.element;

            this.model.widgetList = {
                lifeCycleMemoryHeap: {
                    name: $.t("dashboard.memoryUsageHeap"),
                    widget: MemoryUsageWidget
                },
                lifeCycleMemoryNonHeap: {
                    name: $.t("dashboard.memoryUsageNonHeap"),
                    widget: MemoryUsageWidget
                },
                reconUsage: {
                    name: $.t("dashboard.reconProcesses"),
                    widget: ReconProcessesWidget
                },
                cpuUsage: {
                    name: $.t("dashboard.cpuUsage"),
                    widget: CPUUsageWidget
                },
                quickStart: {
                    name: $.t("dashboard.quickStart.quickStartTitle"),
                    widget: QuickStartWidget
                },
                notifications: {
                    name: $.t("common.notification.notifications"),
                    widget: NotificationWidget
                }
            };

            this.data.widgetType = args.widget.type;

            this.data.widget = this.model.widgetList[args.widget.type];

            this.parentRender(_.bind(function () {
                args.element = this.$el.find(".widget");
                args.title = this.data.widget.name;
                args.showConfigButton = false;

                this.model.widget = this.model.widgetList[this.data.widgetType].widget.generateWidget(args, callback);
            }, this));
        }
    });

    dwlInstance.generateWidget = function (loadingObject, callback) {
        var widget = {};

        $.extend(true, widget, new DashboardWidgetLoader());

        widget.render(loadingObject, callback);

        return widget;
    };

    return dwlInstance;
});
