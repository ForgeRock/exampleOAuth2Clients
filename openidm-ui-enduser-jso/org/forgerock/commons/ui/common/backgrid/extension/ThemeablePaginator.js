"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/**
 * Themeable extension to <code>Backgrid.Extension.Paginator</code>.
 * <p>
 * The defaults provide automatic integration with Bootstrap 3.
 * @module org/forgerock/commons/ui/common/backgrid/extension/ThemeablePaginator
 * @extends Backgrid.Extension.Paginator
 * @see {@link http://backgridjs.com/ref/extensions/paginator.html|Backgrid.Extension.Paginator}
 * @example
 * // Use RequireJS argument name...
 * new ThemeablePaginator({ ... });
 * // ...or the reference on Backgrid.Extension
 * new Backgrid.Extension.ThemeablePaginator({ ... });
 */
define(["jquery", "backgrid.paginator", "org/forgerock/commons/ui/common/backgrid/Backgrid"], function ($, BackgridPaginator, Backgrid) {
    Backgrid.Extension.ThemeablePaginator = Backgrid.Extension.Paginator.extend({
        /**
         * @default
         */
        className: "text-center",

        /**
         * @inheritdoc
         */
        controls: {
            rewind: {
                label: "&laquo;",
                title: $.t("common.grid.pagination.first")
            },
            back: {
                label: "&lsaquo;",
                title: $.t("common.grid.pagination.previous")
            },
            forward: {
                label: "&rsaquo;",
                title: $.t("common.grid.pagination.next")
            },
            fastForward: {
                label: "&raquo;",
                title: $.t("common.grid.pagination.last")
            }
        },

        /**
         * @property CSS class name to add to <code>ul</code> element
         * @default
         */
        ulClassName: "pagination",

        /**
         * @inheritdoc
         */
        render: function render() {
            Backgrid.Extension.Paginator.prototype.render.call(this);

            if (this.ulClassName) {
                this.$el.find("ul").addClass(this.ulClassName);
            }

            return this;
        }
    });

    return Backgrid.Extension.ThemeablePaginator;
});
