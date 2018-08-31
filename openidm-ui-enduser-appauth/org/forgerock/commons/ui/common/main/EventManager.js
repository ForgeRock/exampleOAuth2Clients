"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore"], function ($, _) {

    var obj = {},
        eventRegistry = {},
        subscriptions = {};

    obj.sendEvent = function (eventId, event) {
        return $.when.apply($, _.map(eventRegistry[eventId], function (eventHandler) {
            var promise = $.Deferred();
            window.setTimeout(function () {
                $.when(eventHandler(event)).always(promise.resolve);
            });
            return promise;
        })).then(function () {
            var promise;
            if (_.has(subscriptions, eventId)) {
                promise = subscriptions[eventId];
                delete subscriptions[eventId];
                promise.resolve();
            }
            return;
        });
    };

    obj.registerListener = function (eventId, callback) {
        if (!_.has(eventRegistry, eventId)) {
            eventRegistry[eventId] = [callback];
        } else {
            eventRegistry[eventId].push(callback);
        }
    };

    obj.unregisterListener = function (eventId, callbackToRemove) {
        if (_.has(eventRegistry, eventId)) {
            if (callbackToRemove !== undefined) {
                eventRegistry[eventId] = _.omit(eventRegistry[eventId], function (callback) {
                    return callback === callbackToRemove;
                });
            } else {
                delete eventRegistry[eventId];
            }
        }
    };

    /**
     * Returns a promise that will be resolved the next time the provided eventId has completed processing.
     */
    obj.whenComplete = function (eventId) {
        if (!_.has(subscriptions, eventId)) {
            subscriptions[eventId] = $.Deferred();
        }
        return subscriptions[eventId];
    };

    return obj;
});
