"use strict";

/*
 * Copyright 2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "handlebars", "org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/openidm/ui/common/notifications/NotificationsView", "org/forgerock/commons/ui/common/main/Configuration"], function ($, _, Handlebars, AbstractView, constants, EventManager, NotificationsView, configuration) {
    var NavigationNotificationsView = AbstractView.extend({
        events: {
            "click [data-toggle='popover']": "showPopover"
        },
        noBaseTemplate: true,

        render: function render(args, callback) {
            var _this = this;

            if (_.has(args, "el")) {
                this.setElement(args.el);
            }
            this.View = new NotificationsView();
            this.notifications = this.View.notifications;

            if (configuration.loggedUser) {
                this.View.fetchNotifications(function (notifications) {
                    _this.updateBadge(notifications.length);
                });
            }

            this.initializePopover();
            this.nonPopoverClickHandler();

            // respond to changes withing the collection (e.g. an item was deleted elsewhere)
            this.View.on("change", function (event) {
                _this.updateBadge(_this.notifications.length);
            });

            this.registerListener();
        },

        registerListener: function registerListener() {
            var _this2 = this;

            // respond to changes to the user data
            EventManager.registerListener(constants.EVENT_DISPLAY_MESSAGE_REQUEST, function (event) {
                if (event === "profileUpdateSuccessful") {
                    _this2.View.fetchNotifications(function (notifications) {
                        _this2.updateBadge(notifications.length);
                    });
                }
            });
        },

        updateBadge: function updateBadge(count) {
            this.$el.find(".fr-badge-notification").empty();
            if (count > 0) {
                this.$el.find(".fr-badge-notification").text(count);
            } else {
                this.$el.find("[data-toggle='popover']").popover("hide");
            }
        },

        initializePopover: function initializePopover() {
            this.$el.find("[data-toggle='popover']").popover({
                html: true,
                title: "Notifications",
                placement: "bottom",
                trigger: "click"
            });
        },

        showPopover: function showPopover(e) {
            e.preventDefault();

            if (this.notifications.length) {
                this.View.render({ el: this.$el.find('.popover-content') });
                this.$el.find(".popover").addClass("fr-popover-notifications");
            } else {
                this.$el.find("[data-toggle='popover']").popover("hide");
            }
        },

        nonPopoverClickHandler: function nonPopoverClickHandler(e) {
            var _this3 = this;

            $('body').off('click');

            // click handler for closing popover
            $('body').on('click', function (e) {
                if (_this3.$el.find(".popover").is(":visible") && $(e.target).data('toggle') !== 'popover' && !$(e.target).hasClass("fa-bell") && $(e.target).parents('.popover.in').length === 0) {
                    $('[data-toggle="popover"]').popover('hide');
                    _this3.$el.find(".fa-bell").click();
                }
            });
        }
    });

    return new NavigationNotificationsView();
});
