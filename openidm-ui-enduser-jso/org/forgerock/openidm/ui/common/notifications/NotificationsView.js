"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "handlebars", "org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/openidm/ui/common/notifications/Notifications"], function ($, _, Handlebars, AbstractView, constants, EventManager, Notifications) {
    var NotificationsView = AbstractView.extend({
        template: "templates/notifications/NotificationMessageTemplate.html",
        partials: ["partials/notifications/_notification.html", "partials/notifications/_noNotifications.html"],
        noBaseTemplate: true,
        notificationItems: [],
        loaded: false,

        initialize: function initialize(args, options) {
            var _this = this;

            this.notifications = new Notifications.Collection();
            EventManager.registerListener("NOTIFICATION_DELETE", function (id) {
                if (_this.notifications.get(id)) {
                    _this.notifications.remove(id);
                }
                _this.renderNotifications();
                _this.trigger("change");
            });
            AbstractView.prototype.initialize.call(this, args, options);
        },

        render: function render(args, callback) {
            var _this2 = this;

            // allows render on different elements
            if (args && args.el) {
                this.element = args.el;
            }
            if (!this.loaded) {
                this.parentRender(function () {
                    _this2.fetchNotifications(function (collection, response, options) {
                        _this2.loaded = true;
                        _this2.renderNotifications();
                    });
                });
            } else {
                this.renderNotifications();
            }
            return this;
        },

        fetchNotifications: function fetchNotifications(callback) {
            var _this3 = this;

            var error = function error() {
                EventManager.sendEvent(constants.EVENT_GET_NOTIFICATION_FOR_USER_ERROR);
            },
                success = function success(collection, response, options) {
                _this3.notifications.reset(collection.notifications);

                if (callback) {
                    callback(collection.notifications, response, options);
                }
            };

            this.notifications.fetch({ success: success, error: error });
        },

        renderNotifications: function renderNotifications() {
            var _this4 = this;

            this.$el.empty();
            if (this.notifications.length === 0) {
                this.$el.html(Handlebars.compile("{{> notifications/_noNotifications}}")());
            } else {
                this.notifications.forEach(function (notification) {
                    var notificationItem = new Notifications.ItemView({
                        model: notification,
                        template: Handlebars.compile("{{> notifications/_notification}}")
                    });
                    _this4.$el.append(notificationItem.el);
                    _this4.notificationItems.push(notificationItem);
                });
            }
        }
    });

    return NotificationsView;
});
