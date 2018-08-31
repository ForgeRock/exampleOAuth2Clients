'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/*
 * Copyright 2012-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define([], function () {

    var proto = "__proto__";

    // From html5-boilerplate: https://raw2.github.com/h5bp/html5-boilerplate/master/js/plugins.js
    (function () {
        var method,
            noop = function noop() {},
            methods = ['assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error', 'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log', 'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd', 'timeStamp', 'trace', 'warn'],
            length = methods.length,
            console = window.console = window.console || {};

        while (length--) {
            method = methods[length];

            // Only stub undefined methods.
            if (!console[method]) {
                console[method] = noop;
            }
        }
    })();

    //this is here to catch the issue IE 8 has with getPrototypeOf method
    if (typeof Object.getPrototypeOf !== "function") {
        if (_typeof("internet_explorer"[proto]) === "object") {
            Object.getPrototypeOf = function (o) {
                return o[proto];
            };
        } else {
            Object.getPrototypeOf = function (o) {
                return o.constructor.prototype;
            };
        }
    }

    if (typeof Object.create !== "function") {
        Object.create = function (o) {
            function F() {}
            F.prototype = o;
            return new F();
        };
    }
});
