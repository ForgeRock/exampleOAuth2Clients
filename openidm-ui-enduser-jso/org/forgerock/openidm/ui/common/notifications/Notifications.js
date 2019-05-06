"use strict";

/*
 * Copyright 2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "backbone", "handlebars", "moment", "org/forgerock/commons/ui/common/main/AbstractModel", "org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/main/ServiceInvoker"], function ($, _, Backbone, Handlebars, moment, AbstractModel, AbstractView, Constants, EventManager, ServiceInvoker) {
    var Collection, Notification, ItemView;

    Notification = AbstractModel.extend({
        url: Constants.host + Constants.context + "/endpoint/usernotifications"
    });

    Collection = Backbone.Collection.extend({
        model: Notification,
        url: Constants.host + Constants.context + "/endpoint/usernotifications/",
        parse: function parse(response) {
            return response.notifications;
        },
        initialize: function initialize() {
            this.on("destroy", function (model) {
                EventManager.sendEvent("NOTIFICATION_DELETE", model.get("_id"));
            });
        },
        fetch: function fetch(options) {
            // stub out notification API;
            var notificationPromise = $.Deferred().resolve({notifications:[]});
            /*
            var notificationPromise = ServiceInvoker.restCall({
                "url": this.url,
                "type": "GET"
            });
            */

            notificationPromise.then(options.success, options.error);
        }
    });

    ItemView = AbstractView.extend({
        tagName: "li",
        attributes: {
            "class": "list-group-item"
        },
        events: {
            "click .list-item-close": "deleteNotification"
        },

        noBaseTemplate: true,
        initialize: function initialize(args, options) {
            this.template = args.template;
            return this.render();
        },
        render: function render() {
            this.$el.empty();
            var data = _.cloneDeep(this.model.attributes);
            data = _.set(data, "createDate", moment.utc(data.createDate).format("LLL") + " UTC");
            this.$el.html(this.template(data));
            return this;
        },

        deleteNotification: function deleteNotification(event) {
            event.preventDefault();

            this.model.destroy({
                wait: true,
                error: function error(model, response, options) {
                    EventManager.sendEvent(Constants.EVENT_NOTIFICATION_DELETE_FAILED);
                }
            });
        }
    });

    return { Collection: Collection, Notification: Notification, ItemView: ItemView };
});
