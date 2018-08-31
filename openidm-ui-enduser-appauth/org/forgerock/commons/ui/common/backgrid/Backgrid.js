"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "backgrid"], function ($, Backgrid) {
    /**
     * Fixed behavior, when Backgrid automatically puts the name of the field as a class in the header.
     * Default behavior is bad, because those classes are not prefixed/suffixed and can clash with a css class name
     * which is in use. For example we just had a field called "active" which was then being styled by bootstraps.css.
     * The data-attribute is used instead of class name in the overrided version.
     * @override
     * */
    Backgrid.HeaderCell.prototype.render = function () {
        this.$el.empty();
        var column = this.column,
            sortable = Backgrid.callByNeed(column.sortable(), column, this.collection),
            label;
        if (sortable) {
            label = $("<a>").text(column.get("label")).append("<b class='sort-caret'></b>");
        } else {
            label = document.createTextNode(column.get("label"));
        }

        this.$el.append(label);
        /* override code start */
        // updated to using the data-field attribute instead of class
        this.$el.attr("data-field", column.get("name"));
        /* override code end */
        this.$el.addClass(column.get("direction"));
        this.delegateEvents();
        return this;
    };

    /**
     * @exports org/forgerock/commons/ui/common/backgrid/Backgrid
     */
    return Backgrid;
});
