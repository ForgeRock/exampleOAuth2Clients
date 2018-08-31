"use strict";

/*
 * Copyright 2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/openidm/ui/common/dashboard/widgets/AbstractWidget", "org/forgerock/openidm/ui/common/notifications/NotificationsView"], function ($, _, AbstractWidget, NotificationsView) {
    var widgetInstance = {},
        Widget = AbstractWidget.extend({
        template: "templates/dashboard/widget/NotificationWidgetTemplate.html",
        model: {},

        widgetRender: function widgetRender(args, callback) {
            var notificationsView;

            this.parentRender(_.bind(function () {
                notificationsView = new NotificationsView();
                notificationsView.render({ el: this.$el.find(".notifications-body") });

                if (callback) {
                    callback(this);
                }
            }, this));
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
