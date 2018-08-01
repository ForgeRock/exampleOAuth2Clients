"use strict";

/*
 * Copyright 2018 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["lodash"], function (_) {
    var obj = {};

    /**
     * Traverse object of unknown complexity and replace any 'empty string' with 'null'
     * @param {object} data
     * @returns {object} identical to data object with all 'empty string' converted to 'null'
     */
    obj.replaceEmptyStringWithNull = function (data) {
        var searchForEmptyString,
            traverseObject = function traverseObject(obj) {
            return _.forOwn(obj, function (value, key) {
                obj[key] = searchForEmptyString(value);
            });
        };

        searchForEmptyString = function searchForEmptyString(value) {
            if (!_.isString(value)) {
                if (_.isObject(value)) {
                    return traverseObject(value);
                } else {
                    return value;
                }
            } else if (value === '') {
                return null;
            } else {
                return value;
            }
        };

        return searchForEmptyString(data);
    };

    return obj;
});
