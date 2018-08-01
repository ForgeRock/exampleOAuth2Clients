"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery"], function ($) {

    var obj = {};

    obj.init = function () {
        $("#popup").on('mouseleave', function () {
            obj.hide();
        });
    };

    obj.setContent = function (content) {
        $("#popup-content").html(content);
    };

    obj.setPositionBy = function (element) {
        var ph,
            left = $(element).position().left,
            top = $(element).position().top,
            h = $(element).height();

        $("#popup").css('left', left);
        $("#popup").css('top', top);

        $("#popup").css('height', h);
        $("#popup-content").css("margin-left", 20);

        ph = $("#popup-content").height();
        $("#popup-content").css("margin-top", -ph * 1.2);
    };

    obj.show = function () {
        $("#popup").show();
    };

    obj.hide = function () {
        $("#popup").hide();
    };

    return obj;
});
