"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["underscore", "backbone", "org/forgerock/commons/ui/common/backgrid/Backgrid", "org/forgerock/commons/ui/common/util/BackgridUtils"], function (_, Backbone, Backgrid, commonBackgridUtils) {
    var obj = _.extend({}, commonBackgridUtils);

    obj.queryFilter = function (data) {
        if (data === undefined) {
            data = {};
        }

        var params = [],
            additionalFilters = data._queryFilter || [],
            getFilter = function () {
            return function (filterName, filterQuery) {
                return filterName + ' sw "' + filterQuery.replace(/"/g, '\\"') + '"';
            };
        }();

        _.each(this.state.filters, function (filter) {
            if (filter.query() !== '') {
                params.push(getFilter(filter.name, filter.query()));
            }
        });

        if (additionalFilters !== "true") {
            params = params.concat(additionalFilters);
        }

        return params.length === 0 ? true : params.join(" AND ");
    };

    obj.getQueryParams = function (data, isSystemResource) {
        data = data || {};
        var queryParams = {
            _queryFilter: function _queryFilter() {
                return obj.queryFilter.call(this, { _queryFilter: data._queryFilter });
            },
            _fields: data._fields || "",
            _totalPagedResultsPolicy: "ESTIMATE"
        };

        if (isSystemResource) {
            delete queryParams._fields;
        }

        return queryParams;
    };

    obj.getState = function (sortCol, data) {
        var state = {
            pageSize: 50,
            sortKey: sortCol
        };

        if (data && (typeof data === "undefined" ? "undefined" : _typeof(data)) === 'object') {
            _.extend(state, data);
        }
        return state;
    };

    obj.escapedStringCell = function (prop) {
        return Backgrid.Cell.extend({
            render: function render() {
                if (this.model.get(prop)) {
                    this.$el.html(this.model.escape(prop));
                } else {
                    this.$el.html("");
                }
                return this;
            }
        });
    };

    return obj;
});
