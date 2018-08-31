"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "spin"], function ($, Spinner) {

    var obj = {};

    obj.showSpinner = function (priority) {
        if (obj.spinner) {
            obj.hideSpinner();
        }

        obj.spinner = new Spinner().spin(document.getElementById('wrapper'));
        $(".spinner").position({
            of: $(window),
            my: "center center",
            at: "center center"
        });

        if (priority && (!obj.priority || priority > obj.priority)) {
            obj.priority = priority;
        }

        $("#wrapper").attr("aria-busy", true);
    };

    obj.hideSpinner = function (priority) {
        if (obj.spinner && (!obj.priority || priority && priority >= obj.priority)) {
            obj.spinner.stop();
            delete obj.priority;
        }

        $("#wrapper").attr("aria-busy", false);
    };

    return obj;
});
