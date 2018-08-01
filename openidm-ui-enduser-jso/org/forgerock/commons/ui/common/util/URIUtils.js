'use strict';

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["lodash"], function (_) {
    /**
     * @exports org/forgerock/commons/ui/common/util/URIUtils
     */
    var obj = {};
    /**
     * Returns an unescaped composite query string constructed from:<br>
     * <ul><li>Fragment query string</li>
     * <li>URL query string</li></ul>
     * <p>
     * If a fragment query string is present it overrides the URL query string entirely
     * @returns {string} Unescaped query string
     */
    obj.getCurrentCompositeQueryString = function () {
        var urlQueryString = obj.getCurrentQueryString(),
            fragmentQueryString = obj.getCurrentFragmentQueryString();

        return fragmentQueryString.length ? fragmentQueryString : urlQueryString;
    };

    /**
     * Returns the fragment component of the current URI
     *
     * Use instead of the inconsistent window.location.hash as Firefox unescapes this parameter incorrectly
     * @see {@link https://bugzilla.mozilla.org/show_bug.cgi?id=135309}
     * @returns {String} Unescaped fragment or empty string if no fragment was found
     */
    obj.getCurrentFragment = function () {
        return obj.getCurrentUrl().split('#')[1] || '';
    };

    /**
     * Returns the query string from the fragment component
     * @returns {String} Unescaped query string or empty string if no query string was found
     */
    obj.getCurrentFragmentQueryString = function () {
        var fragment = obj.getCurrentFragment(),
            queryString = '';

        if (fragment.indexOf('&') > -1) {
            queryString = fragment.substring(fragment.indexOf('&') + 1);
        }

        return queryString;
    };

    /**
     * Returns the current origin (http://host:8080 in http://host:8080/foo/bar)
     * @returns {string} the current origin
     */
    obj.getCurrentOrigin = function () {
        return window.location.protocol + "//" + window.location.host;
    };

    /**
     * Returns the current path name (/foo/bar in http://host:8080/foo/bar)
     * @returns {string} the current path name
     */
    obj.getCurrentPathName = function () {
        return window.location.pathname;
    };

    /**
     * Returns the value a single query parameter from the current URL
     * @param {string} paramName the name of the query parameter to find
     * @returns {string} the value of the query parameter or null if there is no matching parameter
     */
    obj.getCurrentQueryParam = function (paramName) {
        var urlParams = obj.parseQueryString(obj.getCurrentCompositeQueryString());
        if (urlParams && urlParams.hasOwnProperty(paramName)) {
            return urlParams[paramName];
        } else {
            return null;
        }
    };

    /**
     * Returns the query string from the URI
     * @returns {string} Unescaped query string or empty string if no query string was found
     */
    obj.getCurrentQueryString = function () {
        var queryString = window.location.search;

        return queryString.substr(1, queryString.length);
    };

    /**
     * Returns the current full URL
     * @returns {string} the current full URL
     */
    obj.getCurrentUrl = function () {
        return window.location.href;
    };

    /**
     * Converts a string of query parameters (key1=value&key2=value) into an object of key/value pairs
     * @param {string} queryString An encoded query string
     * @returns {object} An object of key/value pairs
     */
    obj.parseQueryString = function (queryString) {
        if (queryString) {
            return _.object(_.map(queryString.split("&"), function (pair) {
                return _.map(pair.split("=", 2), decodeURIComponent);
            }));
        }
        return {};
    };

    return obj;
});
