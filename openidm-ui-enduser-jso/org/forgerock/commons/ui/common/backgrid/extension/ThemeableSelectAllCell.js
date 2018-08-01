"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/**
 * Themeable extension to <code>Backgrid.Extension.SelectAll</code>.
 * <p>
 * The defaults provide automatic integration with Bootstrap 3.
 * @module org/forgerock/commons/ui/common/backgrid/extension/ThemeableSelectAllCell
 * @extends Backgrid.Extension.SelectRowCell
 * @see {@link http://backgridjs.com/ref/extensions/select-all.html|Backgrid.Extension.SelectAll}
 * @example
 * // Use RequireJS argument name...
 * new ThemeableSelectAllCell({ ... });
 * // ...or the reference on Backgrid.Extension
 * new Backgrid.Extension.ThemeableSelectAllCell({ ... });
 * // Use in a Backgrid column
 * {
 *   cell: ThemeableSelectAllCell,
 *   headerCell: "select-all"
 * }
 */
define(["backgrid-selectall", "org/forgerock/commons/ui/common/backgrid/Backgrid"], function (BackgridSelectAll, Backgrid) {
    Backgrid.Extension.ThemeableSelectAllCell = Backgrid.Extension.SelectRowCell.extend({
        /**
         * @inheritdoc
         */
        onChange: function onChange() {
            var checked = this.$el.find("input[type=checkbox]").prop("checked");
            this.$el.parent().toggleClass("info", checked);
            this.model.trigger("backgrid:selected", this.model, checked);
        }
    });

    return Backgrid.Extension.ThemeableSelectAllCell;
});
