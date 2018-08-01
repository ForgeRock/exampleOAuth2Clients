"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/openidm/ui/common/dashboard/widgets/AbstractWidget", "org/forgerock/openidm/ui/common/dashboard/widgets/MemoryUsageWidget", "org/forgerock/openidm/ui/common/dashboard/widgets/CPUUsageWidget"], function ($, _, AbstractWidget, MemoryUsageWidget, CPUUsageWidget) {
    var widgetInstance = {},
        Widget = AbstractWidget.extend({
        template: "templates/dashboard/widget/DashboardTripleWidgetTemplate.html",

        widgetRender: function widgetRender(args, callback) {
            this.data.menuItems = [{
                "icon": "fa-refresh",
                "menuClass": "refresh-health-info",
                "title": "Refresh"
            }];

            this.events["click .refresh-health-info"] = "refreshHealth";

            this.parentRender(_.bind(function () {
                this.model.cpuWidget = CPUUsageWidget.generateWidget({
                    element: this.$el.find(".left-chart"),
                    widget: {
                        type: "cpuUsage",
                        simpleWidget: true
                    }
                });

                this.model.memoryHeapWidget = MemoryUsageWidget.generateWidget({
                    element: this.$el.find(".center-chart"),
                    widget: {
                        type: "lifeCycleMemoryHeap",
                        simpleWidget: true
                    }
                });

                this.model.memoryNonHeapWidget = MemoryUsageWidget.generateWidget({
                    element: this.$el.find(".right-chart"),
                    widget: {
                        type: "lifeCycleMemoryNonHeap",
                        simpleWidget: true
                    }
                });

                if (callback) {
                    callback(this);
                }
            }, this));
        },

        resize: function resize() {
            this.model.cpuWidget.resize();
            this.model.memoryHeapWidget.resize();
            this.model.memoryNonHeapWidget.resize();
        },

        refreshHealth: function refreshHealth(event) {
            event.preventDefault();

            this.model.cpuWidget.refresh();
            this.model.memoryHeapWidget.refresh();
            this.model.memoryNonHeapWidget.refresh();
        }
    });

    widgetInstance.generateWidget = function (loadingObject, callback) {
        var widget = {};

        $.extend(true, widget, new Widget());

        widget.render(loadingObject, callback);

        return widget;
    };

    return widgetInstance;
});
