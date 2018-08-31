"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["underscore", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/AbstractDelegate"], function (_, Constants, AbstractDelegate) {

    var obj = new AbstractDelegate(Constants.host + Constants.context + "");

    obj.searchResults = function (resource, props, searchString, comparisonOperator, additionalQuery) {
        var maxPageSize = 10,
            queryFilter = additionalQuery;

        if (searchString.length) {
            queryFilter = obj.generateQueryFilter(props, searchString, additionalQuery, comparisonOperator); // [a,b] => "a or (b)"; [a,b,c] => "a or (b or (c))"
        }

        return this.serviceCall({
            "type": "GET",
            "url": "/" + resource + "?_sortKeys=" + props[0] + "&_pageSize=" + maxPageSize + "&_queryFilter=" + queryFilter
        }).then(function (qry) {
            return _.take(qry.result, maxPageSize); //we never want more than 10 results from search in case _pageSize does not work
        }, function (error) {
            console.error(error);
        });
    };

    obj.generateQueryFilter = function (props, searchString, additionalQuery, comparisonOperator) {
        var operator = comparisonOperator ? comparisonOperator : "sw",
            queryFilter,
            conditions = _(props).reject(function (p) {
            return !p;
        }).map(function (p) {
            var op = operator;

            if (p === "_id" && op !== "neq") {
                op = "eq";
            }

            if (op !== "pr") {
                return p + ' ' + op + ' "' + encodeURIComponent(searchString) + '"';
            } else {
                return p + ' pr';
            }
        }).value();

        queryFilter = "(" + conditions.join(" or (") + new Array(conditions.length).join(")") + ")";

        if (additionalQuery) {
            queryFilter = "(" + queryFilter + " and (" + additionalQuery + "))";
        }

        return queryFilter;
    };

    return obj;
});
