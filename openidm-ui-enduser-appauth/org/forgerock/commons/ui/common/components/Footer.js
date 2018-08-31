"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "org/forgerock/commons/ui/common/main/AbstractView"], function ($, AbstractView) {
    return AbstractView.extend({
        element: "#footer",
        template: "templates/common/FooterTemplate.html",
        noBaseTemplate: true,

        /**
         * Retrieves the version number of the product
         * @return {Promise} Promise representing the return version
         */
        getVersion: function getVersion() {
            throw new Error("#getVersion not implemented");
        },
        render: function render() {
            var self = this;

            this.data = {};

            if (this.showVersion()) {
                this.getVersion().then(function (version) {
                    self.data.version = version;
                }).always(self.parentRender.bind(self)).always(function () {
                    $("body").addClass("footer-deep");
                });
            } else {
                self.parentRender();
                $("body").removeClass("footer-deep");
            }
        },
        /**
         * Determines if to show the version
         * @return {boolean} Whether to show the version
         */
        showVersion: function showVersion() {
            return false;
        }
    });
});
