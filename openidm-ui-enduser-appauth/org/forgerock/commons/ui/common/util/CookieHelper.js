"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["lodash"], function (_) {

    /**
     * @exports org/forgerock/commons/ui/common/util/CookieHelper
     */
    var obj = {};

    /**
     * Creates a cookie with given parameters.
     * @param {String} name - cookie name.
     * @param {String} [value] - cookie value.
     * @param {Date} [expirationDate] - cookie expiration date.
     * @param {String} [path] - cookie path.
     * @param {String|String[]} [domain] - cookie domain(s).
     * @param {Boolean} [secure] - is cookie secure.
     * @returns {String} created cookie.
     */
    obj.createCookie = function (name, value, expirationDate, path, domain, secure) {
        var expirationDatePart, nameValuePart, pathPart, domainPart, securePart;

        expirationDatePart = expirationDate ? ";expires=" + expirationDate.toGMTString() : "";
        nameValuePart = name + "=" + value;
        pathPart = path ? ";path=" + path : "";
        domainPart = domain ? ";domain=" + domain : "";
        securePart = secure ? ";secure" : "";

        return nameValuePart + expirationDatePart + pathPart + domainPart + securePart;
    };

    /**
     * Sets a cookie with given parameters in the browser.
     * @param {String} name - cookie name.
     * @param {String} [value] - cookie value.
     * @param {Date} [expirationDate] - cookie expiration date.
     * @param {String} [path] - cookie path.
     * @param {String|String[]} [domain] - cookie domain(s). Use empty array for creating host-only cookies.
     * @param {Boolean} [secure] - is cookie secure.
     */
    obj.setCookie = function (name, value, expirationDate, path, domains, secure) {
        if (!_.isArray(domains)) {
            domains = [domains];
        }

        if (domains.length === 0) {
            document.cookie = obj.createCookie(name, value, expirationDate, path, undefined, secure);
        } else {
            _.each(domains, function (domain) {
                document.cookie = obj.createCookie(name, value, expirationDate, path, domain, secure);
            });
        }
    };

    /**
     * Returns cookie with a given name.
     * @param {String} name - cookie name.
     * @returns {String} cookie or undefined if cookie was not found
     */
    obj.getCookie = function (c_name) {
        var i,
            x,
            y,
            cookies = document.cookie.split(";");
        for (i = 0; i < cookies.length; i++) {
            x = cookies[i].substr(0, cookies[i].indexOf("="));
            y = cookies[i].substr(cookies[i].indexOf("=") + 1);
            x = x.replace(/^\s+|\s+$/g, "");
            if (x === c_name) {
                return unescape(y);
            }
        }
    };

    /**
     * Deletes cookie with given parameters.
     * @param {String} name - cookie name.
     * @param {String} [path] - cookie path.
     * @param {String|String[]} [domain] - cookie domain(s).
     */
    obj.deleteCookie = function (name, path, domains) {
        var date = new Date();
        date.setTime(date.getTime() + -1 * 24 * 60 * 60 * 1000);
        obj.setCookie(name, "", date, path, domains);
    };

    /**
     * Checks if cookies are enabled.
     * @returns {Boolean} whether cookies enabled or not.
     */
    obj.cookiesEnabled = function () {
        this.setCookie("cookieTest", "test");
        if (!this.getCookie("cookieTest")) {
            return false;
        }
        this.deleteCookie("cookieTest");
        return true;
    };

    return obj;
});
