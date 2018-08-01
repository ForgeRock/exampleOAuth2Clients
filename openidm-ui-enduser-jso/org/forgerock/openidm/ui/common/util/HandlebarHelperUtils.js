"use strict";

/*
 * Copyright 2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["lodash", "handlebars"], function (_, Handlebars) {
    /**
     * @description A handlebars helper checking if an item is contained in a list
     *
     * @example:
     *
     * {{#contains ["cat", "dog"]  "bird"}}
     *      <span>DOES CONTAIN ITEM</span>
     * {{else}}
     *      <span>DOES NOT CONTAIN</span>
     * {{/contains}}
     */
    Handlebars.registerHelper("contains", function (list, item, options) {
        if (_.indexOf(list, item) >= 0) {
            return options.fn(item);
        } else {
            return options.inverse(item);
        }
    });

    /**
     * @description A handlebars helper that "eaches" over the union of two lists
     *
     * @example:
     *
     * {{#eachTwoLists ["cat", "dog"]  ["bird", "cat", "bug"]}}
     *      <span>{{this}}</span>
     * {{/eachTwoLists}}
     *
     * Looks like: cat dog bird bug
     */
    Handlebars.registerHelper("eachTwoLists", function (list1, list2, options) {
        var ret = "";

        _.each(_.union(list1, list2), function (val) {
            ret = ret + options.fn(val);
        });

        return ret;
    });
});
